import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Screener from './pages/Screener';
import Community from './pages/Community';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Compare from './pages/Compare';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { CompareProvider } from './context/CompareContext';
import { PortfolioProvider } from './context/PortfolioContext';

/** Vite base path, e.g. `/stock-alpha/` — trailing slash stripped for react-router basename */
const BASENAME = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

export default function App() {
  return (
    <ThemeProvider>
      <WatchlistProvider>
        <CompareProvider>
          <PortfolioProvider>
            <BrowserRouter basename={BASENAME === '/' ? undefined : BASENAME}>
              <div className="min-h-screen bg-navy-900 text-slate-100 transition-colors duration-200">
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-blue focus:text-white focus:rounded-lg"
                >
                  Skip to content
                </a>
                <Navbar />

                <div className="flex pt-[88px]">
                  <Sidebar />

                  <main
                    id="main-content"
                    className="flex-1 lg:ml-56 p-4 lg:p-6 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-88px)]"
                  >
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/stock/:ticker" element={<StockDetail />} />
                      <Route path="/screener" element={<Screener />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/portfolio" element={<Portfolio />} />
                      <Route path="/watchlist" element={<Watchlist />} />
                      <Route path="/compare" element={<Compare />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </BrowserRouter>
          </PortfolioProvider>
        </CompareProvider>
      </WatchlistProvider>
    </ThemeProvider>
  );
}
