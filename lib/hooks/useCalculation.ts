import { useQuery } from '@tanstack/react-query'
import {
  getImpact,
  getParameters,
  getValidation,
  getHousehold,
} from '../api/client'
import type {
  Impact,
  Parameters,
  Validation,
  Household,
} from '../api/types'

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

/** Loads the precomputed HR 904 parameter-change table (policy page). */
export function useParameters() {
  return useQuery<Parameters>({
    queryKey: ['parameters'],
    queryFn: getParameters,
    staleTime: Infinity,
  })
}

/** Loads benchmarks, model/data versions, and the SSA calibration check (validation page). */
export function useValidation() {
  return useQuery<Validation>({
    queryKey: ['validation'],
    queryFn: getValidation,
    staleTime: Infinity,
  })
}

/** Loads precomputed household-example series (household page). */
export function useHousehold() {
  return useQuery<Household>({
    queryKey: ['household'],
    queryFn: getHousehold,
    staleTime: Infinity,
  })
}
