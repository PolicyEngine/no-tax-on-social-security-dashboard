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
  note: string
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
    {
      label: 'PolicyEngine (2026)',
      value: policyEngineValue,
      note: 'This analysis — single-year 2026 static estimate.',
    },
    ...benchmarks.map((b) => ({
      label: b.label,
      value: b.value,
      note:
        b.note ??
        [b.metric, b.year ? `${b.year}` : null].filter(Boolean).join(' · '),
    })),
  ]
}

/**
 * First-year cost of HR 904 next to external estimates. The notes column flags
 * that year- and dataset-specific figures are not directly comparable.
 */
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
        {
          key: 'note',
          header: 'Basis',
          format: (v) => (
            <span className="text-sm text-muted-foreground">{String(v)}</span>
          ),
        },
      ]}
      data={rows}
    />
  )
}
