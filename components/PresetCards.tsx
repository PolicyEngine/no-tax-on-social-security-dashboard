'use client'

import { formatCurrency } from '@policyengine/ui-kit'
import type { HouseholdPreset } from '@/lib/api/types'

interface Props {
  presets: HouseholdPreset[]
  /** Precomputed net-income gain under the reform for each preset id. */
  gains: Record<string, number>
  selectedId: string | null
  onSelect: (preset: HouseholdPreset) => void
}

/**
 * Representative precomputed cases. Each card is one grid point; selecting it
 * sets the three controls so the reader can explore from a realistic anchor.
 */
export function PresetCards({ presets, gains, selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {presets.map((preset) => {
        const gain = gains[preset.id] ?? 0
        const selected = preset.id === selectedId
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset)}
            aria-pressed={selected}
            className={`flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors ${
              selected
                ? 'border-primary-500 bg-primary-500/5'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="font-semibold text-gray-900">{preset.label}</span>
            <span className="text-xs text-gray-500">{preset.description}</span>
            <span
              className={`mt-2 text-lg font-bold ${
                gain > 0 ? 'text-primary-600' : 'text-gray-700'
              }`}
            >
              {gain > 0 ? '+' : ''}
              {formatCurrency(gain)}
              <span className="ml-1 text-xs font-medium text-gray-500">/yr</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
