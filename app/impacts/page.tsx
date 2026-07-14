'use client'

import { MetricCard } from '@policyengine/ui-kit'
import { useImpact } from '@/lib/hooks/useCalculation'
import { SiteHeader } from '@/components/SiteHeader'
import { WinnersLosersByDecileChart } from '@/components/WinnersLosersByDecileChart'
import { AvgIncomeChangeByDecileChart } from '@/components/AvgIncomeChangeByDecileChart'
import { PovertyByAgeGroupChart } from '@/components/PovertyByAgeGroupChart'

/** Relative change in a poverty rate: (reform - baseline) / baseline. */
function relativeChange(rate: { baseline: number; reform: number }): number {
  if (!rate.baseline) return 0
  return (rate.reform - rate.baseline) / rate.baseline
}

export default function ImpactsPage() {
  const { data: impact, isLoading, isError } = useImpact()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="max-w-content mx-auto px-6 py-8 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Economic impact of HR 904 (2026)</h1>
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

            <section className="flex flex-col gap-8">
              <WinnersLosersByDecileChart data={impact.intra_decile} />
              <AvgIncomeChangeByDecileChart data={impact.decile.average} />
              <PovertyByAgeGroupChart data={impact.poverty} />
            </section>

            <footer className="text-xs text-muted-foreground border-t border-border pt-4">
              Estimates computed with the PolicyEngine microsimulation model via
              the hosted PolicyEngine API ({impact.metadata.dataset},{' '}
              {impact.metadata.time_period}). Budgetary figures are single-year
              and static (no behavioral response).
            </footer>
          </>
        )}
      </main>
    </div>
  )
}
