# no-tax-on-social-security-dashboard

Analysis of HR 904, which would eliminate federal income taxation of Social
Security benefits by zeroing out the IRC 86 taxability rates (single year, 2026).

The dashboard has **four pages** (Next.js App Router routes):

1. `/` — **policy explanation**: provision-by-provision prose, primary-source
   links, and the parameter-change table (`ParameterTable` ← `parameters.json`).
2. `/validation` — **how the numbers were produced**: benchmark comparison
   (`BenchmarkComparisonTable`), model/data versions (`ModelVersionsCard`),
   methodology note, and the SSA data-calibration check (`CalibrationSection`),
   all ← `validation.json` + `impact.json`.
3. `/impacts` — **economic impact**: headline MetricCards + the three retained
   distributional charts, ← `impact.json`.
4. `/household` — **example households**: `HouseholdControls` (example selector +
   other-income slider) and `HouseholdNetIncomeChart`, ← `household.json`.

Shared nav lives in `components/SiteHeader.tsx` (ui-kit `Header` + Next.js
`Link` for basePath-safe internal routing).

## Architecture

- Next.js App Router with Tailwind CSS v4 and the `@policyengine/ui-kit` theme
- `@policyengine/ui-kit` for standard UI components (Header, MetricCard, ChartContainer, DataTable, Card, SelectInput, SliderInput)
- Recharts for the custom distributional and household charts
- **Data pattern: precomputed JSON.** The reform is a single fixed definition,
  so the entire result set is computed once by `scripts/precompute.py` and shipped
  as static JSON at `public/data/{impact,parameters,validation,household}.json`.
  The frontend imports these directly; there is no runtime backend.

### Precompute (data generation)

`scripts/precompute.py` fetches the economy-wide comparison from the **hosted**
PolicyEngine v1 API (`https://api.policyengine.org`) — the same server-side
compute that powers policyengine.org.

**CRITICAL:** the script MUST NOT run a local `policyengine-us` microsimulation.
National microsim OOM-kills 16GB CI runners (exit 143). Always use the hosted API.

```bash
make data   # POST reform.json -> policy id, then GET economy impact, write impact.json
```

## Development

```bash
bun install
make dev            # Frontend dev server (ports 4000-4100)
make dev-frontend   # Same (no backend for this data pattern)
```

## Testing

```bash
make test
```

## Build

```bash
make build
```

## Multi-zone

Served behind policyengine.org at `/us/no-tax-on-social-security-dashboard`
(static export). `next.config.mjs` sets `basePath` and a phase-gated
`assetPrefix`; `vercel.json` carries the self-rewrite for direct zone previews.

## Design standards

- Uses Tailwind CSS v4 with `@policyengine/ui-kit/theme.css` (single import for all tokens)
- `@policyengine/ui-kit` for all standard UI components
- Primary teal: `bg-teal-500` / `text-teal-500`
- Semantic colors: `bg-primary`, `text-foreground`, `text-muted-foreground`
- Font: Inter (via `next/font/google`)
- Sentence case for all headings
- Charts use `fill="var(--chart-*)"` for series colors and `niceTicks="snap125"` on axes
