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

# Household inputs mirror the reform's levers: HR 904 changes the taxation of
# Social Security benefits, and how much of a benefit is taxed under current
# law depends on the benefit amount, filing status, and other (non-SS) income
# entering combined income. The grid sweeps all three.
SS_BENEFIT_POINTS = {
    "single": list(range(10_000, 50_001, 5_000)),
    "married": list(range(20_000, 70_001, 5_000)),
}
OTHER_INCOME_POINTS = list(range(0, 150_001, 5_000))

# Representative precomputed cases, each mapping to a grid point. The average
# retired-worker benefit is ~$2k/month (~$24k/yr) in 2026; couples roughly 2x.
HOUSEHOLD_PRESETS = [
    {
        "id": "average_single",
        "label": "Single filer, $25,000 benefit",
        "description": "Aged 67, with $25,000 in annual Social Security benefits and $10,000 of other taxable income.",
        "filing": "single",
        "ss_benefit": 25_000,
        "other_income": 10_000,
    },
    {
        "id": "average_couple",
        "label": "Married couple, $50,000 combined benefits",
        "description": "Both aged 67, with $50,000 in combined Social Security benefits and $20,000 of pension income.",
        "filing": "married",
        "ss_benefit": 50_000,
        "other_income": 20_000,
    },
    {
        "id": "working_senior",
        "label": "Single filer, $20,000 benefit and $40,000 earnings",
        "description": "Combined income of $50,000 places up to 85% of benefits in taxable income under current law.",
        "filing": "single",
        "ss_benefit": 20_000,
        "other_income": 40_000,
    },
    {
        "id": "higher_income_couple",
        "label": "Married couple, $60,000 benefits and $100,000 other income",
        "description": "Combined income of $130,000 places 85% of benefits in taxable income under current law.",
        "filing": "married",
        "ss_benefit": 60_000,
        "other_income": 100_000,
    },
]
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


def _get_json(url: str, timeout: int = 120) -> dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.load(resp)


def _post_json(url: str, payload: dict, timeout: int = 120) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.load(resp)


def fetch_metadata() -> dict:
    """GET /{country}/metadata — the authoritative model + parameter source.

    The hosted v1 API has no per-parameter endpoint (``/us/parameter/{path}``
    returns 404), so current-law parameter values and the model version are
    read from the single metadata document that powers policyengine.org.
    """
    return _get_json(f"{API_BASE}/{COUNTRY}/metadata")["result"]


def _value_at(values: dict, date: str) -> float | None:
    """Return the parameter value effective on ``date`` (latest key <= date)."""
    applicable = [d for d in values if d <= date]
    if not applicable:
        return None
    return values[max(applicable)]


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


def write_parameters(metadata: dict, api_metadata: dict) -> None:
    """parameters.json — the five reform params with current-law values.

    Current-law values are read (never hardcoded) from the API metadata
    parameters block at their 2026 value; reform values (0) and effective
    dates come from reform.json.
    """
    with open(REFORM_PATH) as f:
        reform = json.load(f)
    api_params = api_metadata["parameters"]
    effective_date = f"{TIME_PERIOD}-01-01"

    rows = []
    for p in REFORM_PARAMS:
        param_meta = api_params.get(p)
        current_law = (
            _value_at(param_meta["values"], effective_date)
            if param_meta and "values" in param_meta
            else None
        )
        # Reform value + effective date derived from reform.json (authoritative).
        reform_entry = reform.get(p, {})
        reform_value = next(iter(reform_entry.values()), 0) if reform_entry else 0
        effective = (
            next(iter(reform_entry)).split(".")[0]
            if reform_entry
            else effective_date
        )
        rows.append(
            {
                "parameter": p,
                "label": (param_meta or {}).get("label", p),
                "current_law": current_law,
                "reform_value": reform_value,
                "effective": effective,
            }
        )
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


TOLERANCE = 0.10  # calibration targets within +/-10% relative error are "within tolerance"


def fetch_ssa_calibration() -> dict:
    """Fetch the live SSA calibration diagnostics; degrade gracefully on failure.

    Returns a calibration block with release_id, targets_checked,
    share_within_tolerance, and any out_of_tolerance_targets (|relative error|
    > 10%). If the calibration API is unreachable the block records the
    omission via ``available: False`` rather than failing the build.
    """
    url = (
        f"{CALIBRATION_API_BASE}/calibration/dashboard/api/populace/"
        f"target-diagnostics?source=ssa"
    )
    try:
        d = _get_json(url, timeout=60)
    except Exception as exc:  # noqa: BLE001 — never fail the build on this
        print(f"  WARNING: SSA calibration API unreachable ({exc!r}); omitting.")
        return {
            "available": False,
            "source": "ssa",
            "release_id": None,
            "targets_checked": 0,
            "share_within_tolerance": 0,
            "out_of_tolerance_targets": [],
            "note": (
                "The live PolicyEngine calibration diagnostics API was "
                "unreachable at build time, so the SSA data-calibration check "
                "could not be included in this run."
            ),
        }

    targets = [t for t in (d.get("targets") or []) if t.get("source") == "ssa"]
    within = [t for t in targets if abs(t.get("relative_error", 0.0)) <= TOLERANCE]
    # Human-readable labels (string[]) so the frontend can render them directly.
    out_of_tolerance = [
        f"{t.get('breakdown') or t.get('base_name') or t.get('name')} "
        f"({t.get('relative_error', 0.0) * 100:+.1f}%)"
        for t in targets
        if abs(t.get("relative_error", 0.0)) > TOLERANCE
    ]
    targets_checked = len(targets)
    share = (len(within) / targets_checked) if targets_checked else 0
    return {
        "available": True,
        "source": "ssa",
        "release_id": d.get("release_id"),
        "metric": d.get("metric"),
        "tolerance": TOLERANCE,
        "targets_checked": targets_checked,
        "within_tolerance": len(within),
        "share_within_tolerance": share,
        "out_of_tolerance_targets": out_of_tolerance,
        "source_citation": (targets[0].get("source_citation") if targets else None),
    }


def write_validation(metadata: dict, api_metadata: dict) -> None:
    """validation.json — benchmarks, versions, methodology, and SSA calibration."""
    calibration = fetch_ssa_calibration()
    methodology_note = (
        "Static microsimulation (no behavioral response) on the certified "
        "PolicyEngine bundle dataset, computed server-side by the hosted "
        "PolicyEngine v1 API — the same engine that powers policyengine.org. "
        f"All budgetary figures are SINGLE-YEAR {TIME_PERIOD}; do not "
        "extrapolate a naive x10 for a ten-year total."
    )
    versions = {
        "model_version": api_metadata.get("version"),
        "data_version": metadata.get("dataset"),
        "country_package": "policyengine-us",
        "api_base": API_BASE,
    }
    _write(
        VALIDATION_PATH,
        {
            "benchmarks": BENCHMARKS,
            "policyengine_2026": {
                "budgetary_impact": metadata.get("budgetary_impact"),
                "note": (
                    "PolicyEngine's own computed single-year 2026 revenue "
                    "change (from impact.json)."
                ),
            },
            "versions": versions,
            "methodology_note": methodology_note,
            "calibration": calibration,
            "metadata": metadata,
        },
    )


HOUSEHOLD_STATE = "TX"  # no state income tax -> isolates the federal SS-tax effect
CALCULATE_TIMEOUT = 600


def _build_situation(ss: int, married: bool) -> dict:
    """Build a single situation holding one household per OTHER_INCOME_POINTS point.

    Each income point is an independent household (h_{i}) so the whole sweep is
    computed in one fast /calculate call — household-level, NOT a microsim.
    ``taxable_pension_income`` is used for other income because it flows into
    AGI (unlike ``pension_income``, which does not).
    """
    yr = str(TIME_PERIOD)
    people, tax_units, families, spm_units, marital_units, households = (
        {}, {}, {}, {}, {}, {},
    )
    for i, oi in enumerate(OTHER_INCOME_POINTS):
        head = f"head_{i}"
        members = [head]
        people[head] = {
            "age": {yr: 67},
            "social_security": {yr: ss // 2 if married else ss},
            "taxable_pension_income": {yr: oi},
        }
        if married:
            spouse = f"spouse_{i}"
            people[spouse] = {
                "age": {yr: 67},
                "social_security": {yr: ss // 2},
                "taxable_pension_income": {yr: 0},
            }
            members.append(spouse)
        tax_units[f"tu_{i}"] = {"members": members}
        families[f"fam_{i}"] = {"members": members}
        spm_units[f"spm_{i}"] = {"members": members}
        marital_units[f"mu_{i}"] = {"members": members}
        households[f"h_{i}"] = {
            "members": members,
            "state_name": {yr: HOUSEHOLD_STATE},
            "household_net_income": {yr: None},
        }
    return {
        "people": people,
        "tax_units": tax_units,
        "families": families,
        "spm_units": spm_units,
        "marital_units": marital_units,
        "households": households,
    }


def _net_income_series(situation: dict, reform: dict | None) -> list[float]:
    payload = {"household": situation}
    if reform is not None:
        payload["policy"] = reform
    resp = _post_json(
        f"{API_BASE}/{COUNTRY}/calculate", payload, timeout=CALCULATE_TIMEOUT
    )
    if resp.get("status") == "error":
        raise RuntimeError(f"/calculate error: {resp.get('message')}")
    households = resp["result"]["households"]
    return [
        round(float(households[f"h_{i}"]["household_net_income"][str(TIME_PERIOD)]), 2)
        for i in range(len(OTHER_INCOME_POINTS))
    ]


def write_household(metadata: dict) -> None:
    """household.json — baseline vs reform net-income grid over the reform's levers.

    The grid is keyed by filing status and Social Security benefit amount, each
    holding a net-income series over other (non-SS) taxable income — read from
    the FAST /calculate household endpoint (household-level, NOT a
    microsimulation — does not OOM). One call per (filing status, benefit,
    policy) keeps each request small.
    """
    with open(REFORM_PATH) as f:
        reform = json.load(f)
    grid: dict[str, dict[str, dict]] = {}
    for filing, ss_points in SS_BENEFIT_POINTS.items():
        married = filing == "married"
        grid[filing] = {}
        for ss in ss_points:
            print(f"  computing household grid: {filing} / ss={ss}")
            situation = _build_situation(ss, married)
            baseline = _net_income_series(situation, reform=None)
            reform_series = _net_income_series(situation, reform=reform)
            grid[filing][str(ss)] = {
                "baseline_net_income": baseline,
                "reform_net_income": reform_series,
            }
    _write(
        HOUSEHOLD_PATH,
        {
            "grid": grid,
            "ss_benefit_points": SS_BENEFIT_POINTS,
            "other_income": OTHER_INCOME_POINTS,
            "presets": HOUSEHOLD_PRESETS,
            "state": HOUSEHOLD_STATE,
            "metadata": {
                "time_period": TIME_PERIOD,
                "generated_at": metadata["generated_at"],
            },
        },
    )


def main() -> None:
    import sys

    if "--household-only" in sys.argv:
        # Regenerate only household.json (fast /calculate calls; skips the
        # slow economy compute and leaves the other data files untouched).
        print("Regenerating household.json only…")
        write_household(
            {"generated_at": dt.datetime.now(dt.timezone.utc).isoformat()}
        )
        return

    print("Fetching model metadata (versions + current-law parameters)…")
    api_metadata = fetch_metadata()

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
        "model_version": api_metadata.get("version"),
        "budgetary_impact": impact["budget"]["budgetary_impact"],
        "api_base": API_BASE,
        "baseline_policy_id": BASELINE_POLICY_ID,
        "reform_policy_id": policy_id,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    impact["metadata"] = metadata

    _write(OUTPUT_PATH, impact)

    # New four-page dashboard outputs (policy, validation, household).
    write_parameters(metadata, api_metadata)
    write_validation(metadata, api_metadata)
    write_household(metadata)


if __name__ == "__main__":
    main()
