'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PolicyEngineHeader } from '@policyengine/ui-kit'

/**
 * Standard dashboard chrome, matching the newest one-off dashboards
 * (south-carolina-2026-tax-changes, tx-rebate-checks): the PolicyEngine
 * site header on top, a primary-500 hero band with the dashboard title,
 * folder-style page tabs, and page content in a white card on gray-50.
 *
 * Internal page links never go into the header's navItems — that nav
 * belongs to policyengine.org. Next.js `Link` keeps routes
 * basePath-prefixed for the multi-zone deployment.
 */
const PAGES = [
  { label: 'The reform', href: '/' },
  { label: 'Validation', href: '/validation' },
  { label: 'Impacts', href: '/impacts' },
  { label: 'Households', href: '/household' },
]

/** Trailing-slash-insensitive match (trailingSlash: true in next.config). */
function isActive(pathname: string, href: string): boolean {
  const normalize = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p)
  return normalize(pathname) === normalize(href)
}

export function PageShell({ children }: { children: React.ReactNode }) {
  // Nullish in non-router contexts (unit tests render without the app router).
  const pathname = usePathname() ?? ''

  return (
    <>
      <PolicyEngineHeader country="us" />
      <main className="min-h-screen bg-gray-50">
        <div className="bg-primary-500 px-4 py-8 text-white shadow-md">
          <div className="mx-auto max-w-5xl">
            <h1 className="mb-2 text-4xl font-bold">No tax on Social Security</h1>
            <p className="text-lg opacity-90">
              See the impact of HR 904, which would eliminate federal income
              taxation of Social Security benefits
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8">
          <nav aria-label="Dashboard pages" className="mb-4 flex space-x-1 overflow-x-auto">
            {PAGES.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(pathname, href) ? 'page' : undefined}
                className={`whitespace-nowrap rounded-t-lg px-6 py-3 font-semibold transition-colors ${
                  isActive(pathname, href)
                    ? 'border-t-4 border-primary-500 bg-white text-primary-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="rounded-lg bg-white p-6 shadow-md">{children}</div>
        </div>
      </main>
    </>
  )
}
