# AlphaRank - Quant Stock Analysis Platform

> Advanced stock prediction & analysis platform with factor-based Quant Ratings, crowdsourced analysis, interactive charts, and an institutional-grade stock screener.

![AlphaRank Screenshot](https://img.shields.io/badge/React-18-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss) ![Recharts](https://img.shields.io/badge/Recharts-2-red)

---

## Features

### Quant Rating System
- **5-Factor Model**: Value (20%), Growth (25%), Momentum (20%), Profitability (20%), Revisions (15%)
- **A+ to F letter grades** — color-coded with glow effects for top-rated stocks
- **Radar chart** and individual factor bars for deep-dive analysis
- Scores are computed from real financial multiples and growth metrics

### Stock Screener
- Filter by sector, market cap, minimum quant grade, and score threshold
- Sortable columns across all 14 data points
- Mini sparkline charts inline in the table
- Full 25-stock universe with realistic financial data
- Signal-aware summary cards for best match, average upside, and low-risk matches
- CSV export for the currently filtered result set

### Signal Lab
- Ranks every stock by quant score, analyst upside, volatility, drawdown, and community sentiment
- Persistent browser watchlist with versioned, guarded `localStorage`
- Strategy backtests for balanced signal, pure quant, momentum, and value approaches
- Sector signal map for comparing average opportunity and risk by sector
- CSV export for the full signal model

### Production Ops
- Readiness cockpit for CI/CD, Docker staging, cloud hosting, caching, WAF/rate limiting, and observability
- Runtime error boundary with local incident logging for frontend failure recovery
- Data delivery plan covering WebSockets, long polling, short polling, RPC snapshots, SQS workers, and Kafka/RabbitMQ fanout
- Cache and partitioning plan for browser cache, CDN assets, quote API QPS, DynamoDB shards, and dead-letter debugging
- Docker + nginx staging image with health check, SPA fallback, static asset caching, and security headers
- GitHub Actions workflow for install, audit, and production build checks
- Kubernetes starter manifest and production runbook covering S3, CloudFront, SQS, Lambda, Kafka/RabbitMQ, and DynamoDB paths

### Crowdsourced Community
- Long-form investment thesis posts with Buy/Hold/Sell ratings
- Price targets and community sentiment aggregation
- Upvote system and comment counts
- Submit new analysis form

### Portfolio Tracker
- 10 pre-loaded positions with realistic entry prices
- 90-day equity curve chart
- Allocation pie chart
- Per-holding factor scores, quant grades, and P&L

### Dashboard
- Live-ticking market indices (S&P 500, NASDAQ, Dow, etc.) with animated updates
- Scrolling ticker tape across all major indices + BTC, gold, oil
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

```bash
# Clone the repo
git clone https://github.com/Sebby1770/stock-alpha-.git
cd stock-alpha-

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173/stock-alpha-/](http://localhost:5173/stock-alpha-/)

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
│   └── layout/
│       ├── Navbar.jsx        # Top nav with search + ticker tape
│       └── Sidebar.jsx       # Left nav
├── data/
│   ├── stocks.js             # 25 stocks with full data + seeded price history
│   ├── market.js             # Indices, sectors, news
│   ├── ops.js                # Production readiness, delivery, cache, and security model
│   └── community.js          # Community posts + top picks
├── utils/
│   ├── analytics.js          # Signal scoring, risk, upside, and backtest helpers
│   └── storage.js            # Versioned browser storage helpers
└── pages/
    ├── Dashboard.jsx         # Main dashboard
    ├── StockDetail.jsx       # Individual stock page (3 tabs)
    ├── Screener.jsx          # Filterable + sortable stock table
    ├── Signals.jsx           # Signal lab, watchlist, and strategy backtests
    ├── Ops.jsx               # Production readiness and deployment cockpit
    ├── Community.jsx         # Crowdsourced analysis feed
    └── Portfolio.jsx         # Portfolio tracker with equity curve
```

---

## Production Readiness

```bash
# CI-equivalent local checks
npm ci
npm audit --audit-level=high
npm run build

# Docker staging
docker build -t alpharank .
docker run --rm -p 8080:80 alpharank
```

See [`docs/production-runbook.md`](docs/production-runbook.md) for Docker, Kubernetes, S3/CloudFront, caching, firewall/rate-limit, WebSockets, long/short polling, SQS/Lambda, Kafka/RabbitMQ, and DynamoDB notes.

---

## Quant Rating Methodology

Each stock receives five factor scores (0–5):

| Factor | Weight | Inputs |
|--------|--------|--------|
| **Value** | 20% | P/E, P/S, P/B, EV/EBITDA |
| **Growth** | 25% | Revenue growth, EPS growth, FCF growth |
| **Momentum** | 20% | 1M, 3M, 6M price performance |
| **Profitability** | 20% | ROE, Gross Margin, Operating Margin |
| **Revisions** | 15% | EPS estimate revision direction |

The composite score maps to a letter grade (A+ = ≥4.7, A = ≥4.3, … F = <0.5).

---

## Disclaimer

All data is simulated for educational and demonstration purposes. This is not financial advice. Price histories are generated algorithmically and do not reflect real market prices.

---

## License

MIT
