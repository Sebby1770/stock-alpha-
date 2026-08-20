# Changelog

All notable changes to AlphaRank are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [4.0.0] — 2026-08-20

### Added
- Realized P&L on paper sells: `fill.realized = (price - lot.entryPrice) * shares - fee` (buys record `0`); `realizedPnL(ledger)` and `ledgerToCsv(ledger)` in `src/lib/broker.js`
- Portfolio **stops** (`src/lib/stops.js`): stop-loss / take-profit, `evaluateStops`; Check stops (and a one-shot check on mount) sells the full lot at last mock price with ledger note `stop`
- `backtestFactor` — rank by momentum lookback **or** static value / growth / profitability / revisions / composite scores vs equal-weight B&H; Lab strategy dropdown
- Correlation **Matrix** at `/matrix` (`src/lib/correlation.js`): Pearson pairwise on aligned daily returns, heatmap table
- Factor **attribution** (`src/lib/attribution.js`): value-weighted holdings vs equal-weight universe; card on Portfolio
- Watchlist **notes** persisted as `alpharank-notes` (`{ TICKER: string }`); textarea per row
- **Command palette** (`⌘K` / `Ctrl+K`) — filter routes (Dashboard, Screener, Lab, Alerts, Matrix, Portfolio, Watchlist, Compare) and tickers; Enter navigates, Esc closes
- Vitest: `stops.test.js`, `correlation.test.js`, `attribution.test.js`, plus realized/CSV and `backtestFactor` coverage

### Changed
- Version bumped to 4.0.0
- Paper book shape `{ version: 4, cash, holdings, ledger, stops }`; `migratePortfolio` upgrades v3 objects with `stops: []`
- Portfolio UI shows realized next to unrealized and **Export ledger CSV**
- Sidebar Tools group adds **Matrix**

## [3.0.0] — 2026-08-20

### Added
- Paper broker cash ledger (`src/lib/broker.js`): `buy` / `sell` with average-up lots, insufficient-cash/shares rejects, `positionValue`, `unrealizedPnL`
- Persisted book shape `{ version: 3, cash, holdings, ledger }` in `alpharank-portfolio`; migrates the old holdings array and seeds **$100,000** cash
- Portfolio UI: cash, equity, total P&L, buy **and** sell tickets, last-20 ledger, Max DD / Sharpe / HHI on the mock equity curve
- Risk engine (`src/lib/risk.js`): `maxDrawdown`, `volatility` (sample stdev), `sharpe`, `herfindahl`, `equityReturns`
- Momentum backtester (`src/lib/backtest.js`): equal-weight top-N vs universe buy-and-hold benchmark
- **Lab** page at `/lab` — lookback, topN, rebalance controls and dual equity chart
- **Alerts** (`src/context/AlertsContext.jsx`, `/alerts`): price above/below and grade-at-least rules, persisted as `alpharank-alerts`; sidebar badge = enabled count
- Vitest coverage: `broker.test.js`, `risk.test.js`, `backtest.test.js`

### Changed
- Version bumped to 3.0.0
- Holdings-only paper book replaced by a cash + lots broker; reset restores sample lots **and** $100,000 cash
- Sidebar adds a Tools group (Lab, Alerts); navbar bell links to alerts
- README documents the paper broker, lab, alerts, and 3.0 scripts

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
