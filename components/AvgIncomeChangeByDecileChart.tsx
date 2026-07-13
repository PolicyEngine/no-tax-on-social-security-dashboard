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

const dollars = (v: number) => (v < 0 ? `-$${Math.abs(v)}` : `$${v}`)

/**
 * Bar chart of the average $ change in household net income by income decile.
 * TODO: Implement — refine tooltip formatting and mobile sizing.
 */
export function AvgIncomeChangeByDecileChart({ data }: Props) {
  const rows = Array.from({ length: 10 }, (_, i) => ({
    decile: i + 1,
    value: data[String(i + 1)] ?? 0,
  }))

  return (
    <ChartContainer title="Average change in household income by income decile">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rows}>
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
            tickFormatter={dollars}
            tick={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
          />
          <Tooltip
            separator=": "
            formatter={(v) => formatCurrency(Number(v))}
          />
          <Bar dataKey="value" name="Average change in net income" fill="var(--chart-1)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
