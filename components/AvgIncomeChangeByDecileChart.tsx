'use client'

import { ChartContainer, PEImpactBarChart, formatCurrency } from '@policyengine/ui-kit'
import type { ImpactBarDatum } from '@policyengine/ui-kit'
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

/**
 * Average change in household net income by income decile — the canonical
 * PolicyEngine impact bar chart (`PEImpactBarChart`), which colours gains teal
 * and losses red and formats the axis and bar labels as currency.
 */
export function AvgIncomeChangeByDecileChart({ data }: Props) {
  const chartData: ImpactBarDatum[] = buildAvgIncomeRows(data).map((row) => ({
    name: String(row.decile),
    value: row.value,
    hoverText: `Decile ${row.decile}: ${formatCurrency(row.value)}`,
  }))

  return (
    <ChartContainer
      title="Average change in household income by income decile"
      subtitle="Mean change in annual net income per household (2026)"
      downloadFilename="avg-income-change-by-decile"
    >
      <PEImpactBarChart
        data={chartData}
        xAxisLabel="Income decile"
        yAxisLabel="Average change in net income"
        yTickFormatter={formatCurrency}
        barLabelFormatter={formatCurrency}
      />
    </ChartContainer>
  )
}
