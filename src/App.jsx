import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const StockDetail = lazy(() => import('./pages/StockDetail'));
const Screener = lazy(() => import('./pages/Screener'));
const Community = lazy(() => import('./pages/Community'));
const Portfolio = lazy(() => import('./pages/PortfolioLab'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Compare = lazy(() => import('./pages/Compare'));

function PageFallback() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-500 border-t-brand-blue" />
        Loading research workspace…
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-navy-900">
        <Navbar />

        <div className="flex pt-[88px]">
          <Sidebar />
          <MobileNav />

          <main id="main-content" className="flex-1 lg:ml-56 p-4 pb-24 lg:p-6 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-88px)]">
            <Suspense fallback={<PageFallback />}>
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
            </Suspense>
          </main>
        </div>
      </div>
    </HashRouter>
  );
}
