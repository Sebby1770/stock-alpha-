# Changelog

All notable changes to AlphaRank are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-08-10

### Added
- Pure quant engine in `src/lib/quant.js`: `scoreStock`, `gradeFromScore`, `calcQuantScore`, `filterScreener`, `sortStocks`, `stocksToCsv`
- Vitest unit tests for scoring weights, grade thresholds, screener filters, and CSV export
- **Watchlist** persisted in `localStorage` (star from cards, screener, detail, dedicated page)
- **Compare mode** for 2–3 tickers with side-by-side factor radar and bars
- **Dark / light theme** toggle (persisted)
- **Export CSV** of current screener results
- Navbar search with keyboard shortcut `/`, arrow-key navigation, and empty-result state
- Grade and factor **tooltips** explaining the 5-factor model
- Paper **portfolio** with add/remove positions and `localStorage` persistence
- GitHub Actions CI (`.github/workflows/ci.yml`): install, test, lint, build
- Skip-to-content link and improved focus rings / ARIA labels

### Changed
- Version bumped to 2.0.0
- Vite `base` defaults to `/stock-alpha-/` (repo name) and is configurable via `VITE_BASE`
- Router basename derived from `import.meta.env.BASE_URL`
- Screener uses pure quant helpers for filter/sort
- Sidebar links for Watchlist and Compare; disclaimer for mock data
- README architecture and scripts updated

### Fixed
- Empty screener results show a clear empty state with clear-filters action
- Portfolio no longer hard-codes holdings only — supports paper trading UX

## [1.0.0] — Initial release

- Dashboard with live-ticking mock indices
- 5-factor quant grades (A+–F)
- Stock detail with charts and factor radar
- Screener, community feed, and sample portfolio
- React 18 + Vite + Tailwind + Recharts
