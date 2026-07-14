'use client'

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
  const { data: parameters } = useParameters()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="max-w-content mx-auto px-6 py-8 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">What HR 904 changes</h1>
          <p className="text-muted-foreground max-w-2xl">
            A plain-language, provision-by-provision explanation of HR 904, with
            links to the primary source and the parameter table derived from the
            reform JSON.
          </p>
        </header>

        <section className="flex flex-col gap-3 max-w-2xl">
          <h2 className="text-xl font-semibold">The reform</h2>
          <p className="text-muted-foreground">
            HR 904 eliminates federal income taxation of Social Security
            benefits. Under current law up to 85% of benefits are included in
            taxable income via the IRC 86 formula; HR 904 sets all five inclusion
            rates to zero, so no Social Security benefits are federally taxed.
          </p>
          {/* TODO: Explain each of the five rates (base excess/benefit_cap,
              additional excess/benefit_cap/bracket) in plain language. */}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Primary sources</h2>
          <ul className="list-disc pl-5">
            {PRIMARY_SOURCES.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  className="text-teal-500 hover:underline"
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
          {parameters && <ParameterTable rows={parameters.rows} />}
        </section>
      </main>
    </div>
  )
}
