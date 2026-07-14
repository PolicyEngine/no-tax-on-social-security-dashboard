'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, formatCurrency } from '@policyengine/ui-kit'
import type { HouseholdSeries } from '@/lib/api/types'

interface Props {
  series: HouseholdSeries
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

/** Net income by other income, baseline vs HR 904, for one example household. */
export function HouseholdNetIncomeChart({ series }: Props) {
  const rows = buildHouseholdRows(series)

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
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="reform_net_income"
            name="Under HR 904"
            stroke="var(--chart-1)"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
