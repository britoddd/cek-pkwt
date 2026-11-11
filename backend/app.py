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

from report import link_sources, parse_hr_draft, parse_report, source_index

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
# Under Cloudflare's 100 s proxy limit, so the browser gets our error instead of a bare 524 it can't read.
LANGFLOW_TIMEOUT = float(os.environ.get("LANGFLOW_TIMEOUT") or "90")
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
    CORPUS = list(csv.DictReader(f))
REGIONS = list(dict.fromkeys(
    row["region"] for row in CORPUS
    if row["topic"] == "upah_minimum" and row["region"] != "nasional" and row["status"] in ("berlaku", "belum_berlaku")
))
# Each citation in a report links to the official document it comes from.
SOURCES = source_index(CORPUS)

UNAVAILABLE = "Layanan CekPKWT sedang tidak tersedia. Coba lagi beberapa saat lagi."
DB_WAKING = ("Basis data regulasi sedang dibangunkan setelah lama tidak aktif. "
             "Coba lagi dalam 2–5 menit.")
TIMED_OUT = "Server terlalu lama merespons. Coba lagi beberapa saat lagi."
LANGFLOW_DOWN = "Mesin analisis CekPKWT (Langflow) tidak dapat dihubungi. Coba lagi beberapa saat lagi."

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
    except httpx.TimeoutException as exc:
        # A hibernated Astra DB can also hang here while it wakes up.
        log.error("Langflow timed out after %ss at %s: %r", LANGFLOW_TIMEOUT, url, exc)
        raise HTTPException(504, TIMED_OUT) from exc
    except httpx.HTTPError as exc:
        log.error("Langflow unreachable at %s: %r", url, exc)
        raise HTTPException(502, LANGFLOW_DOWN) from exc
    if res.is_error:
        # Langflow's error body says why: unknown flow ID, rejected key, or a failing component.
        log.error("Langflow returned %s for %s: %s", res.status_code, url, res.text[:500])
        # The body can quote the contract, so map it to a fixed message instead of passing it on.
        # Free-tier Astra DB hibernates after ~2 idle days and answers "invalid token" until it wakes.
        body = res.text.lower()
        if "astra" in body or "hibernat" in body:
            raise HTTPException(503, DB_WAKING)
        raise HTTPException(502, f"{UNAVAILABLE} (kode {res.status_code})")
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
    report = parse_report(markdown)
    return {"markdown": markdown, "report": link_sources(report, SOURCES) if report else None}


@app.post("/api/ask")
async def ask(body: AskIn):
    return {"answer": await run_flow("ask", body.question)}


@app.post("/api/hr-draft")
async def hr_draft(body: HrDraftIn):
    # The flow only writes the text. The page opens it in the user's own Gmail compose window, mailto:
    # or WhatsApp, so the draft lives in the user's account and nothing is sent for them.
    raw = await run_flow("hr", body.findings)
    return {"raw": raw, **parse_hr_draft(raw)}
