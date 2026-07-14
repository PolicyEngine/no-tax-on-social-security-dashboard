'use client'

import { SingleColumnLayout } from '@policyengine/ui-kit'
import { useParameters } from '@/lib/hooks/useCalculation'
import { SiteHeader } from '@/components/SiteHeader'
import { ParameterTable } from '@/components/ParameterTable'

const PRIMARY_SOURCES = [
  {
    label: 'HR 904 on congress.gov',
    href: 'https://www.congress.gov/bill/119th-congress/house-bill/904',
  },
]

export default function PolicyPage() {
  const { data: parameters, isLoading, isError } = useParameters()

  return (
    <>
      <SiteHeader />

      <SingleColumnLayout className="bg-background text-foreground">
        <main className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">What HR 904 changes</h1>
          <p className="text-muted-foreground max-w-2xl">
            A plain-language, provision-by-provision explanation of HR 904, with
            links to the primary source and the parameter table derived from the
            reform JSON.
          </p>
        </header>

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
            The IRC 86 calculation uses five separate rates. Each one is set to
            zero under HR 904:
          </p>
          <ul className="flex flex-col gap-3 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                First-tier rate on income above the lower threshold (50%).
              </span>{' '}
              For taxpayers over the first income threshold, up to half of the
              benefits above that threshold count as taxable income.
            </li>
            <li>
              <span className="font-medium text-foreground">
                First-tier benefit cap (50%).
              </span>{' '}
              The amount taxed under the first tier is capped at 50% of total
              benefits received.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Second-tier rate on income above the higher threshold (85%).
              </span>{' '}
              For higher-income taxpayers, the share of benefits above the
              second threshold that counts as taxable income rises to 85%.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Second-tier benefit cap (85%).
              </span>{' '}
              The total share of benefits that can be taxed is capped at 85%.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Second-tier bracket rate (85%).
              </span>{' '}
              Governs how the phase-in between the two thresholds combines with
              the 85% cap.
            </li>
          </ul>
          <p className="text-muted-foreground">
            Because all five rates become zero, the entire IRC 86 inclusion
            formula produces $0 of taxable Social Security benefits, regardless
            of a household&apos;s other income.
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
        </main>
      </SingleColumnLayout>
    </>
  )
}
