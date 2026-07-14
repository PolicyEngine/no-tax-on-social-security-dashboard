'use client'

import Link from 'next/link'
import { Header, logos } from '@policyengine/ui-kit'

/**
 * Shared header + primary navigation across the four dashboard pages.
 *
 * Uses the ui-kit Header with Next.js `Link` as the link component so internal
 * routes are basePath-prefixed automatically for the multi-zone deployment.
 */
const NAV_ITEMS = [
  { label: 'The reform', href: '/' },
  { label: 'Validation', href: '/validation' },
  { label: 'Impacts', href: '/impacts' },
  { label: 'Households', href: '/household' },
]

export function SiteHeader() {
  return (
    <Header
      navItems={NAV_ITEMS}
      linkComponent={Link}
      logoSrc={logos.whiteWordmark}
      logoHref="https://policyengine.org"
    />
  )
}
