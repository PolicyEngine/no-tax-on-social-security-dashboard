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
import type { IntraDecile, WinnerLoserBand } from '@/lib/api/types'

interface Props {
  data: IntraDecile
}

// Band -> design token. Gains teal/blue, no-change border grey, losses grey/red.
const BANDS: { key: WinnerLoserBand; label: string; color: string }[] = [
  { key: 'Gain more than 5%', label: 'Gain more than 5%', color: 'var(--chart-1)' },
  { key: 'Gain less than 5%', label: 'Gain less than 5%', color: 'var(--chart-2)' },
  { key: 'No change', label: 'No change', color: 'var(--border)' },
  { key: 'Lose less than 5%', label: 'Lose less than 5%', color: 'var(--chart-5)' },
  { key: 'Lose more than 5%', label: 'Lose more than 5%', color: 'var(--destructive)' },
]

/**
 * Stacked bar of winner/loser shares by income decile.
 * TODO: Implement — refine tooltip, stack-to-100 normalisation, mobile sizing.
 */
export function WinnersLosersByDecileChart({ data }: Props) {
  const rows = Array.from({ length: 10 }, (_, i) => {
    const row: Record<string, number> = { decile: i + 1 }
    for (const band of BANDS) row[band.key] = data.deciles[band.key]?.[i] ?? 0
    return row
  })

  return (
    <ChartContainer title="Winners and losers by income decile">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rows} stackOffset="expand">
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
            tickFormatter={(v: number) => formatPercent(v)}
            tick={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}
          />
          <Tooltip separator=": " formatter={(v) => formatPercent(Number(v))} />
          <Legend />
          {BANDS.map((band) => (
            <Bar
              key={band.key}
              dataKey={band.key}
              name={band.label}
              stackId="shares"
              fill={band.color}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
