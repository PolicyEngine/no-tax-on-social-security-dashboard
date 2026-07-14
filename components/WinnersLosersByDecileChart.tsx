'use client'

import { ChartContainer, PEWinnersLosersChart } from '@policyengine/ui-kit'
import type { WinnersLosersDatum } from '@policyengine/ui-kit'
import type { IntraDecile, WinnerLoserBand } from '@/lib/api/types'

interface Props {
  data: IntraDecile
}

/** Human-readable band labels, in stacking order (best outcome first). */
const BANDS: WinnerLoserBand[] = [
  'Gain more than 5%',
  'Gain less than 5%',
  'No change',
  'Lose less than 5%',
  'Lose more than 5%',
]

/**
 * Builds one row per income decile, each holding the share (0-1) of households
 * in every winner/loser band. Exported so tests can assert the stack sums to ~1.
 */
export function buildWinnersLosersRows(data: IntraDecile) {
  return Array.from({ length: 10 }, (_, i) => {
    const row: Record<string, number> = { decile: i + 1 }
    for (const band of BANDS) row[band] = data.deciles[band]?.[i] ?? 0
    return row
  })
}

/** Maps a band-keyed row to the canonical ui-kit winners/losers segment shape. */
function toSegment(bands: Record<WinnerLoserBand, number>) {
  return {
    gainMore5: bands['Gain more than 5%'] ?? 0,
    gainLess5: bands['Gain less than 5%'] ?? 0,
    noChange: bands['No change'] ?? 0,
    loseLess5: bands['Lose less than 5%'] ?? 0,
    loseMore5: bands['Lose more than 5%'] ?? 0,
  }
}

/**
 * Winners and losers by income decile — the canonical PolicyEngine chart
 * (`PEWinnersLosersChart`): a 100%-normalised horizontal stack of the share of
 * households in each outcome band per income decile, plus an "All" summary row.
 */
export function WinnersLosersByDecileChart({ data }: Props) {
  const chartData: WinnersLosersDatum[] = Array.from({ length: 10 }, (_, i) => ({
    name: String(i + 1),
    ...toSegment(
      Object.fromEntries(
        BANDS.map((band) => [band, data.deciles[band]?.[i] ?? 0]),
      ) as Record<WinnerLoserBand, number>,
    ),
  }))

  return (
    <ChartContainer
      title="Winners and losers by income decile"
      subtitle="Share of households in each outcome band, by income decile"
      downloadFilename="winners-losers-by-decile"
    >
      <PEWinnersLosersChart
        data={chartData}
        allData={toSegment(data.all)}
        xLabel="Share of households"
        yLabel="Income decile"
      />
    </ChartContainer>
  )
}
