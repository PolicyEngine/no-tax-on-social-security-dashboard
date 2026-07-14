// Types for the precomputed HR 904 economy-wide impact.
// Shapes mirror the subset of the PolicyEngine v1 economy endpoint result that
// scripts/precompute.py extracts into public/data/impact.json.

/** A rate (or value) compared between baseline and reform. */
export interface RateChange {
  baseline: number
  reform: number
}

/** Budgetary aggregates (single year, 2026). */
export interface Budget {
  /** Total federal revenue change — negative means a cost. */
  budgetary_impact: number
  tax_revenue_impact: number
  baseline_net_income: number
}

/** Map keyed by income decile "1".."10" to a numeric value. */
export type DecileMap = Record<string, number>

export interface Decile {
  /** Relative net-income change by income decile. */
  relative: DecileMap
  /** Average $ net-income change by income decile. */
  average: DecileMap
}

/** SPM poverty rates (baseline vs reform) by age group. */
export interface Poverty {
  all: RateChange
  senior: RateChange
  child: RateChange
  adult: RateChange
}

/** Winner/loser bands used by the intra-decile breakdown. */
export type WinnerLoserBand =
  | 'Gain more than 5%'
  | 'Gain less than 5%'
  | 'No change'
  | 'Lose less than 5%'
  | 'Lose more than 5%'

export interface IntraDecile {
  /** Aggregate winner/loser shares (0-1) across all households. */
  all: Record<WinnerLoserBand, number>
  /** Winner/loser shares (0-1) per income decile — each array has length 10. */
  deciles: Record<WinnerLoserBand, number[]>
}

export interface ImpactMetadata {
  time_period: number
  region: string
  dataset: string
  api_base: string
  baseline_policy_id: number
  reform_policy_id: number
  generated_at: string
}

/** The full precomputed impact object shipped as public/data/impact.json. */
export interface Impact {
  budget: Budget
  decile: Decile
  poverty: Poverty
  intra_decile: IntraDecile
  metadata: ImpactMetadata
}

// ---------------------------------------------------------------------------
// Policy explanation — public/data/parameters.json
// ---------------------------------------------------------------------------

/** One row of the HR 904 parameter-change table. */
export interface ParameterRow {
  /** Fully-qualified PolicyEngine parameter path. */
  parameter: string
  /** Current-law value at 2026 (fetched from the API, authoritative). */
  current_law: number
  /** Value HR 904 sets the parameter to (0 for all five). */
  reform_value: number
  /** Effective date, e.g. "2026-01-01". */
  effective: string
}

/** public/data/parameters.json — the full parameter table. */
export interface Parameters {
  rows: ParameterRow[]
  metadata: {
    time_period: number
    generated_at: string
  }
}

// ---------------------------------------------------------------------------
// Validation — public/data/validation.json
// ---------------------------------------------------------------------------

/** An external / prior benchmark the PolicyEngine figure is compared against. */
export interface Benchmark {
  source: string
  label: string
  metric: string
  value: number
  year?: number
  approximate?: boolean
  note?: string
}

/** Live data-calibration check for the reform's SSA domain. */
export interface Calibration {
  release_id: string
  targets_checked: number
  share_within_tolerance: number
  /** Targets with |relative error| > 10%, named explicitly. */
  out_of_tolerance_targets: string[]
}

/** public/data/validation.json — benchmarks, versions, calibration. */
export interface Validation {
  benchmarks: Benchmark[]
  calibration: Calibration
  metadata: ImpactMetadata
}

// ---------------------------------------------------------------------------
// Household examples — public/data/household.json
// ---------------------------------------------------------------------------

/** Filing status — the reform's first lever (taxation thresholds differ). */
export type FilingStatus = 'single' | 'married'

/** Baseline-vs-reform net income over the other-income sweep, at one
 * (filing status, SS benefit) grid point. */
export interface HouseholdSeries {
  /** Baseline net income at each other-income point. */
  baseline_net_income: number[]
  /** Net income under HR 904 at each other-income point. */
  reform_net_income: number[]
}

/** A representative precomputed case mapping to one grid point. */
export interface HouseholdPreset {
  id: string
  label: string
  description: string
  filing: FilingStatus
  ss_benefit: number
  other_income: number
}

/** public/data/household.json — net-income grid over the reform's levers
 * (filing status x SS benefit x other income) plus representative presets. */
export interface Household {
  /** grid[filing][String(ss_benefit)] -> series over other_income. */
  grid: Record<FilingStatus, Record<string, HouseholdSeries>>
  ss_benefit_points: Record<FilingStatus, number[]>
  /** Other (non-SS) taxable income points swept, ascending. */
  other_income: number[]
  presets: HouseholdPreset[]
  state: string
  metadata: {
    time_period: number
    generated_at: string
  }
}
