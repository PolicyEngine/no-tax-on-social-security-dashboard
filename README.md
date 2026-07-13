# No tax on Social Security: analyzing HR 904

An interactive PolicyEngine dashboard analyzing [HR 904](https://www.congress.gov/bill/119th-congress/house-bill/904),
which would eliminate federal income taxation of Social Security benefits by
zeroing out the IRC 86 taxability rates.

The dashboard reports, for 2026:

- **Annual federal cost** — the reduction in federal revenue
- **Change in poverty** — overall and among seniors (SPM)
- **Winners and losers by income decile** — share of households gaining/losing
- **Average income change by income decile**
- **Poverty rate by age group**, baseline vs reform

## Data

This dashboard uses the **precomputed** data pattern. The reform is a single
fixed definition, so the impact is computed once and shipped as static JSON.

`scripts/precompute.py` fetches the economy-wide comparison from the hosted
PolicyEngine v1 API (`https://api.policyengine.org`) and writes
`public/data/impact.json`. It never runs a local microsimulation.

```bash
make data
```

## Development

```bash
bun install
make dev       # http://localhost:4000 (or next free port up to 4100)
make test
make build
```

## Tech stack

- Next.js (App Router) + TypeScript, static export
- Tailwind CSS v4 + `@policyengine/ui-kit` theme
- Recharts
- Vitest
- Deployed to Vercel; embedded in policyengine.org as a multi-zone at
  `/us/no-tax-on-social-security-dashboard`
