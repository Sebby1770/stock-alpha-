# AlphaRank — Quant Stock Analysis Platform

> An interactive, privacy-friendly equity research demo with factor ratings, side-by-side comparisons, a powerful screener, and persistent portfolio analytics.

![AlphaRank Screenshot](https://img.shields.io/badge/React-18-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss) ![Recharts](https://img.shields.io/badge/Recharts-2-red)

---

## Features

### Personal Research Workspace
- Persistent local watchlist with search, sorting, target upside, and one-click comparisons
- Editable model portfolio with weighted entry-price handling
- Allocation, sector exposure, effective-position count, volatility, and drawdown analytics
- Concentration and weighted quant-quality insights

### Stock Comparison
- Compare up to four companies across factors, growth, profitability, valuation, and target upside
- Shareable comparison URLs and best-in-row highlighting
- Multi-company factor radar for a fast visual comparison

### Quant Rating System
- **5-Factor Model**: Value (20%), Growth (25%), Momentum (20%), Profitability (20%), Revisions (15%)
- **A+ to F letter grades** — color-coded with glow effects for top-rated stocks
- **Radar chart** and individual factor bars for deep-dive analysis
- Scores use the documented factor weights across the simulated dataset

### Stock Screener
- Filter by sector, market cap, minimum quant grade, and score threshold
- Sortable columns across all 14 data points
- Mini sparkline charts inline in the table
- CSV export of the currently filtered and sorted result set
- Quick screens for quality, growth, and value
- Keyboard-accessible sorting and watchlist actions

### Crowdsourced Community
- Long-form investment thesis posts with Buy/Hold/Sell ratings
- Price targets and community sentiment aggregation
- Single-toggle upvotes and session-only analysis drafting with validation

### Deterministic Analytics Engine
- Reproducible 252-session price histories anchored to each declared quote
- Defensive validation for persisted browser data
- Date-aligned portfolio curves that tolerate incomplete histories
- Automated tests for scoring, prices, persistence sanitization, and portfolio analytics

### Dashboard
- Illustrative ticking market indices (S&P 500, NASDAQ, Dow, etc.)
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
| Routing | React Router v7 |
| Icons | Lucide React |
| Persistence | Validated browser localStorage |
| Tests | Node.js built-in test runner |
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

Open [http://localhost:5173/stock-alpha-/](http://localhost:5173/stock-alpha-/).
Routes use URL hashes so bookmarked research, portfolio, and comparison pages
also work when served directly from GitHub Pages.

### Verify the project

```bash
npm run check
```

This runs the deterministic model tests followed by a production build.

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
4. The app will be live at `https://sebby1770.github.io/stock-alpha-/`

---

## Project Structure

```
src/
├── App.jsx                   # Router + layout
├── index.css                 # Global styles + Tailwind
├── main.jsx                  # Entry point
├── components/
│   ├── common/
│   │   ├── FactorBar.jsx     # Factor score progress bars
│   │   ├── MiniChart.jsx     # Sparkline area chart
│   │   ├── QuantGrade.jsx    # A+→F letter grade badge
│   │   └── StockCard.jsx     # Stock summary card
│   └── layout/
│       ├── Navbar.jsx        # Top nav with search + ticker tape
│       ├── Sidebar.jsx       # Desktop navigation
│       └── MobileNav.jsx     # Mobile bottom navigation
├── context/
│   └── ResearchContext.jsx   # Validated local watchlist + portfolio state
├── data/
│   ├── stocks.js             # 25 stocks with full data + seeded price history
│   ├── market.js             # Indices, sectors, news
│   └── community.js          # Community posts + top picks
├── lib/
│   └── portfolio.js          # Pure portfolio and risk calculations
└── pages/
    ├── Dashboard.jsx         # Main dashboard
    ├── StockDetail.jsx       # Individual stock page (3 tabs)
    ├── Screener.jsx          # Filterable + sortable stock table
    ├── Community.jsx         # Crowdsourced analysis feed
    ├── PortfolioLab.jsx      # Editable portfolio + risk analytics
    ├── Watchlist.jsx         # Persistent research shortlist
    └── Compare.jsx           # Multi-stock decision scorecard
```

Model coverage lives in `test/model.test.js`.

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

All company, market, price, target, analyst, and community data is simulated for educational and product-demonstration purposes. It is not current market data or financial advice. Price histories are generated deterministically and do not reflect real market prices. Portfolio results exclude cash flows, dividends, fees, taxes, and rebalancing.

---

## License

MIT
