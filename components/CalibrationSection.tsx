'use client'

import { Card, CardHeader, CardTitle, CardContent, formatPercent } from '@policyengine/ui-kit'
import type { Calibration } from '@/lib/api/types'

interface Props {
  calibration: Calibration
}

const CALIBRATION_DASHBOARD_URL = 'https://calibration-diagnostics.vercel.app'

/**
 * Data-calibration check for the reform's SSA domain — tells readers whether
 * the underlying microdata is well-calibrated for Social Security benefits, the
 * variable this reform acts on.
 */
export function CalibrationSection({ calibration }: Props) {
  const outOfTolerance = calibration.out_of_tolerance_targets

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data calibration (SSA)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex flex-col">
            <dt className="text-xs text-muted-foreground">Release</dt>
            <dd className="text-sm font-medium break-all">
              {calibration.release_id}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-muted-foreground">Targets checked</dt>
            <dd className="text-sm font-medium">{calibration.targets_checked}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-muted-foreground">Within tolerance</dt>
            <dd className="text-sm font-medium">
              {formatPercent(calibration.share_within_tolerance)}
            </dd>
          </div>
        </dl>

        {outOfTolerance.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">
              Out-of-tolerance targets (|relative error| &gt; 10%):{' '}
            </span>
            {outOfTolerance.join(', ')}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Tells readers whether the underlying microdata is well-calibrated for
          Social Security benefits — the variable this reform acts on.
        </p>

        <a
          href={CALIBRATION_DASHBOARD_URL}
          className="text-sm text-teal-500 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          PolicyEngine calibration dashboard
        </a>
      </CardContent>
    </Card>
  )
}
