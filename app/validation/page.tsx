'use client'

import { useImpact, useValidation } from '@/lib/hooks/useCalculation'
import { SiteHeader } from '@/components/SiteHeader'
import { BenchmarkComparisonTable } from '@/components/BenchmarkComparisonTable'
import { ModelVersionsCard } from '@/components/ModelVersionsCard'
import { CalibrationSection } from '@/components/CalibrationSection'

export default function ValidationPage() {
  const { data: impact } = useImpact()
  const { data: validation } = useValidation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="max-w-content mx-auto px-6 py-8 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">
            How we produced and checked these numbers
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            PolicyEngine&apos;s result next to external benchmarks, the model and
            data versions, the single-year methodology note, and the live
            data-calibration check for the reform&apos;s SSA domain.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            First-year cost vs external estimates
          </h2>
          {impact && validation && (
            <BenchmarkComparisonTable
              policyEngineValue={impact.budget.budgetary_impact}
              benchmarks={validation.benchmarks}
            />
          )}
          <p className="text-xs text-muted-foreground max-w-2xl">
            Estimates are single-year and year-specific; the 2025 prior score and
            the 2026 figure are not directly comparable.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          {validation && <ModelVersionsCard metadata={validation.metadata} />}
        </section>

        <section className="flex flex-col gap-3 max-w-2xl">
          <h2 className="text-xl font-semibold">Methodology</h2>
          <p className="text-muted-foreground">
            Static microsimulation (no behavioral response) on the certified
            PolicyEngine bundle dataset via the hosted PolicyEngine API. All
            budgetary figures are single-year 2026 — do not extrapolate a naive
            ×10 for a ten-year total.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          {validation && (
            <CalibrationSection calibration={validation.calibration} />
          )}
        </section>
      </main>
    </div>
  )
}
