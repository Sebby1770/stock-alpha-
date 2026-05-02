import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Screener from './pages/Screener';
import Community from './pages/Community';
import Portfolio from './pages/Portfolio';

export default function App() {
  return (
    <BrowserRouter basename="/stock-alpha/">
      <div className="min-h-screen bg-navy-900">
        <Navbar />

        <div className="flex pt-[88px]">
          <Sidebar />

          <main className="flex-1 lg:ml-56 p-4 lg:p-6 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-88px)]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock/:ticker" element={<StockDetail />} />
              <Route path="/screener" element={<Screener />} />
              <Route path="/community" element={<Community />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
