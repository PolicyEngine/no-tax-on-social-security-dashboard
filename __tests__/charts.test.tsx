import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  WinnersLosersByDecileChart,
  buildWinnersLosersRows,
} from '@/components/WinnersLosersByDecileChart'
import {
  AvgIncomeChangeByDecileChart,
  buildAvgIncomeRows,
} from '@/components/AvgIncomeChangeByDecileChart'
import {
  PovertyByAgeGroupChart,
  buildPovertyRows,
} from '@/components/PovertyByAgeGroupChart'
import { impact } from '@/lib/api/fixtures'

// recharts' ResponsiveContainer relies on ResizeObserver, absent in jsdom.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).ResizeObserver = ResizeObserverStub

const BANDS = [
  'Gain more than 5%',
  'Gain less than 5%',
  'No change',
  'Lose less than 5%',
  'Lose more than 5%',
] as const

describe('WinnersLosersByDecileChart', () => {
  it('renders without errors and shows its title', () => {
    render(<WinnersLosersByDecileChart data={impact.intra_decile} />)
    expect(
      screen.getByText(/winners and losers by income decile/i),
    ).toBeInTheDocument()
  })

  it('builds ten decile rows', () => {
    expect(buildWinnersLosersRows(impact.intra_decile)).toHaveLength(10)
  })

  it('has winner/loser bands that sum to ~100% in every decile', () => {
    for (const row of buildWinnersLosersRows(impact.intra_decile)) {
      const total = BANDS.reduce((sum, band) => sum + (row[band] as number), 0)
      expect(total).toBeCloseTo(1, 2)
    }
  })
})

describe('AvgIncomeChangeByDecileChart', () => {
  it('renders without errors and shows its title', () => {
    render(<AvgIncomeChangeByDecileChart data={impact.decile.average} />)
    expect(
      screen.getByText(/average change in household income by income decile/i),
    ).toBeInTheDocument()
  })

  it('builds ten decile rows carrying the average value', () => {
    const rows = buildAvgIncomeRows(impact.decile.average)
    expect(rows).toHaveLength(10)
    expect(rows[0]).toEqual({ decile: 1, value: impact.decile.average['1'] })
  })
})

describe('PovertyByAgeGroupChart', () => {
  it('renders without errors and shows its title', () => {
    render(<PovertyByAgeGroupChart data={impact.poverty} />)
    expect(
      screen.getByText(/poverty rate by age group, baseline vs reform/i),
    ).toBeInTheDocument()
  })

  it('builds one baseline/reform row per age group', () => {
    const rows = buildPovertyRows(impact.poverty)
    expect(rows).toHaveLength(4)
    for (const row of rows) {
      expect(typeof row.baseline).toBe('number')
      expect(typeof row.reform).toBe('number')
    }
  })
})
