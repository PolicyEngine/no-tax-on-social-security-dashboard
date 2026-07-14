// Data client for the precomputed HR 904 dashboard.
//
// Precomputed pattern: results are bundled at build time (public/data/impact.json),
// so "fetching" is synchronous. The async signature keeps a consistent data-loading
// contract with React Query and with dashboards that use a live API.
import { impact } from './fixtures'
import type { Impact } from './types'

export async function getImpact(): Promise<Impact> {
  return impact
}
