"""Precompute the economy-wide impact of HR 904 for the dashboard.

HR 904 eliminates federal income taxation of Social Security benefits by zeroing
out the IRC 86 taxability rates. This dashboard analyses a single fixed reform,
so the impact is computed ONCE here (one economy call for 2026) and shipped as
static JSON at ``public/data/impact.json`` (the ``precomputed`` data pattern).
The frontend imports that file directly; there is no runtime backend.

CI COMPUTE CONSTRAINT (headless / 16GB runner):
    This script MUST NOT construct a local policyengine-us ``Microsimulation`` —
    doing so OOM-kills the CI runner (exit 143). Instead it fetches the
    economy-wide comparison from the hosted PolicyEngine v1 API
    (https://api.policyengine.org), the same server-side compute that powers
    policyengine.org. Only the Python standard library is required.

Usage:
    python3 scripts/precompute.py
"""

from __future__ import annotations

import datetime as dt
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
REFORM_PATH = REPO_ROOT / "reform.json"
OUTPUT_PATH = REPO_ROOT / "public" / "data" / "impact.json"

API_BASE = "https://api.policyengine.org"
COUNTRY = "us"
REGION = "us"
TIME_PERIOD = 2026
DATASET = "enhanced_cps"
BASELINE_POLICY_ID = 2  # US current law

POLL_INTERVAL_SECONDS = 5
POLL_TIMEOUT_SECONDS = 1800

BANDS = [
    "Gain more than 5%",
    "Gain less than 5%",
    "No change",
    "Lose less than 5%",
    "Lose more than 5%",
]


def _get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.load(resp)


def _post_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.load(resp)


def create_reform_policy() -> int:
    """POST the HR 904 reform_dict to /{country}/policy and return its policy_id."""
    with open(REFORM_PATH) as f:
        reform = json.load(f)
    result = _post_json(f"{API_BASE}/{COUNTRY}/policy", {"data": reform})
    return int(result["result"]["policy_id"])


def fetch_economy_impact(policy_id: int) -> dict:
    """GET the economy comparison for 2026, polling until status 'ok'."""
    query = urllib.parse.urlencode(
        {"region": REGION, "time_period": TIME_PERIOD, "dataset": DATASET}
    )
    url = (
        f"{API_BASE}/{COUNTRY}/economy/{policy_id}"
        f"/over/{BASELINE_POLICY_ID}?{query}"
    )
    deadline = time.time() + POLL_TIMEOUT_SECONDS
    while True:
        payload = _get_json(url)
        status = payload.get("status")
        if status == "ok":
            return payload["result"]
        if status == "error":
            raise RuntimeError(f"API returned error: {payload.get('message')}")
        if time.time() > deadline:
            raise TimeoutError("Economy impact did not complete before timeout.")
        time.sleep(POLL_INTERVAL_SECONDS)


def _rate(node: dict) -> dict:
    return {"baseline": float(node["baseline"]), "reform": float(node["reform"])}


def trim(result: dict) -> dict:
    """Trim the full economy result to the fields the dashboard renders."""
    budget = result["budget"]
    decile = result["decile"]
    poverty = result["poverty"]["poverty"]["age"]
    intra = result["intra_decile"]

    return {
        "budget": {
            "budgetary_impact": float(budget["budgetary_impact"]),
            "tax_revenue_impact": float(budget.get("tax_revenue_impact", 0.0)),
            "baseline_net_income": float(budget.get("baseline_net_income", 0.0)),
        },
        "decile": {
            "relative": {k: float(v) for k, v in decile["relative"].items()},
            "average": {k: float(v) for k, v in decile["average"].items()},
        },
        "poverty": {
            "all": _rate(poverty["all"]),
            "senior": _rate(poverty["senior"]),
            "child": _rate(poverty["child"]),
            "adult": _rate(poverty["adult"]),
        },
        "intra_decile": {
            "all": {band: float(intra["all"][band]) for band in BANDS},
            "deciles": {
                band: [float(x) for x in intra["deciles"][band]] for band in BANDS
            },
        },
    }


def main() -> None:
    print("Creating reform policy via the hosted PolicyEngine API…")
    policy_id = create_reform_policy()
    print(f"  reform policy_id = {policy_id}")

    print(f"Fetching economy-wide impact for {TIME_PERIOD} (polling until 'ok')…")
    result = fetch_economy_impact(policy_id)
    impact = trim(result)
    impact["metadata"] = {
        "time_period": TIME_PERIOD,
        "region": REGION,
        "dataset": DATASET,
        "api_base": API_BASE,
        "baseline_policy_id": BASELINE_POLICY_ID,
        "reform_policy_id": policy_id,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(impact, f, indent=2)
        f.write("\n")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
