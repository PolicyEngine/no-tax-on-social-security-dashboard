import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Page from '@/app/page'

// ResizeObserver is not implemented in jsdom; recharts' ResponsiveContainer needs it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).ResizeObserver = ResizeObserverStub

function renderPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>,
  )
}

describe('Dashboard page', () => {
  it('renders the dashboard heading', () => {
    renderPage()
    expect(
      screen.getByRole('heading', {
        name: /No tax on Social Security: analyzing HR 904/i,
      }),
    ).toBeInTheDocument()
  })
})
