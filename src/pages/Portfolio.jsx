import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, TrendingUp, Plus, PieChart, DollarSign, Trash2, RotateCcw, X,
} from 'lucide-react';
import { stocks } from '../data/stocks';
import { usePortfolio } from '../context/PortfolioContext';
import QuantGrade from '../components/common/QuantGrade';
import MiniChart from '../components/common/MiniChart';
import { FactorBar } from '../components/common/FactorBar';
import EmptyState from '../components/common/EmptyState';
import WatchlistButton from '../components/common/WatchlistButton';
import clsx from 'clsx';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart as RPieChart, Pie, Cell,
} from 'recharts';

const fmtBig = (n) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#ec4899', '#84cc16'];

const buildEquityCurve = (holdings) => {
  if (!holdings.length) return [];
  const days = holdings[0].stock.priceHistory.length;
  return Array.from({ length: days }, (_, i) => {
    const total = holdings.reduce((sum, h) => {
      const pt = h.stock.priceHistory[i];
      return sum + (pt ? pt.price * h.shares : 0);
    }, 0);
    return {
      date: holdings[0].stock.priceHistory[i].date,
      value: Math.round(total * 100) / 100,
    };
  });
};

export default function Portfolio() {
  const navigate = useNavigate();
  const { enriched, addPosition, removePosition, resetToDefault } = usePortfolio();
  const [sortKey] = useState('currentVal');
  const [sortDir] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ticker: '', shares: '', entryPrice: '' });
  const [formError, setFormError] = useState('');

  const holdings = enriched;
  const totalValue = holdings.reduce((s, h) => s + h.currentVal, 0);
  const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost ? (totalGain / totalCost) * 100 : 0;
  const dailyPnL = holdings.reduce((s, h) => s + h.stock.change * h.shares, 0);
  const equityCurve = useMemo(() => buildEquityCurve(holdings), [holdings]);

  const sorted = [...holdings].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const pieData = holdings
    .slice()
    .sort((a, b) => b.currentVal - a.currentVal)
    .map((h) => ({
      name: h.ticker,
      value: totalValue ? Math.round((h.currentVal / totalValue) * 100) : 0,
    }));

  const avgQuant = holdings.length
    ? holdings.reduce((s, h) => s + h.stock.quantScore, 0) / holdings.length
    : 0;

  const submitPosition = (e) => {
    e.preventDefault();
    setFormError('');
    const result = addPosition(form.ticker, form.shares, form.entryPrice || undefined);
    if (!result.ok) {
      setFormError(result.error || 'Could not add position');
      return;
    }
    setForm({ ticker: '', shares: '', entryPrice: '' });
    setShowForm(false);
  };

  const onTickerChange = (ticker) => {
    const stock = stocks.find((s) => s.ticker === ticker.toUpperCase());
    setForm((f) => ({
      ...f,
      ticker,
      entryPrice: stock && !f.entryPrice ? String(stock.price.toFixed(2)) : f.entryPrice,
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Briefcase size={22} className="text-brand-purple" aria-hidden="true" />
            Paper Portfolio
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Local paper trading · positions saved in this browser
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToDefault}
            className="btn-secondary flex items-center gap-2"
            title="Reset to sample holdings"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'Add Position'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submitPosition} className="card p-5 animate-slide-up border-brand-blue/30">
          <h2 className="section-title mb-4">Add paper position</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
            <div>
              <label htmlFor="port-ticker" className="block text-xs text-slate-400 mb-1.5">Ticker</label>
              <select
                id="port-ticker"
                className="select"
                required
                value={form.ticker}
                onChange={(e) => onTickerChange(e.target.value)}
              >
                <option value="">Select…</option>
                {stocks.map((s) => (
                  <option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="port-shares" className="block text-xs text-slate-400 mb-1.5">Shares</label>
              <input
                id="port-shares"
                className="input"
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="e.g. 10"
                value={form.shares}
                onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="port-entry" className="block text-xs text-slate-400 mb-1.5">Entry price</label>
              <input
                id="port-entry"
                className="input"
                type="number"
                min="0.01"
                step="any"
                placeholder="Defaults to last price"
                value={form.entryPrice}
                onChange={(e) => setForm((f) => ({ ...f, entryPrice: e.target.value }))}
              />
            </div>
          </div>
          {formError && <p className="text-sm text-brand-red mb-3" role="alert">{formError}</p>}
          <button type="submit" className="btn-primary">Save position</button>
        </form>
      )}

      {holdings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Briefcase}
            title="No positions yet"
            description="Add a paper trade or reset to the sample portfolio. All data stays in localStorage."
            action={
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(true)} className="btn-primary">Add position</button>
                <button type="button" onClick={resetToDefault} className="btn-secondary">Load sample</button>
              </div>
            }
          />
        </div>
      ) : (
        <>
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
              <div className="text-xs text-slate-400 mb-1">Today&apos;s P&amp;L</div>
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 card p-5">
              <h2 className="section-title mb-4">
                <TrendingUp size={16} className="text-brand-green" aria-hidden="true" /> Portfolio Performance (90D)
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
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(v) => [fmtBig(v), 'Portfolio']}
                    labelFormatter={(s) => new Date(s).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#portGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#10b981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h2 className="section-title mb-4">
                <PieChart size={16} className="text-brand-purple" aria-hidden="true" /> Allocation
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

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-navy-700">
              <h2 className="section-title">
                <DollarSign size={16} className="text-brand-blue" aria-hidden="true" /> Holdings
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
                    <th className="px-5 py-3" />
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
                              <FactorBar label={f} score={h.stock.factors[f]} showLabel={false} compact showTooltip={false} />
                            </div>
                          </td>
                        ))}
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end">
                            <div className="w-14 hidden xl:block">
                              <MiniChart data={h.stock.priceHistory} positive={dayPos} height={28} />
                            </div>
                            <WatchlistButton ticker={h.ticker} size={14} />
                            <button
                              type="button"
                              aria-label={`Remove ${h.ticker} from portfolio`}
                              onClick={() => removePosition(h.ticker)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-brand-red hover:bg-brand-red/10 focus-visible:ring-2 focus-visible:ring-brand-blue/50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
