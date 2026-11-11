"""Compare LLMs for the contract check on the Langflow server.

For each model, a temporary copy of check_work_contract is imported on the server with only the
Agent's model (and its API key variable) changed. The 15 contracts are sent to that copy 3 times,
with the same input the backend sends, and the copy is deleted afterwards. The production flow
is never changed. Scoring is run_eval.py's, unchanged.

  python evaluation/compare_models.py run "Google Generative AI:gemini-3.1-flash-lite" --key-var GOOGLE_API_KEY
  python evaluation/compare_models.py score "Google Generative AI:gemini-3.1-flash-lite"
  python evaluation/compare_models.py table        # results/models/comparison.md, with production gpt-5.4-mini

Needs LANGFLOW_URL / LANGFLOW_API_KEY (.env, through the SSH tunnel). Results go to
results/models/<model>/ in the same layout as results/. `run` resumes like run_eval.py.
"""

import argparse
import copy
import gzip
import json
import re
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
import run_eval  # noqa: E402

OUT = run_eval.RESULTS / "models"
BASELINE = run_eval.RESULTS / "2026-11-10" / "summary.json"  # production gpt-5.4-mini, same contracts and runs


def env(name: str) -> str:
    for line in (HERE.parent / ".env").read_text(encoding="utf-8").splitlines():
        k, _, v = line.partition("=")
        if k.strip() == name:
            return v.strip()
    return ""


BASE = (env("LANGFLOW_URL").split("/api/")[0] or "http://localhost:7860").rstrip("/")


def langflow(method: str, path: str, body: dict | None = None, timeout: int = 240) -> tuple[int, object]:
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"x-api-key": env("LANGFLOW_API_KEY"), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            status, raw = res.status, res.read()
    except urllib.error.HTTPError as exc:
        status, raw = exc.code, exc.read()
    except (urllib.error.URLError, TimeoutError) as exc:
        return 0, repr(exc)
    if raw[:2] == bytes([0x1F, 0x8B]):  # Langflow gzips even when asked not to
        raw = gzip.decompress(raw)
    text = raw.decode("utf-8", "replace")
    try:
        return status, json.loads(text) if text else None
    except json.JSONDecodeError:
        return status, text


def production_flow() -> dict:
    status, flows = langflow("GET", "/api/v1/flows/?get_all=true&header_flows=true")
    assert status == 200, flows
    fid = env("LANGFLOW_FLOW_CHECK") or next(f["id"] for f in flows if f["name"] == "check_work_contract")
    status, flow = langflow("GET", f"/api/v1/flows/{fid}")
    assert status == 200, flow
    return flow


def make_copy(model: str, key_var: str) -> str:
    """Import check_work_contract with only the Agent's model changed; returns the copy's id."""
    provider, _, name = model.partition(":")
    flow = production_flow()
    data = copy.deepcopy(flow["data"])
    agent = next(n for n in data["nodes"] if n["data"]["type"] == "Agent")["data"]["node"]["template"]
    known = [o for o in agent["model"].get("options") or [] if o["provider"] == provider and o["name"] == name]
    agent["model"]["value"] = known[:1] or [{"name": name, "provider": provider, "icon": provider, "metadata": {"tool_calling": True}}]
    agent["api_key"]["value"], agent["api_key"]["load_from_db"] = key_var, True
    status, res = langflow("POST", "/api/v1/flows/", {"name": f"eval-{slug(model)}-{uuid.uuid4().hex[:6]}",
                                                      "description": "Temporary copy for evaluation/compare_models.py; safe to delete.",
                                                      "data": data, "folder_id": flow.get("folder_id")})
    assert status in (200, 201), f"could not import the copy: HTTP {status} {str(res)[:300]}"
    return res["id"]


def check(flow_id: str, contract: str, region: str | None) -> tuple[int, str]:
    # Same text and payload as backend/app.py.
    text = f"{contract}\n\nLokasi kerja (dipilih pengguna): {region}" if region else contract
    status, res = langflow("POST", f"/api/v1/run/{flow_id}", {"input_value": text, "input_type": "chat", "output_type": "chat",
                                                             "session_id": str(uuid.uuid4())})
    if status == 200:
        try:
            return 200, res["outputs"][0]["outputs"][0]["results"]["message"]["text"]
        except (KeyError, IndexError, TypeError):
            return 0, str(res)[:500]
    return status, str(res)[:800]


def slug(model: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", model)


def use(model: str) -> Path:
    """Point run_eval at this model's results folder."""
    d = OUT / slug(model)
    d.mkdir(parents=True, exist_ok=True)
    run_eval.RESULTS, run_eval.RAW = d, d / "raw.jsonl"
    return d


def run(model: str, key_var: str, runs: int, only: list[str], pause: float) -> None:
    use(model)
    done = {(r["case"], r["run"]) for r in run_eval.load_raw() if r.get("markdown")}
    cases = [c for c in run_eval.load_cases()["cases"] if not only or c["id"] in only]
    todo = [(n, c) for n in range(1, runs + 1) for c in cases if (c["id"], n) not in done]
    if not todo:
        print("nothing to run")
        return
    flow_id = make_copy(model, key_var)
    print(f"temporary flow {flow_id}", flush=True)
    try:
        for n, case in todo:
            contract = (HERE / "contracts" / f"{case['id']}.txt").read_text(encoding="utf-8")
            for attempt in range(1, 5):
                started = time.time()
                status, out = check(flow_id, contract, case["region"])
                latency = round(time.time() - started, 1)
                if status == 200:
                    break
                print(f"  {case['id']} run {n}: HTTP {status} (attempt {attempt}): {out[:200]}", flush=True)
                # Free-tier quota errors come back from Langflow as a 500 quoting Google's 429.
                if re.search(r"PerDay|per day|TPD", out, re.I):
                    raise SystemExit("daily free quota reached; run again tomorrow to resume")
                if re.search(r"model_not_found|Error code: 40[13]|Could not import", out):
                    raise SystemExit("the model or its provider is not usable on this server")
                time.sleep(65)
            rec = {"case": case["id"], "run": n, "base": model, "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                   "status": status, "latency_s": latency,
                   "markdown": out if status == 200 else None, "error": None if status == 200 else out}
            with run_eval.RAW.open("a", encoding="utf-8") as f:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            print(f"{case['id']} run {n}: HTTP {status} in {latency}s", flush=True)
            time.sleep(pause)
    finally:
        status, _ = langflow("DELETE", f"/api/v1/flows/{flow_id}")
        print(f"deleted temporary flow {flow_id}: HTTP {status}", flush=True)


def score(model: str) -> None:
    use(model)
    run_eval.score()


def table() -> None:
    rows = [("OpenAI:gpt-5.4-mini (production, 10 Nov)", json.loads(BASELINE.read_text(encoding="utf-8")))]
    for d in sorted(OUT.iterdir()):
        if (d / "summary.json").exists():
            s = json.loads((d / "summary.json").read_text(encoding="utf-8"))
            rows.append((s["base"][0], s))
    pct = lambda a, b: f"{a}/{b} ({round(100 * a / b) if b else 0}%)"  # noqa: E731
    lines = ["| Model | Reports | Planted issues detected | ...with the correct article | False alarms on clean contracts | Clean reports without findings | Findings without citation | Citations found in corpus | Injection flagged, findings kept | Raw PII in reports | Median / p90 time |",
             "|---|---|---|---|---|---|---|---|---|---|---|"]
    for name, s in rows:
        d, c = s["detection"], s["citations"]
        inj = sum(1 for i in s["injection"] if i["flagged"] and i["still_reported"])
        lines.append("| " + " | ".join([
            name, f"{s['records']} ({s['failed_requests']} failed)", pct(d["detected"], d["opportunities"]),
            pct(d["with_supporting_article"], d["opportunities"]), str(s["clean"]["alarms"]),
            f"{s['clean']['reports_without_alarm']}/{s['clean']['reports']}",
            f"{s['findings_without_citation']}/{s['parser']['findings']}", pct(c["in_corpus"], c["total"]),
            f"{inj}/{len(s['injection'])}", str(len(s["pii_in_reports"])),
            f"{s['latency_s']['median']} / {s['latency_s']['p90']} s"]) + " |")
    issues = sorted(rows[0][1]["detection"]["per_issue"])
    lines += ["", "| Issue | " + " | ".join(n for n, _ in rows) + " |", "|---" * (len(rows) + 1) + "|"]
    lines += [f"| {i} | " + " | ".join(s["detection"]["per_issue"].get(i, "-") for _, s in rows) + " |" for i in issues]
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "comparison.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("model", help='"<provider>:<model>" as Langflow names them, e.g. "Google Generative AI:gemini-3.8-flash"')
    r.add_argument("--key-var", required=True, help="Langflow global variable holding the provider's API key")
    r.add_argument("--runs", type=int, default=3)
    r.add_argument("--only", nargs="*", default=[])
    r.add_argument("--pause", type=float, default=6, help="seconds between checks, to stay under free-tier per-minute limits")
    s = sub.add_parser("score")
    s.add_argument("model")
    sub.add_parser("table")
    a = p.parse_args()
    if a.cmd == "run":
        run(a.model, a.key_var, a.runs, a.only, a.pause)
    elif a.cmd == "score":
        score(a.model)
    else:
        table()
