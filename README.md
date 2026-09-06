# Sarateal Frontend

React/Vite frontend for Sarateal, an open-source farmer market access and food supply intelligence platform.

## STMOI opportunity engine

The frontend implements the **Spatiotemporal Market Opportunity Index (STMOI)** methodology
client-side. Per market–product cell it computes two separate scores:

- **Opportunity (O)** — weighted renormalized sum of evidence-backed components: supply–demand
  imbalance, price trend/level/volatility, spatial accessibility (underserved reach), seasonal
  + weather suitability, and competition. Only components with real evidence (confidence ≥ 0.05)
  participate.
- **Confidence (C)** — weighted sum over all five components of per-component confidence
  `f(N, R, Q, S, D)` (count ≥ 3 real points, recency, plausibility/quality, spatial spread,
  contributor diversity).

The two scores are combined **only** through the 2×2 entry-signal rule (strong entry / promising /
avoid / insufficient data). No blended score, no simulated or imputed records: empty data shows as
low confidence, never as a filled-in guess.

## Local-first data (IndexedDB via Dexie)

All observations (supply, demand, price) are stored in the browser in IndexedDB using
**Dexie.js** (`src/lib/db.ts`), with stores: `supplies`, `demands`, `prices`, `locations`
(geocode cache), `weatherCache`, `counties`, `products`, `markets`, `matches`, `settings`,
`matchEvents`.

- Reference data (counties, products, markets) is seeded from the Sarateal API with a 7-day TTL
  (`src/lib/cache.ts`).
- Live signals are TTL-cached: Open-Meteo weather for 3 h and Nominatim/OSM location lookup for
  30 days. Geocoding runs **directly in the browser** against the public Nominatim API (no backend
  geocoding endpoint) — unknown market/place names are resolved client-side and cached in Dexie
  (`src/lib/live.ts`).
- `src/engine/` holds the scoring engine, weights, and entry-signal rules.
- Top opportunity cells (signal = strong entry / promising) auto-persist to the `matches` store and
  can be tracked through their lifecycle (open → contacted → deal → closed) with real outcome notes
  (`src/engine/matches.ts`, `src/components/stmoi/MatchesPanel.tsx`). The matches tab adds status
  roll-ups, sort controls, an O-threshold pruner (dismiss all below a value), and a **match
  advisor** (`src/engine/advice.ts`): status-and-age rules suggest the next concrete step per card
  (follow up a stale open, re-engage a stalled contact, record thin evidence on a promising cell,
  close an agreed deal), and the stats row shows how many active matches need follow-up now.
- Entry forms support both single records and **batch import** — one pipe-delimited line per
  record, e.g. `supply|Bungoma|Maize|2000|kg` (`src/components/stmoi/EntryForms.tsx`).
- The **Opportunity** tab is the map-dominant signature surface: scored market–product locations
  render on a Leaflet map (soft CARTO basemap, marker size ∝ opportunity, fill colour = entry
  signal), and clicking a location opens a detail card with the O/C bars, supply–demand–price
  stats, a live-weather note, the per-component breakdown, and the exact evidence gaps blocking
  action (`src/components/stmoi/OpportunityScreen.tsx`, `src/components/stmoi/OpportunityMap.tsx`).
  Full-text and entry-signal filters drive both map and list, and the scored cells can be exported
  as a CSV report — unscored cells are dropped, rows are deterministic with an `actionable` flag
  and the latest match status per cell (`src/lib/export.ts`, `surfaceCsv`).
- The whole workspace lives in `src/components/stmoi/` (entry forms, map-dominant opportunity
  surface, matches, data & export, live signals).
- **Evidence-gap intelligence** (`src/engine/gaps.ts`): every cell lists exactly what is missing to
  act — per-component record counts against the three-point floor and live-signal blockers — and a
  surface-level **coverage summary** reports how many cells are scored, ready to act, and how many
  evidence gaps remain.
- The **Data & export** tab (`src/lib/export.ts`, `src/components/stmoi/DatasetPanel.tsx`)
  downloads the full local dataset as JSON or **CSV** and restores it again from either format
  (validated schema, deduplicated matches, safe defaults on import, **per-row skip reasons** on CSV
  import). Imports now go through a **preview-first flow**: the file is parsed and summarized
  (counts vs current records, deduplicated match count, row samples, skipped rows) and nothing is
  applied until you confirm. JSON exports are **schema v2** and carry the `matchEvents` lifecycle
  history so time-to-deal analytics survive a round-trip (v1 files still import). A **record
  management** panel lists every stored supply, demand, price and match with one-click deletion
  (`src/components/stmoi/RecordsManager.tsx`). Deletions are recoverable: they move to a capped
  **trash** (`trash` store, `src/lib/trash.ts`) where any record can be restored or purged.
  Explicit controls refresh the reference cache or erase all records. Its `buildDatasetSnapshot()`
  output doubles as the payload boundary for the optional remote-sync step.
- The matches tab can **restore dismissed matches** (with a show/hide dismissed section), alongside
  its status roll-ups, sort controls, and O-threshold pruner. Every status change is recorded as a
  **lifecycle event** (`matchEvents` store) so each card shows its own timeline and the panel can
  compute real **time-to-deal analytics** — deal rate, average O among deals, and median days from
  open to deal (`src/engine/matches.ts`, `src/engine/matchAnalytics.ts`).
- The **Sensitivity** tab exposes the methodology knobs — the five component weights and both
  entry-signal thresholds — as sliders that renormalize to 100%, recompute the surface live, and
  persist per-browser in a Dexie `settings` store (`src/engine/config.ts`,
  `src/components/stmoi/SensitivityPanel.tsx`, `src/lib/db.ts`). Sliders default to the exact
  methodology values; any deviation is flagged as a **what-if** view and never mutates records.
- **Data hygiene** (`src/lib/hygiene.ts`): records flagged as implausible (out-of-range
  price/quantity, unparseable date), **near-duplicates** (same product + market + contributor
  within 7 days), and **unit-coherence conflicts** (one market's price records mixing unit
  families like kg vs tonnes) are surfaced in the record-management panel.
- The **Insights** tab (`src/components/stmoi/InsightsPanel.tsx`, `src/engine/insights.ts`) gives a
  market-intelligence read over the live surface: top-5 opportunities (signal-first ranking, no
  blended O×C scores), a county leaderboard of actionable cells with tracked units and average O,
  evidence-coverage counts, and a match-pipeline funnel with deal rate + median time to deal.
- Matches newer than your last visit to the matches tab show a **"New since last visit"** chip
  (persisted in the `settings` store).
- The interface follows a **wabi-sabi × Apple** design language — warm paper surfaces, hairline
  borders, frosted-glass panels, soft layered shadows, and a restrained olive/tan/rust palette —
  tuned in `src/App.css`. The site is split across three real paths (no router dependency): `/`
  marketing hero + features, `/app` the working STMOI tool, and `/developers` the API overview
  linked from the footer (`src/App.tsx` resolves `location.pathname` with a `#/app` hash fallback
  for older links).

## Crawlability & AI extraction

- **Prerendered static content**: the production build runs `scripts/prerender.ts` after
  `vite build`, baking the core text of each page into the initial HTML — `dist/index.html`
  (home), `dist/app.html`, and `dist/developers.html` — so a raw-HTML crawler sees the full page
  in the first response even if interactive widgets are still client-rendered. `vercel.json`
  rewrites `/app` and `/developers` to those files. All copy comes from one source of truth,
  `src/lib/seo.ts`, shared with the React components (hero, features, workspace intro, API
  endpoints) so the static shell and the live app cannot drift.
- **Robots**: `dist/robots.txt` allows all crawlers explicitly, including ClaudeBot, GPTBot,
  OAI-SearchBot, ChatGPT-User, PerplexityBot, Google-Extended, Googlebot, Bingbot and Applebot,
  and points at `sitemap.xml`.
- **Sitemap**: `dist/sitemap.xml` lists `/`, `/app` and `/developers` with
  `https://sarateal-frontend.vercel.app` as the base (change `SITE.url` in `src/lib/seo.ts` when
  a custom domain is set).
- **Structured data**: schema.org JSON-LD is emitted per page — Organization + WebSite on home,
  SoftwareApplication on `/app`, WebPage on `/developers` — matched only to content that is
  visibly on the page.
- **`llms.txt`**: `dist/llms.txt` is a curated Markdown index (key pages, STMOI methodology, API
  endpoints). Cheap housekeeping; treat it as a hint, not a ranking signal.

## Backend

The frontend connects to the Sarateal API (serving reference data and live weather signals):

```text
https://sarateal.onrender.com
```
Set the API base URL with:

```text
VITE_API_BASE_URL=https://sarateal.onrender.com
```

## Development

```text
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Tests

The scoring engine has a regression suite that exercises the methodology math directly
(2×2 entry-signal rule, component weights, evidence-confidence ramp, recency/plausibility,
weather suitability, seasonality, competition, accessibility, and full surface integration), plus
**data round-trip tests** over the CSV parser (quoted fields, doubled quotes, numeric/boolean
coercion, product-name resolution, skipped rows), **evidence-gap tests** (blocking vs
one-sided gaps, coverage counts, the three-point floor), **configuration tests** (weight
renormalization, sanitization of stored configs, custom entry-signal thresholds), **data
conversion of stored configs, custom entry-signal thresholds), **data
hygiene tests** (plausibility flags, near-duplicate pairing rules), **match lifecycle tests**
(timeline ordering, time-to-deal, median deal durations), **match advisor tests** (status/age
rules, evidence nudges, dismissed/avoid exclusions), **insights tests** (opportunity
ranking, county aggregation, pipeline funnel, coverage, unit-conflict detection), **data-resilience
tests** (v2 snapshot parsing, import summaries, match dedupe, event normalization, trash cap):

```text
npm run test:engine   # node:test + tsx, no browser needed
```

## Build

```text
npm run build
```

Lint:

```text
npm run lint
```

Preview production build:

```text
npm run preview
```

## Tech stack

```text
React
TypeScript
Vite
CSS
Dexie.js (IndexedDB)
```