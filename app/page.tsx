'use client'

import { MetricCard } from '@policyengine/ui-kit'
import { useImpact, useParameters } from '@/lib/hooks/useCalculation'
import { PageShell } from '@/components/PageShell'
import { ParameterTable } from '@/components/ParameterTable'

const PRIMARY_SOURCES = [
  {
    label: 'HR 904 on congress.gov',
    href: 'https://www.congress.gov/bill/119th-congress/house-bill/904',
  },
]

/** Share of households whose net income rises (any amount). */
function shareGaining(intra: Record<string, number>): number {
  return (intra['Gain more than 5%'] ?? 0) + (intra['Gain less than 5%'] ?? 0)
}

export default function PolicyPage() {
  const { data: parameters, isLoading, isError } = useParameters()
  const { data: impact } = useImpact()

  return (
    <>
      <PageShell>
        <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">What HR 904 changes</h2>
          <p className="text-muted-foreground max-w-2xl">
            Each provision of HR 904, with links to the primary source and the
            parameter table derived from the reform JSON.
          </p>
        </header>

        {impact && (
          <section className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">
              Key results ({impact.metadata.time_period})
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                label="Annual federal cost"
                value={Math.abs(impact.budget.budgetary_impact)}
                format="currency"
                trend="neutral"
              />
              <MetricCard
                label="Households with higher net income"
                value={shareGaining(impact.intra_decile.all)}
                format="percent"
                trend="neutral"
              />
              <MetricCard
                label="Change in senior poverty rate"
                value={
                  impact.poverty.senior.baseline
                    ? (impact.poverty.senior.reform -
                        impact.poverty.senior.baseline) /
                      impact.poverty.senior.baseline
                    : 0
                }
                format="percent"
                trend="neutral"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Static single-year estimates from the PolicyEngine
              microsimulation — see the Impacts tab for the distribution and
              the Validation tab for external benchmarks.
            </p>
          </section>
        )}

        <section className="flex flex-col gap-4 max-w-2xl">
          <h2 className="text-xl font-semibold">The reform</h2>
          <p className="text-muted-foreground">
            HR 904 eliminates federal income taxation of Social Security
            benefits. Under current law, taxpayers whose income exceeds certain
            thresholds must include part of their benefits in taxable income
            through the formula in section 86 of the Internal Revenue Code (IRC
            86) — up to 50% of benefits above a first threshold, and up to 85%
            above a second, higher threshold. HR 904 sets all five of the rates
            in that formula to zero, so no Social Security benefits are federally
            taxed for anyone.
          </p>
          <p className="text-muted-foreground">
            How much of a benefit is taxable under current law depends on
            combined income — adjusted gross income plus half of Social
            Security benefits — against two fixed thresholds:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Combined income</th>
                  <th className="py-2 pr-4 font-medium">Single filer</th>
                  <th className="py-2 pr-4 font-medium">Married filing jointly</th>
                  <th className="py-2 font-medium">Share of benefits taxable</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4">Below first threshold</td>
                  <td className="py-2 pr-4">&lt; $25,000</td>
                  <td className="py-2 pr-4">&lt; $32,000</td>
                  <td className="py-2 font-semibold text-gray-900">0%</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-4">Between thresholds</td>
                  <td className="py-2 pr-4">$25,000–$34,000</td>
                  <td className="py-2 pr-4">$32,000–$44,000</td>
                  <td className="py-2 font-semibold text-gray-900">Up to 50%</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Above second threshold</td>
                  <td className="py-2 pr-4">&gt; $34,000</td>
                  <td className="py-2 pr-4">&gt; $44,000</td>
                  <td className="py-2 font-semibold text-gray-900">Up to 85%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground">
            The IRC 86 formula implements this schedule through five rates. HR
            904 sets all five to zero, so the formula produces $0 of taxable
            benefits at every income level — the five parameters and their
            values under current law and HR 904 appear in the table below.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Primary sources</h2>
          <ul className="list-disc pl-5">
            {PRIMARY_SOURCES.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Parameter changes</h2>
          {isLoading && (
            <p className="text-muted-foreground">Loading parameters…</p>
          )}
          {isError && (
            <p className="text-error-foreground">
              Could not load the parameter table.
            </p>
          )}
          {parameters && <ParameterTable rows={parameters.rows} />}
        </section>
        </div>
      </PageShell>
    </>
  )
}
