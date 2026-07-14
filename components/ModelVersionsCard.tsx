'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@policyengine/ui-kit'
import type { ImpactMetadata } from '@/lib/api/types'

interface Props {
  metadata: ImpactMetadata
}

/** Model and data versions used to produce the numbers (validation page). */
export function ModelVersionsCard({ metadata }: Props) {
  const fields: { label: string; value: string | number }[] = [
    { label: 'Data version', value: metadata.dataset },
    { label: 'Analysis year', value: metadata.time_period },
    { label: 'Baseline policy', value: metadata.baseline_policy_id },
    { label: 'Reform policy', value: metadata.reform_policy_id },
    { label: 'Generated at', value: metadata.generated_at },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model and data versions</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="text-sm font-medium break-all">{f.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
