"""CekPKWT API: validates requests from the web app and forwards them to the Langflow flows.

The Langflow API key stays here, never in the browser. Contract text is never logged or stored.
Run: uvicorn app:app --env-file ../.env
"""

import csv
import logging
import os
import uuid
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from report import parse_hr_draft, parse_report

# uvicorn's own logger, so these lines show up in the server console.
log = logging.getLogger("uvicorn.error")

# Only the server address is needed. Cut off any path pasted from an API or MCP URL (e.g. Bob's mcp.json).
_url = (os.environ.get("LANGFLOW_URL") or "http://localhost:7860").rstrip("/")
LANGFLOW_URL = _url.split("/api/")[0]
if LANGFLOW_URL != _url:
    log.warning("LANGFLOW_URL should be the Langflow server address only; using %s instead of %s", LANGFLOW_URL, _url)
LANGFLOW_API_KEY = os.environ.get("LANGFLOW_API_KEY") or ""
if not LANGFLOW_API_KEY:
    log.warning("LANGFLOW_API_KEY is empty; Langflow will reject the requests")
LANGFLOW_TIMEOUT = float(os.environ.get("LANGFLOW_TIMEOUT") or "180")
# Defaults are the flow IDs in langflow/*.json; set these if Langflow assigned new IDs on import.
FLOWS = {
    "check": os.environ.get("LANGFLOW_FLOW_CHECK") or "963cb46e-429b-4129-b08b-3f5094e08165",
    "ask": os.environ.get("LANGFLOW_FLOW_ASK") or "b3c99f8f-f3fb-4341-8ecb-02d75e5a0632",
    "hr": os.environ.get("LANGFLOW_FLOW_HR") or "6d28aae7-847a-4eb9-804f-48fc366f84fb",
}
log.info("Forwarding to Langflow at %s, flows %s", LANGFLOW_URL, FLOWS)

# Minimum-wage regions come from the same corpus the flows search, so the list never drifts.
# A region has one row per year once next year's wage is added (sync/corpus_sync.py), hence the dedupe.
with open(Path(__file__).parent.parent / "data" / "labor_corpus.csv", encoding="utf-8") as f:
    REGIONS = list(dict.fromkeys(
        row["region"] for row in csv.DictReader(f)
        if row["topic"] == "upah_minimum" and row["region"] != "nasional" and row["status"] in ("berlaku", "belum_berlaku")
    ))

UNAVAILABLE = "Layanan CekPKWT sedang tidak tersedia. Coba lagi beberapa saat lagi."

app = FastAPI(title="CekPKWT API")

# Browser origins allowed to call this API directly, comma-separated (e.g. the static host's domain).
# Empty = no cross-origin calls, which is all local dev needs: Vite forwards /api on the same origin.
FRONTEND_ORIGINS = [o.strip().rstrip("/") for o in (os.environ.get("FRONTEND_ORIGINS") or "").split(",") if o.strip()]
if FRONTEND_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=FRONTEND_ORIGINS,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    log.info("Allowing browser calls from %s", FRONTEND_ORIGINS)


class Input(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)


class CheckIn(Input):
    contract: str = Field(min_length=50, max_length=60_000)
    region: str | None = Field(default=None, max_length=60)


class AskIn(Input):
    question: str = Field(min_length=3, max_length=500)


class HrDraftIn(Input):
    findings: str = Field(min_length=10, max_length=10_000)


async def run_flow(flow: str, text: str) -> str:
    # A fresh session per request keeps one visitor's messages out of another's agent memory.
    payload = {"input_value": text, "input_type": "chat", "output_type": "chat", "session_id": str(uuid.uuid4())}
    url = f"{LANGFLOW_URL}/api/v1/run/{FLOWS[flow]}"
    try:
        async with httpx.AsyncClient(timeout=LANGFLOW_TIMEOUT) as client:
            res = await client.post(url, json=payload, headers={"x-api-key": LANGFLOW_API_KEY})
    except httpx.HTTPError as exc:
        log.error("Langflow unreachable at %s: %r", url, exc)
        raise HTTPException(502, UNAVAILABLE) from exc
    if res.is_error:
        # Langflow's error body says why: unknown flow ID, rejected key, or a failing component.
        log.error("Langflow returned %s for %s: %s", res.status_code, url, res.text[:500])
        raise HTTPException(502, UNAVAILABLE)
    try:
        return res.json()["outputs"][0]["outputs"][0]["results"]["message"]["text"]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        # Not logging the body: it holds the flow output, which can quote the contract.
        log.error("Unexpected Langflow response shape for flow %r: %r", flow, exc)
        raise HTTPException(502, UNAVAILABLE) from exc


@app.get("/api/regions")
def regions() -> list[str]:
    return REGIONS


@app.post("/api/check")
async def check(body: CheckIn):
    if body.region and body.region not in REGIONS:
        raise HTTPException(422, "Lokasi kerja tidak dikenal.")
    text = f"{body.contract}\n\nLokasi kerja (dipilih pengguna): {body.region}" if body.region else body.contract
    markdown = await run_flow("check", text)
    return {"markdown": markdown, "report": parse_report(markdown)}


@app.post("/api/ask")
async def ask(body: AskIn):
    return {"answer": await run_flow("ask", body.question)}


@app.post("/api/hr-draft")
async def hr_draft(body: HrDraftIn):
    # No HR address is sent on purpose: the Composio Gmail tool is linked to one account,
    # so a web visitor's draft would land in the app owner's mailbox. The page opens the user's own
    # Gmail compose window, mailto: or WhatsApp instead.
    raw = await run_flow("hr", body.findings)
    return {"raw": raw, **parse_hr_draft(raw)}
