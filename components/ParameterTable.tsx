'use client'

import { DataTable, formatPercent } from '@policyengine/ui-kit'
import type { ParameterRow } from '@/lib/api/types'

interface Props {
  rows: ParameterRow[]
}

/** Plain-language label for each IRC 86 taxability rate parameter path. */
const PARAMETER_LABELS: Record<string, string> = {
  'gov.irs.social_security.taxability.rate.base.excess':
    'First-tier rate on income above the lower threshold',
  'gov.irs.social_security.taxability.rate.base.benefit_cap':
    'First-tier benefit cap',
  'gov.irs.social_security.taxability.rate.additional.excess':
    'Second-tier rate on income above the higher threshold',
  'gov.irs.social_security.taxability.rate.additional.benefit_cap':
    'Second-tier benefit cap',
  'gov.irs.social_security.taxability.rate.additional.bracket':
    'Second-tier bracket rate',
}

/** Builds the display rows for the parameter table. Exported for tests. */
export function buildParameterRows(rows: ParameterRow[]) {
  return rows
}

/**
 * Parameter-change table for the policy-explanation page — the five IRC 86
 * taxability rates HR 904 sets to zero, with their current-law values. Each row
 * shows a plain-language label above the fully-qualified PolicyEngine path.
 */
export function ParameterTable({ rows }: Props) {
  const data = buildParameterRows(rows) as unknown as Record<string, unknown>[]

  return (
    <DataTable
      columns={[
        {
          key: 'parameter',
          header: 'Parameter',
          format: (v) => {
            const path = String(v)
            return (
              <span className="flex flex-col">
                <span className="font-medium text-foreground">
                  {PARAMETER_LABELS[path] ?? path}
                </span>
                <span className="text-xs text-muted-foreground font-mono break-all">
                  {path}
                </span>
              </span>
            )
          },
        },
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
