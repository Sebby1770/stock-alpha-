# AlphaRank 3.0 — Quant Stock Analysis Platform

> Factor-based quant ratings, stock screener, watchlist, compare mode, crowdsourced analysis, a **paper broker**, momentum **Lab**, and **alerts** — built as an educational demo with **mock data only**.

![React](https://img.shields.io/badge/React-18-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss) ![Vitest](https://img.shields.io/badge/Vitest-2-6e9f18?logo=vitest)

**Live (GitHub Pages):** `https://sebby1770.github.io/stock-alpha-/`

---

## ⚠️ Disclaimer

**All market data, prices, news, and factor scores are simulated for educational and demonstration purposes.** This is **not financial advice**. Price histories are generated with a seeded RNG and do not reflect real markets. Do not trade based on this UI.

---

## Features

### Quant rating system
- **5-factor model**: Value (20%), Growth (25%), Momentum (20%), Profitability (20%), Revisions (15%)
- Pure engine in [`src/lib/quant.js`](src/lib/quant.js) — unit-tested with Vitest
- Letter grades **A+ → F** with tooltips explaining weights and thresholds
- Radar charts and factor bars on detail / compare pages

### Screener
- Filter by sector, market cap, min grade, min score, and text search
- Sortable columns; **Export CSV** of the filtered set
- Star stocks (watchlist) and toggle compare from each row
- Empty state when filters match nothing

### Watchlist & compare
- Watchlist persisted in `localStorage`
- Compare **2–3 tickers** side-by-side (radar + bars + metrics table)

### Paper broker
- Cash ledger (default **$100,000**) plus average-up lots; fills at last **mock** price
- Persisted as `alpharank-portfolio` v3 (`cash`, `holdings`, `ledger`); old holdings arrays are migrated in place
- Buy and sell tickets, last-20 fill ledger, equity curve, allocation pie
- Risk strip: max drawdown, Sharpe (from the mock curve), HHI concentration
- Reset restores sample lots **and** $100,000 cash

### Lab (`/lab`)
- Momentum factor backtest: trailing lookback rank → top-N equal-weight, rebalanced on a schedule
- Dual chart vs equal-weight buy-and-hold of the mock universe
- Simulated histories only — not live markets

### Alerts (`/alerts`)
- Price above / below and grade-at-least rules, persisted as `alpharank-alerts`
- Evaluated against current mock quotes and grades; sidebar badge = enabled count

### UX
- Navbar search → stock detail; press **`/`** to focus search
- Dark / light theme toggle
- Focus rings, skip link, and ARIA labels for accessibility

---

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 18 |
| Build | Vite 5 |
| Style | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Routing | React Router v6 |
| Tests | Vitest 2 |
| Icons | Lucide React |

---

## Scripts

```bash
npm install
npm run dev      # Vite dev server
npm test         # Vitest (quant, broker, risk, backtest)
npm run test:watch
npm run build    # Production build (uses VITE_BASE)
npm run preview  # Preview dist/
npm run lint     # Placeholder (passes)
npm run deploy   # build + gh-pages
```

Open dev at: [http://localhost:5173/stock-alpha-/](http://localhost:5173/stock-alpha-/)

### Base path (GitHub Pages)

Default Vite base is `/stock-alpha-/` (matches repo `Sebby1770/stock-alpha-`).

```bash
# Root deploy / local without subpath
VITE_BASE=/ npm run build

# Custom subpath
VITE_BASE=/my-path/ npm run build
```

The React Router basename is derived from `import.meta.env.BASE_URL`.

---

## Project structure

```
src/
├── App.jsx                 # Providers + router (basename from Vite base)
├── main.jsx
├── index.css               # Tailwind + light/dark theme hooks
├── lib/
│   ├── quant.js            # Pure scoring, grade, filter, sort, CSV
│   ├── quant.test.js
│   ├── broker.js           # Paper buy/sell, marks, v3 migrate
│   ├── broker.test.js
│   ├── risk.js             # Drawdown, vol, Sharpe, HHI, returns
│   ├── risk.test.js
│   ├── backtest.js         # Momentum vs equal-weight B&H
│   ├── backtest.test.js
│   ├── storage.js          # localStorage helpers
│   └── format.js           # Display formatters
├── context/
│   ├── ThemeContext.jsx
│   ├── WatchlistContext.jsx
│   ├── CompareContext.jsx
│   ├── PortfolioContext.jsx
│   └── AlertsContext.jsx
├── data/
│   ├── stocks.js           # Mock universe + seeded price history
│   ├── market.js
│   └── community.js
├── components/
│   ├── common/             # StockCard, QuantGrade, FactorBar, …
│   └── layout/             # Navbar, Sidebar
└── pages/
    ├── Dashboard.jsx
    ├── StockDetail.jsx
    ├── Screener.jsx
    ├── Watchlist.jsx
    ├── Compare.jsx
    ├── Community.jsx
    ├── Portfolio.jsx
    ├── Lab.jsx
    └── Alerts.jsx
```

---

## Quant methodology

| Factor | Weight | Inputs (conceptual) |
|--------|--------|---------------------|
| **Value** | 20% | P/E, P/S, P/B, EV/EBITDA |
| **Growth** | 25% | Revenue / EPS growth |
| **Momentum** | 20% | Price trend windows |
| **Profitability** | 20% | ROE, margins |
| **Revisions** | 15% | Estimate revision direction |

Composite score maps to letter grades (A+ ≥ 4.7, A ≥ 4.3, …, F &lt; 0.5). See `GRADE_THRESHOLDS` in `src/lib/quant.js`.

In this demo, factor scores are authored on each mock stock; the engine only aggregates and grades them.

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR:

1. `npm ci`
2. `npm test`
3. `npm run lint`
4. `npm run build`

---

## License

MIT — see [LICENSE](LICENSE).
