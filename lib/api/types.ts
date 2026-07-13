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
