# Changelog

## Unreleased

### Added
- Added Signal Lab with calibrated stock signals, risk scoring, upside estimates, sector signal map, persistent watchlist, and explicitly illustrative historical scenarios.
- Added reusable analytics helpers for volatility, max drawdown, analyst upside, community bullishness, deterministic signal ranking, and equal-weight scenario curves.
- Added CSV export for Signal Lab and filtered Screener results.
- Added dashboard and sidebar navigation into the new Signals workflow.
- Added Production Ops page for CI/CD, Docker staging, cloud hosting, caching, WAF/rate limiting, observability, queue/serverless/database planning, availability, and throughput targets.
- Added frontend error boundary with local incident logging, release stamps, and retry recovery.
- Added Ops data-delivery, security, caching, sharding, queueing, WebSocket, polling, RPC, and throughput planning sections.
- Added versioned browser storage helpers and moved Signal Lab watchlist persistence onto the safer storage API.
- Added GitHub Actions CI workflow, Docker staging image, nginx SPA/cache/security config, Kubernetes starter manifest, and production runbook.
- Added a complete local portfolio workflow: validated add/edit/combine/remove/undo/reset operations, guarded persistence, CSV export, date-aligned equity history, factor/sector exposure, and concentration checks.
- Added a persistent simulated-data snapshot banner, synthetic news attribution, and tests for quote/range/date invariants.
- Added Vitest with 20 focused tests covering portfolio math, storage failures, signal calibration and determinism, scenario disclosure, timezone-safe data invariants, date-only formatting, and routing mode.

### Changed
- Split page routes with `React.lazy` and `Suspense` so the app no longer ships every research surface in the first bundle.
- Updated Vite and the React plugin to current versions and resolved `npm audit` findings.
- Switched GitHub Pages builds to refresh-safe hash routing while retaining normal browser routing for root-hosted builds.
- Corrected README clone, local URL, deployment URL, tech stack, and project structure.
- Opted into React Router v7 future flags to avoid noisy development warnings.
- Declared the Node.js versions required by Vite 8 and added CI test execution before production builds.
- Reworded the Ops cockpit and runbook so implemented controls, local-only error capture, and future cloud designs are not conflated.
- Added a keyboard-accessible mobile navigation menu so every research and operations route remains reachable without the desktop sidebar.
- Relabelled the portfolio history as a current-holdings replay, documented its cash-flow and transaction limitations, and clarified that factor inputs are manually curated synthetic fixtures.
- Downgraded unprovisioned S3/CDN, encryption, and deployment controls from “Ready” to “Designed.”

### Fixed
- Separated the fixed sidebar offset from the centered content container, eliminating desktop control overlap and horizontal page overflow.
- Made seeded market dates and chart labels explicitly UTC-safe, with CI coverage in a negative-offset timezone.
- Added undo recovery for sample-portfolio resets, exposed every allocation slice in the legend, and made compact factor scores screen-reader accessible.
- Replaced stale live-market and real-community wording across stock, screener, community, package, and HTML metadata surfaces; added a base-path-safe favicon.
- Recalibrated the signal formula so the leaderboard no longer saturates ten stocks at a score of 100; ticker ordering now provides a deterministic tie-breaker.
- Replaced the misleading strategy “backtest” claim with an explicit hindsight scenario warning because current snapshot inputs are replayed over past simulated prices.
- Derived current quotes from seeded history and expanded displayed 52-week ranges to contain every generated quote.
- Repeated nginx security headers inside cache locations, fixing `add_header` inheritance that previously removed them from app responses.
- Expanded the error boundary around navigation and route content and records hash routes in local incident paths.
- Made browser-storage writes report failure and added a persistent Portfolio warning when an in-session change cannot be saved.
- Surfaced blocked watchlist persistence, exposed strategy selection to assistive technology, and corrected the S3 deployment prefix to match the built asset base.
