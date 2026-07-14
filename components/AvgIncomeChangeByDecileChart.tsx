'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, formatCurrency } from '@policyengine/ui-kit'
import type { DecileMap } from '@/lib/api/types'

interface Props {
  data: DecileMap
}

/** One row per income decile with the average $ change in net income. */
export function buildAvgIncomeRows(data: DecileMap) {
  return Array.from({ length: 10 }, (_, i) => ({
    decile: i + 1,
    value: data[String(i + 1)] ?? 0,
  }))
}

/** Bar chart of the average $ change in household net income by income decile. */
export function AvgIncomeChangeByDecileChart({ data }: Props) {
  const rows = buildAvgIncomeRows(data)

  return (
    <ChartContainer
      title="Average change in household income by income decile"
      subtitle="Mean change in annual net income per household (2026)"
      downloadFilename="avg-income-change-by-decile"
    >
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="decile"
            niceTicks="snap125"
            domain={['auto', 'auto']}
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
            labelFormatter={(label) => `Decile ${label}`}
            formatter={(v) => formatCurrency(Number(v))}
          />
          <Bar dataKey="value" name="Average change in net income" fill="var(--chart-1)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
