'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PolicyEngineHeader } from '@policyengine/ui-kit'

/**
 * Standard dashboard chrome: the real PolicyEngine site header on top
 * (site nav, logo, country selector), with this dashboard's page
 * navigation as a tab strip below it. Internal page links never go into
 * the header's navItems — that nav belongs to policyengine.org.
 *
 * Next.js `Link` keeps internal routes basePath-prefixed for the
 * multi-zone deployment.
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

export function SiteHeader() {
  // Nullish in non-router contexts (unit tests render without the app router).
  const pathname = usePathname() ?? ''

  return (
    <>
      <PolicyEngineHeader country="us" />
      <nav aria-label="Dashboard pages" className="border-b border-border bg-background">
        {/* Container matches SingleColumnLayout (976px, px-4) so tabs align with page content */}
        <div className="mx-auto flex gap-6 overflow-x-auto px-4" style={{ maxWidth: '976px' }}>
          {PAGES.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? 'page' : undefined}
              className={`-mb-px whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                isActive(pathname, href)
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
