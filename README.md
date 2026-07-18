# AlphaRank - Synthetic Quant Research Simulator

> Educational stock-research simulator with factor-based model ratings,
> synthetic community analysis, interactive charts, and a configurable local
> portfolio. The app does not connect to live markets or a brokerage.

![AlphaRank Screenshot](https://img.shields.io/badge/React-18-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss) ![Recharts](https://img.shields.io/badge/Recharts-2-red)

---

## Features

### Quant Rating System
- **5-Factor Model**: Value (20%), Growth (25%), Momentum (20%), Profitability (20%), Revisions (15%)
- **A+ to F letter grades** — color-coded with glow effects for top-rated stocks
- **Radar chart** and individual factor bars for deep-dive analysis
- Weighted scores are computed from manually curated synthetic factor inputs

### Stock Screener
- Filter by sector, market cap, minimum quant grade, and score threshold
- Sortable columns across all 14 data points
- Mini sparkline charts inline in the table
- Full 25-stock universe with deterministic synthetic financial data
- Signal-aware summary cards for best match, average upside, and low-risk matches
- CSV export for the currently filtered result set

### Signal Lab
- Ranks every stock by quant score, simulated analyst upside, volatility, drawdown, and synthetic community sentiment
- Persistent browser watchlist with versioned, guarded `localStorage` and visible save-failure warnings
- Clearly labelled historical scenarios for balanced, quant, momentum, and value rankings (not time-causal backtests)
- Sector signal map for comparing average opportunity and risk by sector
- CSV export for the full signal model

### Production Ops
- Readiness cockpit that separates implemented CI/static controls from future cloud designs
- App-wide React render-error boundary with local-only incident retention and recovery
- Data delivery plan covering WebSockets, long polling, short polling, RPC snapshots, SQS workers, and Kafka/RabbitMQ fanout
- Cache and partitioning plan for browser cache, CDN assets, quote API QPS, DynamoDB shards, and dead-letter debugging
- Docker + nginx staging image with health check, SPA fallback, static asset caching, and security headers
- GitHub Actions workflow for install, audit, and production build checks
- Kubernetes starter manifest and production runbook covering S3, CloudFront, SQS, Lambda, Kafka/RabbitMQ, and DynamoDB paths

### Synthetic Community
- Clearly labelled fictional research personas and long-form Buy/Hold/Sell theses
- Simulated price targets, community sentiment, votes, comments, and platform statistics
- Session-local upvote interaction
- Read-only analysis-form preview with no connected submission backend

### Portfolio Tracker
- Add, edit, combine, remove, undo deletions/resets, sort, and export positions
- Guarded browser persistence with validation of restored records
- Current-holdings historical replay, allocation and sector breakdowns, concentration checks, factor exposure, and weighted quant quality
- Ten sample positions are provided only as an editable starting point

### Dashboard
- Persistent simulated-data/as-of disclosure across the app
- Animated snapshot ticker across major indices, BTC, gold, and oil
- Top Quant Rated stocks grid
- Sector YTD performance bar chart
- Momentum leaders leaderboard
- Market news feed

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Routing | React Router v6 |
| Icons | Lucide React |
| Fonts | Inter + JetBrains Mono (Google Fonts) |

---

## Getting Started

Requires Node.js `^20.19.0` or `>=22.12.0` (the repository includes an
`.nvmrc` for Node 22).

```bash
# Clone the repo
git clone https://github.com/Sebby1770/stock-alpha-.git
cd stock-alpha-

# Install exact dependencies
npm ci

# Start dev server
npm run dev
```

Open [http://localhost:5173/stock-alpha-/](http://localhost:5173/stock-alpha-/)

Run all automated checks with `npm run check` (20 unit tests plus the
production build).

---

## Build & Deploy

```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages (requires gh-pages package)
npm run deploy
```

### GitHub Pages Setup

1. Push to GitHub
2. Run `npm run deploy` — this builds and pushes to the `gh-pages` branch
3. In your repo settings → Pages → set source to `gh-pages` branch
4. Your app will be live at `https://sebby1770.github.io/stock-alpha-/`

GitHub Pages builds use hash routes (for example
`/stock-alpha-/#/signals`), so direct navigation and refreshes do not depend on
a server-side SPA fallback.

---

## Project Structure

```
src/
├── App.jsx                   # Router + layout
├── index.css                 # Global styles + Tailwind
├── main.jsx                  # Entry point
├── components/
│   ├── common/
│   │   ├── ErrorBoundary.jsx # Runtime incident capture + recovery screen
│   │   ├── FactorBar.jsx     # Factor score progress bars
│   │   ├── MiniChart.jsx     # Sparkline area chart
│   │   ├── QuantGrade.jsx    # A+→F letter grade badge
│   │   └── StockCard.jsx     # Stock summary card
│   ├── layout/
│   │   ├── Navbar.jsx        # Top nav with search + ticker tape
│   │   └── Sidebar.jsx       # Left nav
│   └── portfolio/
│       └── PositionForm.jsx  # Validated add/edit workflow
├── data/
│   ├── stocks.js             # 25 stocks with full data + seeded price history
│   ├── market.js             # Indices, sectors, news
│   ├── metadata.js           # Simulated snapshot disclosure
│   ├── ops.js                # Production readiness, delivery, cache, and security model
│   └── community.js          # Community posts + top picks
├── utils/
│   ├── analytics.js          # Calibrated signals, risk, upside, and historical scenarios
│   ├── dates.js              # Strict timezone-safe date-only parsing and formatting
│   ├── portfolio.js          # Position validation, mutations, and analytics
│   ├── routing.js            # Host-aware browser/hash router choice
│   └── storage.js            # Versioned browser storage helpers
└── pages/
    ├── Dashboard.jsx         # Main dashboard
    ├── StockDetail.jsx       # Individual stock page (3 tabs)
    ├── Screener.jsx          # Filterable + sortable stock table
    ├── Signals.jsx           # Signal lab, watchlist, and historical scenarios
    ├── Ops.jsx               # Production readiness and deployment cockpit
    ├── Community.jsx         # Clearly labelled synthetic analysis feed
    └── Portfolio.jsx         # Portfolio tracker with equity curve
```

---

## Production Readiness

```bash
# CI-equivalent local checks
npm ci
npm audit --audit-level=high
npm run check

# Docker staging
docker build -t alpharank .
docker run --rm -p 8080:80 alpharank
```

See [`docs/production-runbook.md`](docs/production-runbook.md) for the exact
implemented controls and the separately labelled Kubernetes, S3/CloudFront,
firewall, queue, and database design templates. The repository does not claim
those external services are provisioned.

---

## Quant Rating Methodology

Each stock has five manually curated, synthetic factor inputs (0–5). They are
static demo fixtures representing the concepts below; AlphaRank does not ingest,
normalize, or calculate them from raw P/E, growth, price, margin, or estimate
data. The app computes only the documented weighted composite from those curated
inputs.

| Factor | Weight | Concept represented |
|--------|--------|---------------------|
| **Value** | 20% | P/E, P/S, P/B, EV/EBITDA |
| **Growth** | 25% | Revenue growth, EPS growth, FCF growth |
| **Momentum** | 20% | 1M, 3M, 6M price performance |
| **Profitability** | 20% | ROE, Gross Margin, Operating Margin |
| **Revisions** | 15% | EPS estimate revision direction |

The composite score maps to a letter grade (A+ = ≥4.7, A = ≥4.3, … F = <0.5).

---

## Disclaimer

All quotes, ranges, model inputs, headlines, community posts, and histories are
simulated for educational and demonstration purposes, with the UI disclosing a
1 May 2026 snapshot. This is not financial advice and no value reflects a live
market feed.

---

## License

MIT
