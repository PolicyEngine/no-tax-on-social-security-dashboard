'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, formatCurrency } from '@policyengine/ui-kit'
import type { HouseholdSeries } from '@/lib/api/types'

interface Props {
  series: HouseholdSeries
  /** Other-income value currently selected on the slider (for the highlight dot). */
  highlightIncome?: number
}

/**
 * Builds one row per other-income point with baseline and reform net income.
 * Exported so tests can assert the series line up with the income sweep.
 */
export function buildHouseholdRows(series: HouseholdSeries) {
  return series.other_income.map((other_income, i) => ({
    other_income,
    baseline_net_income: series.baseline_net_income[i],
    reform_net_income: series.reform_net_income[i],
  }))
}

/** Index of the precomputed point nearest to a given other-income value. */
export function nearestIndex(series: HouseholdSeries, otherIncome: number) {
  return series.other_income.reduce(
    (best, v, i) =>
      Math.abs(v - otherIncome) < Math.abs(series.other_income[best] - otherIncome)
        ? i
        : best,
    0,
  )
}

/** Net income by other income, baseline vs HR 904, for one example household. */
export function HouseholdNetIncomeChart({ series, highlightIncome }: Props) {
  const rows = buildHouseholdRows(series)
  const highlight =
    highlightIncome != null ? rows[nearestIndex(series, highlightIncome)] : null

  return (
    <ChartContainer
      title="Net income by other income, baseline vs HR 904"
      subtitle={series.label}
      downloadFilename="household-net-income"
    >
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="other_income"
            type="number"
            niceTicks="snap125"
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
          />
          <YAxis
            niceTicks="snap125"
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
          />
          <Tooltip
            separator=": "
            labelFormatter={(label) => `Other income ${formatCurrency(Number(label))}`}
            formatter={(v) => formatCurrency(Number(v))}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)' }} />
          <Line
            type="monotone"
            dataKey="baseline_net_income"
            name="Baseline"
            stroke="var(--chart-5)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="reform_net_income"
            name="Under HR 904"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
          />
          {highlight && (
            <ReferenceDot
              x={highlight.other_income}
              y={highlight.reform_net_income}
              r={5}
              fill="var(--chart-1)"
              stroke="var(--background)"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
