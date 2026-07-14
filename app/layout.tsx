import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'No tax on Social Security: HR 904 impact - PolicyEngine',
  description:
    'Federal impact of HR 904, which eliminates income taxation of Social Security benefits: budgetary cost, poverty and senior-poverty effects, and distributional change by income decile.',
  // Favicon is picked up automatically from app/icon.svg (basePath-safe).
  // Do NOT set icons: { icon: '/favicon.svg' } — that path is not basePath-prefixed
  // and resolves to the host's favicon when the zone is served behind policyengine.org.
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
