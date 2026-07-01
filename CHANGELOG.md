# Changelog

## Unreleased

### Added
- Added Signal Lab with ranked stock signals, risk scoring, upside estimates, sector signal map, persistent watchlist, and strategy backtests.
- Added reusable analytics helpers for volatility, max drawdown, analyst upside, community bullishness, signal score, and equal-weight backtest curves.
- Added CSV export for Signal Lab and filtered Screener results.
- Added dashboard and sidebar navigation into the new Signals workflow.
- Added Production Ops page for CI/CD, Docker staging, cloud hosting, caching, WAF/rate limiting, observability, queue/serverless/database planning, availability, and throughput targets.
- Added frontend error boundary with local incident logging, release stamps, and retry recovery.
- Added Ops data-delivery, security, caching, sharding, queueing, WebSocket, polling, RPC, and throughput planning sections.
- Added versioned browser storage helpers and moved Signal Lab watchlist persistence onto the safer storage API.
- Added GitHub Actions CI workflow, Docker staging image, nginx SPA/cache/security config, Kubernetes starter manifest, and production runbook.

### Changed
- Split page routes with `React.lazy` and `Suspense` so the app no longer ships every research surface in the first bundle.
- Updated Vite and the React plugin to current versions and resolved `npm audit` findings.
- Fixed the GitHub Pages base path and React Router basename for the actual `stock-alpha-` repository name.
- Corrected README clone, local URL, deployment URL, tech stack, and project structure.
- Opted into React Router v7 future flags to avoid noisy development warnings.
