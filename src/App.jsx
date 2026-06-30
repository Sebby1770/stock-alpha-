import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const StockDetail = lazy(() => import('./pages/StockDetail'));
const Screener = lazy(() => import('./pages/Screener'));
const Community = lazy(() => import('./pages/Community'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Signals = lazy(() => import('./pages/Signals'));

const basename = import.meta.env.BASE_URL === '/'
  ? undefined
  : import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <BrowserRouter
      basename={basename}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <div className="min-h-screen bg-navy-900">
        <Navbar />

        <div className="flex pt-[88px]">
          <Sidebar />

          <main className="flex-1 lg:ml-56 p-4 lg:p-6 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-88px)]">
            <Suspense fallback={<div className="card p-6 text-sm text-slate-400">Loading research workspace...</div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/stock/:ticker" element={<StockDetail />} />
                <Route path="/screener" element={<Screener />} />
                <Route path="/community" element={<Community />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/signals" element={<Signals />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
