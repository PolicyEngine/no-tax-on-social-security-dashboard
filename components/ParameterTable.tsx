'use client'

import { DataTable, formatPercent } from '@policyengine/ui-kit'
import type { ParameterRow } from '@/lib/api/types'

interface Props {
  rows: ParameterRow[]
}

/** Builds the display rows for the parameter table. Exported for tests. */
export function buildParameterRows(rows: ParameterRow[]) {
  // TODO: Implement any label shortening / grouping of parameter paths.
  return rows
}

/**
 * Parameter-change table for the policy-explanation page — the five IRC 86
 * taxability rates HR 904 sets to zero, with their current-law values.
 */
export function ParameterTable({ rows }: Props) {
  const data = buildParameterRows(rows) as unknown as Record<string, unknown>[]

  return (
    <DataTable
      columns={[
        { key: 'parameter', header: 'Parameter' },
        {
          key: 'current_law',
          header: 'Current law (2026)',
          align: 'right',
          format: (v) => formatPercent(Number(v)),
        },
        {
          key: 'reform_value',
          header: 'HR 904',
          align: 'right',
          format: (v) => formatPercent(Number(v)),
        },
        { key: 'effective', header: 'Effective', align: 'right' },
      ]}
      data={data}
    />
  )
}
