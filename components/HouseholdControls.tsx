'use client'

import { SelectInput, SliderInput, formatCurrency } from '@policyengine/ui-kit'
import type { HouseholdExampleId } from '@/lib/api/types'

interface Props {
  example: HouseholdExampleId
  onExampleChange: (id: HouseholdExampleId) => void
  otherIncome: number
  onOtherIncomeChange: (value: number) => void
  /** Options for the example-household selector (label + id). */
  exampleOptions: { value: HouseholdExampleId; label: string }[]
}

/** Other-taxable-income slider bounds — matches the precomputed sweep. */
export const OTHER_INCOME_MIN = 0
export const OTHER_INCOME_MAX = 150000
export const OTHER_INCOME_STEP = 5000

/**
 * Controls for the household-example page: pick an archetypal senior household
 * and its other (non-SS) taxable income. The slider selects among precomputed
 * points in household.json — there is no live compute.
 */
export function HouseholdControls({
  example,
  onExampleChange,
  otherIncome,
  onOtherIncomeChange,
  exampleOptions,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SelectInput
        label="Example household"
        value={example}
        onChange={(v) => onExampleChange(v as HouseholdExampleId)}
        options={exampleOptions}
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
