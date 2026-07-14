'use client'

import { SelectInput, SliderInput, formatCurrency } from '@policyengine/ui-kit'
import type { FilingStatus } from '@/lib/api/types'

interface Props {
  filing: FilingStatus
  onFilingChange: (f: FilingStatus) => void
  ssBenefit: number
  onSsBenefitChange: (value: number) => void
  /** Precomputed SS benefit grid for the current filing status. */
  ssBenefitPoints: number[]
  otherIncome: number
  onOtherIncomeChange: (value: number) => void
}

/** Other-taxable-income slider bounds — matches the precomputed sweep. */
export const OTHER_INCOME_MIN = 0
export const OTHER_INCOME_MAX = 150000
export const OTHER_INCOME_STEP = 5000

const FILING_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single filer, aged 67' },
  { value: 'married', label: 'Married couple, both aged 67' },
]

/**
 * Household inputs mirror the reform's levers. HR 904 changes how Social
 * Security benefits are taxed, and the current-law tax depends on filing
 * status, the benefit amount, and other income entering combined income —
 * so those are the three controls. Sliders select among precomputed grid
 * points in household.json; there is no live compute.
 */
export function HouseholdControls({
  filing,
  onFilingChange,
  ssBenefit,
  onSsBenefitChange,
  ssBenefitPoints,
  otherIncome,
  onOtherIncomeChange,
}: Props) {
  const ssMin = ssBenefitPoints[0]
  const ssMax = ssBenefitPoints[ssBenefitPoints.length - 1]

  return (
    <div className="flex flex-col gap-4">
      <SelectInput
        label="Filing status"
        value={filing}
        onChange={(v) => onFilingChange(v as FilingStatus)}
        options={FILING_OPTIONS}
      />
      <SliderInput
        label={
          filing === 'married'
            ? 'Combined annual Social Security benefits'
            : 'Annual Social Security benefit'
        }
        value={ssBenefit}
        onChange={onSsBenefitChange}
        min={ssMin}
        max={ssMax}
        step={5000}
        formatValue={(v) => formatCurrency(v)}
      />
      <SliderInput
        label="Other taxable income (pension, wages, IRA)"
        value={otherIncome}
        onChange={onOtherIncomeChange}
        min={OTHER_INCOME_MIN}
        max={OTHER_INCOME_MAX}
        step={OTHER_INCOME_STEP}
        formatValue={(v) => formatCurrency(v)}
      />
    </div>
  )
}
