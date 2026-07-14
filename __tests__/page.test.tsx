import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PolicyPage from '@/app/page'
import ValidationPage from '@/app/validation/page'
import ImpactsPage from '@/app/impacts/page'
import HouseholdPage from '@/app/household/page'

// ResizeObserver is not implemented in jsdom; recharts' ResponsiveContainer needs it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).ResizeObserver = ResizeObserverStub

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('Four-page dashboard', () => {
  it('policy page renders its heading', () => {
    renderWithClient(<PolicyPage />)
    expect(
      screen.getByRole('heading', { name: /what hr 904 changes/i }),
    ).toBeInTheDocument()
  })

  it('validation page renders its heading', () => {
    renderWithClient(<ValidationPage />)
    expect(
      screen.getByRole('heading', {
        name: /how we produced and checked these numbers/i,
      }),
    ).toBeInTheDocument()
  })

  it('impacts page renders its heading', () => {
    renderWithClient(<ImpactsPage />)
    expect(
      screen.getByRole('heading', { name: /economic impact of hr 904/i }),
    ).toBeInTheDocument()
  })

  it('household page renders its heading', () => {
    renderWithClient(<HouseholdPage />)
    expect(
      screen.getByRole('heading', {
        name: /how hr 904 affects example households/i,
      }),
    ).toBeInTheDocument()
  })

  it('policy page exposes navigation to the other pages', () => {
    renderWithClient(<PolicyPage />)
    for (const label of [/validation/i, /impacts/i, /households/i]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('household page renders the representative presets and reform-lever controls from the real data', async () => {
    renderWithClient(<HouseholdPage />)
    // Preset cards (bundled household.json flows through the full page).
    expect(
      await screen.findByRole('heading', { name: /representative households/i }),
    ).toBeInTheDocument()
    for (const label of [
      /average single retiree/i,
      /average retired couple/i,
      /senior still working part-time/i,
      /higher-income couple/i,
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    // The reform's levers are the controls.
    for (const label of [
      /filing status/i,
      /annual social security benefit/i,
      /other taxable income/i,
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })
})
