// Data client for the precomputed HR 904 dashboard.
//
// Precomputed pattern: results are bundled at build time (public/data/*.json),
// so "fetching" is synchronous. The async signatures keep a consistent
// data-loading contract with React Query and with dashboards that use a live API.
import { impact, parameters, validation, household } from './fixtures'
import type { Impact, Parameters, Validation, Household } from './types'

export async function getImpact(): Promise<Impact> {
  return impact
}

export async function getParameters(): Promise<Parameters> {
  return parameters
}

export async function getValidation(): Promise<Validation> {
  return validation
}

export async function getHousehold(): Promise<Household> {
  return household
}
