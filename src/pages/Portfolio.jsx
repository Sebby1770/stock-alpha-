import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, TrendingDown, Plus, PieChart, DollarSign } from 'lucide-react';
import { stocks } from '../data/stocks';
import QuantGrade from '../components/common/QuantGrade';
import MiniChart from '../components/common/MiniChart';
import { FactorBar } from '../components/common/FactorBar';
import clsx from 'clsx';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart as RPieChart, Pie, Cell, Legend,
} from 'recharts';

const fmtBig = (n) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Sample portfolio holdings (entry prices before current price run-up)
const HOLDINGS_RAW = [
  { ticker: 'NVDA', shares: 50,  entryPrice: 620.00 },
  { ticker: 'MSFT', shares: 120, entryPrice: 385.00 },
  { ticker: 'META', shares: 80,  entryPrice: 470.00 },
  { ticker: 'AAPL', shares: 200, entryPrice: 172.00 },
  { ticker: 'AVGO', shares: 100, entryPrice: 135.00 },
  { ticker: 'LLY',  shares: 30,  entryPrice: 750.00 },
  { ticker: 'GOOGL', shares: 150, entryPrice: 145.00 },
  { ticker: 'V',    shares: 80,  entryPrice: 250.00 },
  { ticker: 'JPM',  shares: 100, entryPrice: 185.00 },
  { ticker: 'COST', shares: 25,  entryPrice: 820.00 },
];

// Build portfolio data from live stock prices
const buildHoldings = () =>
  HOLDINGS_RAW.map((h) => {
    const stock = stocks.find((s) => s.ticker === h.ticker);
    if (!stock) return null;
    const currentVal = stock.price * h.shares;
    const costBasis = h.entryPrice * h.shares;
    const gain = currentVal - costBasis;
    const gainPct = ((gain / costBasis) * 100);
    return { ...h, stock, currentVal, costBasis, gain, gainPct };
  }).filter(Boolean);

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#ec4899', '#84cc16'];

// Generate a simple portfolio equity curve (90-day)
const buildEquityCurve = (holdings) => {
  if (!holdings.length) return [];
  const days = holdings[0].stock.priceHistory.length;
  return holdings[0].stock.priceHistory.map((_, i) => {
    const total = holdings.reduce((sum, h) => {
      const pt = h.stock.priceHistory[i];
      return sum + (pt ? pt.price * h.shares : 0);
    }, 0);
    return { date: holdings[0].stock.priceHistory[i].date, value: Math.round(total * 100) / 100 };
  });
};

export default function Portfolio() {
  const navigate = useNavigate();
  const holdings = buildHoldings();
  const [sortKey, setSortKey] = useState('currentVal');
  const [sortDir, setSortDir] = useState('desc');

  const totalValue = holdings.reduce((s, h) => s + h.currentVal, 0);
  const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = ((totalGain / totalCost) * 100);
  const dailyPnL = holdings.reduce((s, h) => s + h.stock.change * h.shares, 0);
  const equityCurve = buildEquityCurve(holdings);

  const sorted = [...holdings].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const pieData = holdings
    .sort((a, b) => b.currentVal - a.currentVal)
    .map((h) => ({ name: h.ticker, value: Math.round((h.currentVal / totalValue) * 100) }));

  // Avg quant score
  const avgQuant = holdings.reduce((s, h) => s + h.stock.quantScore, 0) / holdings.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Briefcase size={22} className="text-brand-purple" />
            My Portfolio
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track performance, quant ratings, and factor exposure</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Add Position
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 glow-card">
          <div className="text-xs text-slate-400 mb-1">Total Value</div>
          <div className="text-2xl font-extrabold font-mono text-slate-100">{fmtBig(totalValue)}</div>
          <div className={clsx('text-xs mt-1', totalGain >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {totalGain >= 0 ? '+' : ''}{fmtBig(totalGain)} all-time
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-400 mb-1">Total Return</div>
          <div className={clsx('text-2xl font-extrabold font-mono', totalGainPct >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">vs. cost basis {fmtBig(totalCost)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-400 mb-1">Today's P&L</div>
          <div className={clsx('text-2xl font-extrabold font-mono', dailyPnL >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {dailyPnL >= 0 ? '+' : ''}{fmtBig(dailyPnL)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{holdings.length} positions</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-400 mb-1">Avg Quant Score</div>
          <div className="text-2xl font-extrabold font-mono text-brand-blue">{avgQuant.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">Portfolio quality score</div>
        </div>
      </div>

      {/* Equity curve + Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Equity curve */}
        <div className="xl:col-span-2 card p-5">
          <h2 className="section-title mb-4">
            <TrendingUp size={16} className="text-brand-green" /> Portfolio Performance (90D)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={equityCurve} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.5)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(s) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                axisLine={false} tickLine={false} interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                axisLine={false} tickLine={false} width={55} domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(v) => [fmtBig(v), 'Portfolio']}
                labelFormatter={(s) => new Date(s).toLocaleDateString()}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2}
                fill="url(#portGrad)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation pie */}
        <div className="card p-5">
          <h2 className="section-title mb-4">
            <PieChart size={16} className="text-brand-purple" /> Allocation
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <RPieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" paddingAngle={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 6 }} />
            </RPieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {pieData.slice(0, 6).map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-slate-400">{d.name}</span>
                <span className="text-slate-300 ml-auto font-mono">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-navy-700">
          <h2 className="section-title">
            <DollarSign size={16} className="text-brand-blue" /> Holdings
          </h2>
          <span className="text-xs text-slate-500">{holdings.length} positions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                <th className="text-left px-5 py-3 font-medium">Stock</th>
                <th className="text-right px-3 py-3 font-medium">Shares</th>
                <th className="text-right px-3 py-3 font-medium">Entry</th>
                <th className="text-right px-3 py-3 font-medium">Current</th>
                <th className="text-right px-3 py-3 font-medium">Value</th>
                <th className="text-right px-3 py-3 font-medium">Gain/Loss</th>
                <th className="text-right px-3 py-3 font-medium">Return</th>
                <th className="text-center px-3 py-3 font-medium hidden md:table-cell">Rating</th>
                <th className="text-center px-3 py-3 font-medium hidden lg:table-cell">Value</th>
                <th className="text-center px-3 py-3 font-medium hidden lg:table-cell">Growth</th>
                <th className="text-center px-3 py-3 font-medium hidden lg:table-cell">Mom.</th>
                <th className="px-5 py-3 hidden xl:table-cell" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => {
                const pos = h.gain >= 0;
                const dayPos = h.stock.changePercent >= 0;
                return (
                  <tr
                    key={h.ticker}
                    className="table-row text-sm border-b border-navy-700/50"
                    onClick={() => navigate(`/stock/${h.ticker}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue/30 to-brand-purple/20 border border-navy-500 flex items-center justify-center text-xs font-bold text-blue-300">
                          {h.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{h.ticker}</div>
                          <div className={clsx('text-xs', dayPos ? 'text-brand-green' : 'text-brand-red')}>
                            {dayPos ? '+' : ''}{h.stock.changePercent.toFixed(2)}% today
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">{h.shares}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-400">${h.entryPrice.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-200">${h.stock.price.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-100">{fmtBig(h.currentVal)}</td>
                    <td className={clsx('px-3 py-3 text-right font-mono font-semibold', pos ? 'text-brand-green' : 'text-brand-red')}>
                      {pos ? '+' : ''}{fmtBig(h.gain)}
                    </td>
                    <td className={clsx('px-3 py-3 text-right font-mono font-bold', pos ? 'text-brand-green' : 'text-brand-red')}>
                      {pos ? '+' : ''}{h.gainPct.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 text-center hidden md:table-cell">
                      <QuantGrade grade={h.stock.quantGrade} size="sm" />
                    </td>
                    {['value', 'growth', 'momentum'].map((f) => (
                      <td key={f} className="px-3 py-3 hidden lg:table-cell">
                        <div className="w-16">
                          <FactorBar label={f} score={h.stock.factors[f]} showLabel={false} compact />
                        </div>
                      </td>
                    ))}
                    <td className="px-5 py-3 hidden xl:table-cell">
                      <div className="w-16">
                        <MiniChart data={h.stock.priceHistory} positive={dayPos} height={28} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
