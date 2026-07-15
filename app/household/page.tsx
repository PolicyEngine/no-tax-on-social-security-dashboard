'use client'

import { useMemo, useState } from 'react'
import { MetricCard } from '@policyengine/ui-kit'
import { useHousehold } from '@/lib/hooks/useCalculation'
import { PageShell } from '@/components/PageShell'
import { HouseholdControls } from '@/components/HouseholdControls'
import { PresetCards } from '@/components/PresetCards'
import {
  HouseholdNetIncomeChart,
  nearestIndex,
  type ChartSeries,
} from '@/components/HouseholdNetIncomeChart'
import type { FilingStatus, Household, HouseholdPreset } from '@/lib/api/types'

const DEFAULT_FILING: FilingStatus = 'single'
const DEFAULT_SS_BENEFIT = 25_000
const DEFAULT_OTHER_INCOME = 10_000

/** Nearest value in a sorted grid. */
function snap(points: number[], value: number): number {
  return points.reduce(
    (best, v) => (Math.abs(v - value) < Math.abs(best - value) ? v : best),
    points[0],
  )
}

function formatK(v: number): string {
  return `$${Math.round(v / 1000)}k`
}

/** Compose the plottable series for one (filing, ss) grid point. */
function seriesAt(
  household: Household,
  filing: FilingStatus,
  ssBenefit: number,
): ChartSeries | null {
  const point = household.grid[filing]?.[String(ssBenefit)]
  if (!point) return null
  const label =
    filing === 'married'
      ? `Married couple, both aged 67, ${formatK(ssBenefit)} combined Social Security`
      : `Single filer, aged 67, ${formatK(ssBenefit)} Social Security`
  return {
    label,
    other_income: household.other_income,
    baseline_net_income: point.baseline_net_income,
    reform_net_income: point.reform_net_income,
  }
}

/** Gain under the reform at one full grid coordinate. */
function gainAt(
  household: Household,
  filing: FilingStatus,
  ssBenefit: number,
  otherIncome: number,
): number {
  const point = household.grid[filing]?.[String(ssBenefit)]
  if (!point) return 0
  const i = household.other_income.reduce(
    (best, v, idx) =>
      Math.abs(v - otherIncome) <
      Math.abs(household.other_income[best] - otherIncome)
        ? idx
        : best,
    0,
  )
  return point.reform_net_income[i] - point.baseline_net_income[i]
}

export default function HouseholdPage() {
  const { data: household, isLoading, isError } = useHousehold()
  const [filing, setFiling] = useState<FilingStatus>(DEFAULT_FILING)
  const [ssBenefit, setSsBenefit] = useState(DEFAULT_SS_BENEFIT)
  const [otherIncome, setOtherIncome] = useState(DEFAULT_OTHER_INCOME)

  const ssPoints = household?.ss_benefit_points[filing] ?? []
  const snappedSs = ssPoints.length ? snap(ssPoints, ssBenefit) : ssBenefit
  const series = household ? seriesAt(household, filing, snappedSs) : null

  const index = series ? nearestIndex(series, otherIncome) : 0
  const gain = series
    ? series.reform_net_income[index] - series.baseline_net_income[index]
    : 0

  // Precomputed gain for each representative case (grid lookups, no compute).
  const presetGains = useMemo(() => {
    if (!household) return {}
    return Object.fromEntries(
      household.presets.map((p) => [
        p.id,
        gainAt(household, p.filing, p.ss_benefit, p.other_income),
      ]),
    )
  }, [household])

  const selectedPresetId =
    household?.presets.find(
      (p) =>
        p.filing === filing &&
        p.ss_benefit === snappedSs &&
        p.other_income === otherIncome,
    )?.id ?? null

  function applyPreset(preset: HouseholdPreset) {
    setFiling(preset.filing)
    setSsBenefit(preset.ss_benefit)
    setOtherIncome(preset.other_income)
  }

  function changeFiling(next: FilingStatus) {
    setFiling(next)
    if (household) setSsBenefit(snap(household.ss_benefit_points[next], ssBenefit))
  }

  return (
    <>
      <PageShell>
        <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">
            How HR 904 affects example households
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            The tax on Social Security benefits depends on filing status, the
            benefit amount, and other income entering combined income — so
            those are the inputs. Select an example household, then
            adjust. Every point is precomputed with PolicyEngine; there is no
            live compute.
          </p>
        </header>

        {isLoading && (
          <p className="text-muted-foreground">Loading household examples…</p>
        )}
        {isError && (
          <p className="text-error-foreground">
            Could not load the household examples.
          </p>
        )}

        {household && series && (
          <>
            <section className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">Example households</h3>
              <PresetCards
                presets={household.presets}
                gains={presetGains}
                selectedId={selectedPresetId}
                onSelect={applyPreset}
              />
            </section>

            <section className="flex flex-col gap-4 max-w-xl">
              <h3 className="text-lg font-semibold">Adjust the household</h3>
              <HouseholdControls
                filing={filing}
                onFilingChange={changeFiling}
                ssBenefit={snappedSs}
                onSsBenefitChange={setSsBenefit}
                ssBenefitPoints={ssPoints}
                otherIncome={otherIncome}
                onOtherIncomeChange={setOtherIncome}
              />
            </section>

            <section>
              <MetricCard
                label="Net income change under HR 904"
                value={gain}
                format="currency"
                trend={gain >= 0 ? 'positive' : 'negative'}
              />
            </section>

            <section>
              <HouseholdNetIncomeChart
                series={series}
                highlightIncome={otherIncome}
              />
            </section>
          </>
        )}
        </div>
      </PageShell>
    </>
  )
}
