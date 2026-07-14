'use client'

import { DataTable, formatCurrency } from '@policyengine/ui-kit'
import type { Benchmark } from '@/lib/api/types'

interface Props {
  /** PolicyEngine's own 2026 figure (from impact.json budget.budgetary_impact). */
  policyEngineValue: number
  /** External / prior benchmarks from validation.json. */
  benchmarks: Benchmark[]
}

interface ComparisonRow {
  label: string
  value: number
}

/**
 * Builds the comparison rows: PolicyEngine's 2026 figure first, then each
 * external benchmark. Exported so tests can assert row shape.
 */
export function buildComparisonRows(
  policyEngineValue: number,
  benchmarks: Benchmark[],
): ComparisonRow[] {
  return [
    { label: 'PolicyEngine (2026)', value: policyEngineValue },
    ...benchmarks.map((b) => ({ label: b.label, value: b.value })),
  ]
}

/** First-year cost of HR 904 next to external estimates. */
export function BenchmarkComparisonTable({ policyEngineValue, benchmarks }: Props) {
  const rows = buildComparisonRows(
    policyEngineValue,
    benchmarks,
  ) as unknown as Record<string, unknown>[]

  return (
    <DataTable
      columns={[
        { key: 'label', header: 'Source' },
        {
          key: 'value',
          header: 'First-year revenue change',
          align: 'right',
          format: (v) => formatCurrency(Number(v)),
        },
      ]}
      data={rows}
    />
  )
}
