import { useQuery } from '@tanstack/react-query'
import { getImpact } from '../api/client'
import type { Impact } from '../api/types'

/**
 * Loads the precomputed HR 904 economy-wide impact.
 *
 * Precomputed pattern: data is bundled at build time and resolves immediately,
 * but we still route it through React Query for a consistent data-loading API
 * (loading / error states) across dashboards.
 */
export function useImpact() {
  return useQuery<Impact>({
    queryKey: ['impact'],
    queryFn: getImpact,
    staleTime: Infinity,
  })
}
