# AlphaRank — Quant Stock Analysis Platform

> Advanced stock prediction & analysis platform with factor-based Quant Ratings, crowdsourced analysis, interactive charts, and an institutional-grade stock screener.

![AlphaRank Screenshot](https://img.shields.io/badge/React-18-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss) ![Recharts](https://img.shields.io/badge/Recharts-2-red)

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
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Routing | React Router v6 |
| Icons | Lucide React |
| Fonts | Inter + JetBrains Mono (Google Fonts) |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/stock-alpha.git
cd stock-alpha

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173/stock-alpha/](http://localhost:5173/stock-alpha/)

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
4. Your app will be live at `https://YOUR_USERNAME.github.io/stock-alpha/`

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
│       └── Sidebar.jsx       # Left nav
├── data/
│   ├── stocks.js             # 25 stocks with full data + seeded price history
│   ├── market.js             # Indices, sectors, news
│   └── community.js          # Community posts + top picks
└── pages/
    ├── Dashboard.jsx         # Main dashboard
    ├── StockDetail.jsx       # Individual stock page (3 tabs)
    ├── Screener.jsx          # Filterable + sortable stock table
    ├── Community.jsx         # Crowdsourced analysis feed
    └── Portfolio.jsx         # Portfolio tracker with equity curve
```

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
