'use client'

import { MetricCard } from '@policyengine/ui-kit'
import { useImpact } from '@/lib/hooks/useCalculation'
import { PageShell } from '@/components/PageShell'
import { Callout } from '@/components/Callout'
import type { Impact } from '@/lib/api/types'
import { WinnersLosersByDecileChart } from '@/components/WinnersLosersByDecileChart'
import { AvgIncomeChangeByDecileChart } from '@/components/AvgIncomeChangeByDecileChart'
import { PovertyByAgeGroupChart } from '@/components/PovertyByAgeGroupChart'

/** Relative change in a poverty rate: (reform - baseline) / baseline. */
function relativeChange(rate: { baseline: number; reform: number }): number {
  if (!rate.baseline) return 0
  return (rate.reform - rate.baseline) / rate.baseline
}

function gainShare(impact: Impact): number {
  const a = impact.intra_decile.all
  return (a['Gain more than 5%'] ?? 0) + (a['Gain less than 5%'] ?? 0)
}

function noChangeShare(impact: Impact): number {
  return impact.intra_decile.all['No change'] ?? 0
}

function decileAvg(impact: Impact, decile: number): number {
  return impact.decile.average[String(decile)] ?? 0
}

function maxAbsPovertyChange(impact: Impact): number {
  return Math.max(
    ...Object.values(impact.poverty).map((r) =>
      Math.abs(relativeChange(r)),
    ),
  )
}

function formatShare(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

function formatDollars(v: number): string {
  return `$${Math.round(v).toLocaleString('en-US')}`
}

export default function ImpactsPage() {
  const { data: impact, isLoading, isError } = useImpact()

  return (
    <>
      <PageShell>
        <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Economic impact of HR 904 (2026)</h2>
          <p className="text-muted-foreground max-w-2xl">
            Budgetary cost, poverty effects, and the distribution of gains across
            the income distribution (2026).
          </p>
        </header>

        {isLoading && <p className="text-muted-foreground">Loading impact…</p>}
        {isError && (
          <p className="text-error-foreground">Could not load the impact data.</p>
        )}

        {impact && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard
                label="Annual federal cost (2026)"
                value={Math.abs(impact.budget.budgetary_impact)}
                format="currency"
                trend="neutral"
              />
              <MetricCard
                label="Change in overall poverty rate"
                value={relativeChange(impact.poverty.all)}
                format="percent"
                trend={
                  relativeChange(impact.poverty.all) <= 0 ? 'positive' : 'negative'
                }
              />
              <MetricCard
                label="Change in senior poverty rate"
                value={relativeChange(impact.poverty.senior)}
                format="percent"
                trend={
                  relativeChange(impact.poverty.senior) <= 0
                    ? 'positive'
                    : 'negative'
                }
              />
            </section>

            <p className="text-xs text-muted-foreground -mt-4 max-w-2xl">
              The annual federal cost is the reduction in federal revenue, shown
              here as a positive cost magnitude. A negative change in a poverty
              rate means poverty falls under HR 904.
            </p>

            <section className="flex flex-col gap-10">
              <div className="flex flex-col gap-3">
                <p className="max-w-2xl text-muted-foreground">
                  {formatShare(gainShare(impact))} of households see higher net
                  income in 2026; {formatShare(noChangeShare(impact))} see no
                  change.
                </p>
                <WinnersLosersByDecileChart data={impact.intra_decile} />
              </div>

              <div className="flex flex-col gap-3">
                <p className="max-w-2xl text-muted-foreground">
                  Average gains rise with income, from{' '}
                  {formatDollars(decileAvg(impact, 1))} in the lowest decile to{' '}
                  {formatDollars(decileAvg(impact, 10))} in the highest.
                </p>
                <AvgIncomeChangeByDecileChart data={impact.decile.average} />
              </div>

              <div className="flex flex-col gap-3">
                <p className="max-w-2xl text-muted-foreground">
                  Poverty rates change by less than{' '}
                  {formatShare(maxAbsPovertyChange(impact))} in every age group.
                </p>
                <PovertyByAgeGroupChart data={impact.poverty} />
                <Callout
                  eyebrow="Why senior poverty barely moves"
                  headline="Eliminating the tax on Social Security benefits changes the senior poverty rate by less than 0.01 percentage points."
                >
                  Benefits become taxable only when combined income — adjusted
                  gross income plus half of benefits — exceeds $25,000 for
                  single filers or $32,000 for married couples. Seniors near
                  the poverty threshold fall below those lines, pay no tax on
                  their benefits under current law, and therefore gain $0 from
                  HR 904. The senior poverty rate changes from{' '}
                  {formatShare(impact.poverty.senior.baseline)} to{' '}
                  {formatShare(impact.poverty.senior.reform)}. The Households
                  tab isolates the mechanism: at a $25,000 benefit, gains are
                  $0 until other income reaches about $15,000.
                </Callout>
              </div>
            </section>

            <footer className="text-xs text-muted-foreground border-t border-border pt-4">
              Estimates computed with the PolicyEngine microsimulation model via
              the hosted PolicyEngine API ({impact.metadata.dataset},{' '}
              {impact.metadata.time_period}). Budgetary figures are single-year
              and static (no behavioral response).
            </footer>
          </>
        )}
        </div>
      </PageShell>
    </>
  )
}
