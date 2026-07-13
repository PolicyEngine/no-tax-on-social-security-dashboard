'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, formatPercent } from '@policyengine/ui-kit'
import type { Poverty } from '@/lib/api/types'

interface Props {
  data: Poverty
}

const GROUPS: { key: keyof Poverty; label: string }[] = [
  { key: 'child', label: 'Children' },
  { key: 'adult', label: 'Adults' },
  { key: 'senior', label: 'Seniors' },
  { key: 'all', label: 'All' },
]

/**
 * Grouped bar of SPM poverty rate, baseline vs reform, by age group.
 * TODO: Implement — refine tooltip formatting and mobile sizing.
 */
export function PovertyByAgeGroupChart({ data }: Props) {
  const rows = GROUPS.map((g) => ({
    group: g.label,
    baseline: data[g.key].baseline,
    reform: data[g.key].reform,
  }))

  return (
    <ChartContainer title="Poverty rate by age group, baseline vs reform">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rows}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="group"
            niceTicks="snap125"
            domain={['auto', 'auto']}
            tick={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
          />
          <YAxis
            niceTicks="snap125"
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatPercent(v)}
            tick={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
          />
          <Tooltip separator=": " formatter={(v) => formatPercent(Number(v))} />
          <Legend />
          <Bar dataKey="baseline" name="Baseline" fill="var(--chart-5)" />
          <Bar dataKey="reform" name="Under HR 904" fill="var(--chart-1)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
