# AlphaRank 6.0 — Quant Stock Analysis Platform

**Live site:** [https://sebby1770.github.io/stock-alpha-/](https://sebby1770.github.io/stock-alpha-/)

> Factor-based quant ratings, stock screener **presets**, watchlist, compare mode, crowdsourced analysis, a **paper broker** with rebalance plans, contribution, share snapshots, dividends, as-of marks, stops and realized P&L, a factor **Lab**, **alerts**, a return **correlation matrix**, and **Monte Carlo Simulate** — built as an educational demo with **mock data only**.

![React](https://img.shields.io/badge/React-18-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss) ![Vitest](https://img.shields.io/badge/Vitest-2-6e9f18?logo=vitest)

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
- Named **presets** (save / apply / delete) persisted as `alpharank-screener-presets`
- Sortable columns; **Export CSV** of the filtered set
- Star stocks (watchlist) and toggle compare from each row
- Empty state when filters match nothing

### Watchlist & compare
- Watchlist persisted in `localStorage`
- Per-ticker **notes** persisted as `alpharank-notes`
- Compare **2–3 tickers** side-by-side (radar + bars + metrics table)

### Paper broker
- Cash ledger (default **$100,000**) plus average-up lots; fills at last **mock** price
- Persisted as `alpharank-portfolio` v5 (`cash`, `holdings`, `ledger`, `stops`); v2 arrays and v3/v4 books are migrated in place
- Buy and sell tickets, last-20 fill ledger, **realized** P&L from closed lots, **Export ledger CSV**
- **Copy share link** encodes cash + lots as `?book=`; visiting `/portfolio?book=…` offers **Load snapshot** (does not overwrite until confirmed)
- **Export / Import book** JSON (full v4/v5 book: cash, holdings, ledger, stops)
- **Est. annual income** from mock `dividendYield`; yield on cost vs entry
- **Value as of** date marks lots from `priceHistory` (cash ledger unchanged)
- Stop-loss / take-profit per holding; **Check stops** sells the full lot at last mock price
- Factor attribution: value-weighted holdings vs equal-weight universe
- **P&L contribution** table (weight and share of unrealized P&L)
- **Rebalance** card: equal- or score-weight plan among lots (optional top N); **Apply plan** submits sells then buys — never auto-executes
- Risk strip: max drawdown, Sharpe (from the mock curve), HHI concentration
- Reset restores sample lots **and** $100,000 cash

### Lab (`/lab`)
- Factor backtest: **Momentum lookback**, Value, Growth, Profitability, Revisions, or Composite
- Momentum ranks by trailing lookback return; other factors rank by static mock scores (still vs B&H)
- Dual chart vs equal-weight buy-and-hold of the mock universe
- Simulated histories only — not live markets

### Alerts (`/alerts`)
- Price above / below and grade-at-least rules, persisted as `alpharank-alerts`
- Evaluated against current mock quotes and grades; sidebar badge = enabled count

### Correlation matrix (`/matrix`)
- Pearson pairwise on daily returns from aligned mock price histories
- Heatmap table, values in **−1…+1**

### Simulate (`/simulate`)
- Bootstrap Monte Carlo on equal-weight mock universe daily returns
- Fan chart of p5–p95 with median path; educational only — not a forecast

### UX
- Navbar search → stock detail; press **`/`** to focus search
- **Command palette** — `⌘K` / `Ctrl+K`; Enter navigates, Esc closes
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
npm test         # Vitest (quant, broker, risk, backtest, stops, correlation, attribution, share, dividends, as-of, presets, rebalance, montecarlo, contribution)
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
│   ├── broker.js           # Paper buy/sell, realized P&L, CSV, v5 migrate, parseBookJson
│   ├── broker.test.js
│   ├── share.js            # Compact ?book= encode/decode
│   ├── share.test.js
│   ├── dividends.js        # annualIncome, yieldOnCost
│   ├── dividends.test.js
│   ├── asof.js             # Historical MTM from priceHistory
│   ├── asof.test.js
│   ├── stops.js            # Stop-loss / take-profit evaluator
│   ├── stops.test.js
│   ├── risk.js             # Drawdown, vol, Sharpe, HHI, returns
│   ├── risk.test.js
│   ├── backtest.js         # Momentum + static-factor vs equal-weight B&H
│   ├── backtest.test.js
│   ├── correlation.js      # Daily returns + Pearson matrix
│   ├── correlation.test.js
│   ├── attribution.js      # Value-weighted factors vs universe
│   ├── attribution.test.js
│   ├── presets.js          # Screener preset encode/load/save
│   ├── presets.test.js
│   ├── rebalance.js        # Equal / score-weight rebalance plan
│   ├── rebalance.test.js
│   ├── montecarlo.js       # Bootstrap path simulation
│   ├── montecarlo.test.js
│   ├── contribution.js     # Holding P&L contribution
│   ├── contribution.test.js
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
│   └── layout/             # Navbar, Sidebar, CommandPalette
└── pages/
    ├── Dashboard.jsx
    ├── StockDetail.jsx
    ├── Screener.jsx
    ├── Watchlist.jsx
    ├── Compare.jsx
    ├── Community.jsx
    ├── Portfolio.jsx
    ├── Lab.jsx
    ├── Alerts.jsx
    ├── Matrix.jsx
    └── Simulate.jsx
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
4. `npm run build` (`VITE_BASE=/stock-alpha-/`)

On **push to `main`**, a `pages` job deploys `dist/` to the `gh-pages` branch (`peaceiris/actions-gh-pages@v4`). Live site: [https://sebby1770.github.io/stock-alpha-/](https://sebby1770.github.io/stock-alpha-/).

---

## License

MIT — see [LICENSE](LICENSE).
