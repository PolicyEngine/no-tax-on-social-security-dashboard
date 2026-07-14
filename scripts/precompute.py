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
DATA_DIR = REPO_ROOT / "public" / "data"
OUTPUT_PATH = DATA_DIR / "impact.json"
PARAMETERS_PATH = DATA_DIR / "parameters.json"
VALIDATION_PATH = DATA_DIR / "validation.json"
HOUSEHOLD_PATH = DATA_DIR / "household.json"

API_BASE = "https://api.policyengine.org"
CALIBRATION_API_BASE = "https://calibration-diagnostics.vercel.app"
COUNTRY = "us"
REGION = "us"
TIME_PERIOD = 2026

# Reform parameter paths (all set to 0 by HR 904, effective 2026-01-01).
REFORM_PARAMS = [
    "gov.irs.social_security.taxability.rate.base.excess",
    "gov.irs.social_security.taxability.rate.base.benefit_cap",
    "gov.irs.social_security.taxability.rate.additional.excess",
    "gov.irs.social_security.taxability.rate.additional.benefit_cap",
    "gov.irs.social_security.taxability.rate.additional.bracket",
]

# External / prior benchmarks for the validation page (year-matched anchors).
BENCHMARKS = [
    {
        "source": "CRFB",
        "label": "Committee for a Responsible Federal Budget",
        "metric": "First-year revenue loss",
        "value": -94_000_000_000,
        "approximate": True,
        "note": "~$94B first-year estimate.",
    },
    {
        "source": "PolicyEngine (prior published)",
        "label": "PolicyEngine prior single-year score",
        "metric": "Single-year revenue loss",
        "value": -98_900_000_000,
        "year": 2025,
        "note": (
            "$98.9B for 2025; NOT directly comparable to the 2026 figure "
            "(different year, dataset version)."
        ),
    },
]

# Archetypal senior households swept over other (non-SS) taxable income.
HOUSEHOLD_EXAMPLES = {
    "single_senior_20k_ss": {
        "label": "Single filer, aged 67, $20k Social Security",
        "ss_benefit": 20_000,
        "married": False,
    },
    "married_seniors_40k_ss": {
        "label": "Married couple, aged 67, $40k combined Social Security",
        "ss_benefit": 40_000,
        "married": True,
    },
}
OTHER_INCOME_POINTS = list(range(0, 150_001, 5_000))
# NOTE: the economy endpoint no longer accepts an explicit `dataset` query param
# ("enhanced_cps" is deprecated). Omitting it uses the certified PolicyEngine
# bundle dataset — the same one that powers policyengine.org.
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
        {"region": REGION, "time_period": TIME_PERIOD}
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
    # Economy result shape: result["poverty"]["poverty"] -> {child, adult, senior, all}
    poverty = result["poverty"]["poverty"]
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


def _write(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(obj, f, indent=2)
        f.write("\n")
    print(f"Wrote {path}")


def write_parameters(metadata: dict) -> None:
    """parameters.json — the five reform params with current-law values.

    TODO(backend-builder): fetch each current-law value at 2026 from
    GET {API_BASE}/us/parameter/{param} (authoritative, never hardcoded).
    This stub emits placeholder current-law rates so the frontend builds.
    """
    placeholder_current_law = {
        "gov.irs.social_security.taxability.rate.base.excess": 0.5,
        "gov.irs.social_security.taxability.rate.base.benefit_cap": 0.5,
        "gov.irs.social_security.taxability.rate.additional.excess": 0.85,
        "gov.irs.social_security.taxability.rate.additional.benefit_cap": 0.85,
        "gov.irs.social_security.taxability.rate.additional.bracket": 0.85,
    }
    rows = [
        {
            "parameter": p,
            "current_law": placeholder_current_law[p],
            "reform_value": 0,
            "effective": "2026-01-01",
        }
        for p in REFORM_PARAMS
    ]
    _write(
        PARAMETERS_PATH,
        {
            "rows": rows,
            "metadata": {
                "time_period": TIME_PERIOD,
                "generated_at": metadata["generated_at"],
            },
        },
    )


def write_validation(metadata: dict) -> None:
    """validation.json — benchmarks, versions, and the SSA calibration check.

    TODO(backend-builder): fetch the live SSA calibration diagnostics from
    GET {CALIBRATION_API_BASE}/calibration/dashboard/api/populace/target-diagnostics?source=ssa
    and populate release_id / targets_checked / share_within_tolerance /
    out_of_tolerance_targets. This stub emits an empty calibration block.
    """
    _write(
        VALIDATION_PATH,
        {
            "benchmarks": BENCHMARKS,
            "calibration": {
                "release_id": "TODO-ssa-release-id",
                "targets_checked": 0,
                "share_within_tolerance": 0,
                "out_of_tolerance_targets": [],
            },
            "metadata": metadata,
        },
    )


def write_household(metadata: dict) -> None:
    """household.json — baseline vs reform net-income series per example.

    TODO(backend-builder): for each example household x each other-income point,
    POST {API_BASE}/us/calculate (baseline) and with the reform, and read
    household net income. Uses the FAST /household-style endpoint — NOT a
    microsimulation (does not OOM). This stub emits placeholder linear series.
    """
    examples = {}
    for key, cfg in HOUSEHOLD_EXAMPLES.items():
        ss = cfg["ss_benefit"]
        std = 30_000 if cfg["married"] else 15_000
        baseline, reform = [], []
        for oi in OTHER_INCOME_POINTS:
            gross = oi + ss
            taxable_base = max(gross - std, 0)
            ss_taxed = min(0.85 * ss, taxable_base)
            baseline.append(round(gross - 0.12 * taxable_base, 2))
            reform.append(round(gross - 0.12 * max(taxable_base - ss_taxed, 0), 2))
        examples[key] = {
            "label": cfg["label"],
            "other_income": OTHER_INCOME_POINTS,
            "baseline_net_income": baseline,
            "reform_net_income": reform,
        }
    _write(
        HOUSEHOLD_PATH,
        {
            "examples": examples,
            "metadata": {
                "time_period": TIME_PERIOD,
                "generated_at": metadata["generated_at"],
            },
        },
    )


def main() -> None:
    print("Creating reform policy via the hosted PolicyEngine API…")
    policy_id = create_reform_policy()
    print(f"  reform policy_id = {policy_id}")

    print(f"Fetching economy-wide impact for {TIME_PERIOD} (polling until 'ok')…")
    result = fetch_economy_impact(policy_id)
    impact = trim(result)
    metadata = {
        "time_period": TIME_PERIOD,
        "region": REGION,
        "dataset": result.get("data_version") or "policyengine-bundle",
        "api_base": API_BASE,
        "baseline_policy_id": BASELINE_POLICY_ID,
        "reform_policy_id": policy_id,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    impact["metadata"] = metadata

    _write(OUTPUT_PATH, impact)

    # New four-page dashboard outputs (policy, validation, household).
    write_parameters(metadata)
    write_validation(metadata)
    write_household(metadata)


if __name__ == "__main__":
    main()
