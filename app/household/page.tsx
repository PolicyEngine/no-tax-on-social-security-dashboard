'use client'

import { useState } from 'react'
import { MetricCard } from '@policyengine/ui-kit'
import { useHousehold } from '@/lib/hooks/useCalculation'
import { SiteHeader } from '@/components/SiteHeader'
import { HouseholdControls } from '@/components/HouseholdControls'
import { HouseholdNetIncomeChart } from '@/components/HouseholdNetIncomeChart'
import type { HouseholdExampleId } from '@/lib/api/types'

const DEFAULT_OTHER_INCOME = 30000

export default function HouseholdPage() {
  const { data: household } = useHousehold()
  const [example, setExample] = useState<HouseholdExampleId>(
    'single_senior_20k_ss',
  )
  const [otherIncome, setOtherIncome] = useState(DEFAULT_OTHER_INCOME)

  const series = household?.examples[example]

  // Nearest precomputed point to the slider value (no live compute).
  const index = series
    ? series.other_income.reduce(
        (best, v, i) =>
          Math.abs(v - otherIncome) <
          Math.abs(series.other_income[best] - otherIncome)
            ? i
            : best,
        0,
      )
    : 0
  const gain = series
    ? series.reform_net_income[index] - series.baseline_net_income[index]
    : 0

  const exampleOptions = household
    ? (Object.entries(household.examples) as [HouseholdExampleId, { label: string }][]).map(
        ([value, s]) => ({ value, label: s.label }),
      )
    : []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="max-w-content mx-auto px-6 py-8 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">
            How HR 904 affects example households
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Precomputed net-income series for archetypal senior households under
            baseline vs HR 904. Use the slider to pick the household&apos;s other
            (non-SS) taxable income.
          </p>
        </header>

        {household && series && (
          <>
            <section className="flex flex-col gap-4 max-w-xl">
              <HouseholdControls
                example={example}
                onExampleChange={setExample}
                otherIncome={otherIncome}
                onOtherIncomeChange={setOtherIncome}
                exampleOptions={exampleOptions}
              />
              <p className="text-xs text-muted-foreground">
                The slider selects among precomputed points in household.json (no
                live compute).
              </p>
            </section>

            <section>
              <MetricCard
                label="Net income change at selected income"
                value={gain}
                format="currency"
                trend={gain >= 0 ? 'positive' : 'negative'}
              />
            </section>

            <section>
              <HouseholdNetIncomeChart series={series} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}
