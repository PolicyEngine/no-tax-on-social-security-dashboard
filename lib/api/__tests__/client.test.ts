import { describe, it, expect } from 'vitest'
import { getImpact } from '../client'
import type { Impact, WinnerLoserBand } from '../types'

const BANDS: WinnerLoserBand[] = [
  'Gain more than 5%',
  'Gain less than 5%',
  'No change',
  'Lose less than 5%',
  'Lose more than 5%',
]

describe('precomputed impact data (public/data/impact.json)', () => {
  // From plan.yaml tests.api_tests: impact_json_shape
  it('has the required top-level structure and keys', async () => {
    const impact: Impact = await getImpact()

    expect(impact.budget.budgetary_impact).toBeTypeOf('number')
    expect(impact.decile.relative).toBeTypeOf('object')
    expect(impact.decile.average).toBeTypeOf('object')
    expect(impact.poverty.all).toMatchObject({
      baseline: expect.any(Number),
      reform: expect.any(Number),
    })
    expect(impact.poverty.senior).toMatchObject({
      baseline: expect.any(Number),
      reform: expect.any(Number),
    })
    expect(impact.intra_decile.deciles).toBeTypeOf('object')
  })

  // From plan.yaml tests.api_tests: budgetary_cost_is_a_cost
  it('reports a federal revenue cost (negative, under ~$200B/yr)', async () => {
    const { budgetary_impact } = (await getImpact()).budget
    expect(budgetary_impact).toBeLessThanOrEqual(0)
    expect(budgetary_impact).toBeGreaterThanOrEqual(-200_000_000_000)
  })

  // From plan.yaml tests.api_tests: poverty_does_not_increase
  it('does not raise overall or senior poverty rates', async () => {
    const { poverty } = await getImpact()
    expect(poverty.all.reform).toBeLessThanOrEqual(poverty.all.baseline)
    expect(poverty.senior.reform).toBeLessThanOrEqual(poverty.senior.baseline)
  })

  // From plan.yaml tests.api_tests: decile_arrays_length_10
  it('covers all 10 income deciles in decile and intra-decile breakdowns', async () => {
    const impact = await getImpact()
    expect(Object.keys(impact.decile.average)).toHaveLength(10)
    expect(Object.keys(impact.decile.relative)).toHaveLength(10)
    for (const band of BANDS) {
      expect(impact.intra_decile.deciles[band]).toHaveLength(10)
    }
  })

  // From plan.yaml frontend_tests: winners_losers_stack_to_100
  it('has winner/loser bands that sum to ~1 within each decile', async () => {
    const { deciles } = (await getImpact()).intra_decile
    for (let i = 0; i < 10; i++) {
      const total = BANDS.reduce((sum, band) => sum + deciles[band][i], 0)
      expect(total).toBeCloseTo(1, 2)
    }
  })
})
