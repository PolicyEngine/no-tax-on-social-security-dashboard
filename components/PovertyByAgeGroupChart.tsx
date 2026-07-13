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

/** One row per age group with baseline and reform SPM poverty rates. */
export function buildPovertyRows(data: Poverty) {
  return GROUPS.map((g) => ({
    group: g.label,
    baseline: data[g.key].baseline,
    reform: data[g.key].reform,
  }))
}

/** Grouped bar of SPM poverty rate, baseline vs reform, by age group. */
export function PovertyByAgeGroupChart({ data }: Props) {
  const rows = buildPovertyRows(data)

  return (
    <ChartContainer
      title="Poverty rate by age group, baseline vs reform"
      subtitle="Supplemental Poverty Measure rate under current law and HR 904 (2026)"
      downloadFilename="poverty-by-age-group"
    >
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
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
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)' }} />
          <Bar dataKey="baseline" name="Baseline" fill="var(--chart-5)" />
          <Bar dataKey="reform" name="Under HR 904" fill="var(--chart-1)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
