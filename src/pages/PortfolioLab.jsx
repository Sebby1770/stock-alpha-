import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Edit3,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { stocks } from '../data/stocks';
import { useResearch } from '../context/ResearchContext';
import {
  buildHoldings,
  calculatePortfolioAnalytics,
  MAX_ENTRY_PRICE,
  MAX_SHARES,
  portfolioInsights,
} from '../lib/portfolio';
import QuantGrade from '../components/common/QuantGrade';

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316', '#14b8a6'];

const money = (value, compact = false) => {
  if (!Number.isFinite(value)) return '—';
  if (compact && Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (compact && Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
};

const signedPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

function PositionForm({ initialTicker, editing, onCancel, onSave }) {
  const initialStock = stocks.find((stock) => stock.ticker === initialTicker) || stocks[0];
  const [ticker, setTicker] = useState(initialStock.ticker);
  const [shares, setShares] = useState(editing?.shares?.toString() || '');
  const [entryPrice, setEntryPrice] = useState(editing?.entryPrice?.toString() || initialStock.price.toFixed(2));
  const [error, setError] = useState('');

  const chooseTicker = (nextTicker) => {
    setTicker(nextTicker);
    const stock = stocks.find((item) => item.ticker === nextTicker);
    if (!editing && stock) setEntryPrice(stock.price.toFixed(2));
  };

  const submit = (event) => {
    event.preventDefault();
    const numericShares = Number(shares);
    const numericEntry = Number(entryPrice);
    if (!Number.isFinite(numericShares) || numericShares <= 0 || numericShares > MAX_SHARES) {
      setError('Shares must be greater than zero and no more than 1 billion.');
      return;
    }
    if (!Number.isFinite(numericEntry) || numericEntry <= 0 || numericEntry > MAX_ENTRY_PRICE) {
      setError('Average entry price must be greater than zero and no more than $1 billion.');
      return;
    }
    onSave({ ticker, shares: numericShares, entryPrice: numericEntry });
  };

  return (
    <form onSubmit={submit} className="card border-brand-blue/30 p-5 animate-slide-up" aria-label={editing ? `Edit ${editing.ticker} position` : 'Add portfolio position'}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">{editing ? `Edit ${editing.ticker}` : 'Add a position'}</h2>
          <p className="mt-1 text-xs text-slate-400">Positions are stored locally on this device. Adding an existing ticker updates its weighted entry price.</p>
        </div>
        <button type="button" className="icon-button text-slate-500" onClick={onCancel} aria-label="Close position form"><X size={17} /></button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="text-xs font-medium text-slate-400">
          Company
          <select className="select mt-1.5" value={ticker} disabled={Boolean(editing)} onChange={(event) => chooseTicker(event.target.value)}>
            {stocks.map((stock) => <option key={stock.ticker} value={stock.ticker}>{stock.ticker} — {stock.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-400">
          Shares
          <input className="input mt-1.5" inputMode="decimal" type="number" min="0.0001" max={MAX_SHARES} step="any" value={shares} onChange={(event) => setShares(event.target.value)} placeholder="e.g. 12.5" autoFocus />
        </label>
        <label className="text-xs font-medium text-slate-400">
          Average entry price (USD)
          <input className="input mt-1.5" inputMode="decimal" type="number" min="0.01" max={MAX_ENTRY_PRICE} step="any" value={entryPrice} onChange={(event) => setEntryPrice(event.target.value)} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">{editing ? 'Save changes' : 'Add position'}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        {error && <span role="alert" className="text-xs font-medium text-red-300">{error}</span>}
      </div>
    </form>
  );
}

export default function PortfolioLab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTicker = searchParams.get('add')?.toUpperCase();
  const { positions, addPosition, updatePosition, removePosition, resetPortfolio } = useResearch();
  const [showForm, setShowForm] = useState(Boolean(requestedTicker));
  const [editingTicker, setEditingTicker] = useState(null);
  const [sortKey, setSortKey] = useState('currentValue');

  const holdings = useMemo(() => buildHoldings(positions, stocks), [positions]);
  const analytics = useMemo(() => calculatePortfolioAnalytics(holdings), [holdings]);
  const insights = useMemo(() => portfolioInsights(analytics), [analytics]);
  const editing = positions.find((position) => position.ticker === editingTicker);
  const sortedHoldings = [...holdings].sort((a, b) => {
    if (sortKey === 'ticker') return a.ticker.localeCompare(b.ticker);
    return (b[sortKey] ?? b.stock[sortKey] ?? 0) - (a[sortKey] ?? a.stock[sortKey] ?? 0);
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingTicker(null);
    if (requestedTicker) setSearchParams({}, { replace: true });
  };

  const savePosition = (position) => {
    if (editing) updatePosition(editing.ticker, position);
    else addPosition(position);
    closeForm();
  };

  const openEdit = (ticker) => {
    setEditingTicker(ticker);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow"><Briefcase size={13} /> Personal research</div>
          <h1 className="page-title">Portfolio lab</h1>
          <p className="page-subtitle">Model positions, inspect concentration, and connect portfolio-level risk back to quant quality.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => {
              if (window.confirm('Restore the sample portfolio? Your watchlist will not change.')) {
                resetPortfolio();
                closeForm();
              }
            }}
            title="Restore the sample portfolio"
          ><RotateCcw size={14} /> Restore demo</button>
          <button className="btn-primary flex items-center gap-2" onClick={() => { setEditingTicker(null); setShowForm(true); }}>
            <Plus size={14} /> Add position
          </button>
        </div>
      </header>

      {showForm && (
        <PositionForm
          key={editing?.ticker || requestedTicker || 'new'}
          initialTicker={editing?.ticker || requestedTicker}
          editing={editing}
          onCancel={closeForm}
          onSave={savePosition}
        />
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="metric-card glow-card">
          <span className="metric-label">Portfolio value</span>
          <strong className="metric-value">{money(analytics.totalValue, true)}</strong>
          <span className={clsx('metric-note', analytics.dailyPnL >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {analytics.dailyPnL >= 0 ? '+' : ''}{money(analytics.dailyPnL, true)} today ({signedPercent(analytics.dailyPnLPercent)})
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total return</span>
          <strong className={clsx('metric-value', analytics.totalGain >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {signedPercent(analytics.totalGainPercent)}
          </strong>
          <span className="metric-note">{analytics.totalGain >= 0 ? '+' : ''}{money(analytics.totalGain, true)} on {money(analytics.totalCost, true)} cost</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Weighted quant score</span>
          <strong className="metric-value text-brand-blue">{analytics.weightedQuantScore.toFixed(2)}</strong>
          <span className="metric-note">value-weighted · out of 5.00</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Effective positions</span>
          <strong className="metric-value text-brand-purple">{analytics.effectivePositions.toFixed(1)}</strong>
          <span className="metric-note">across {holdings.length} actual holdings</span>
        </div>
      </div>

      {holdings.length ? (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_.8fr]">
            <section className="card p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="section-title"><TrendingUp size={16} className="text-brand-green" /> Portfolio performance</h2>
                  <p className="mt-1 text-xs text-slate-400">Modelled from the current share count across one year of deterministic prices.</p>
                </div>
                <span className="badge bg-navy-600 text-slate-400">1Y</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analytics.equityCurve} margin={{ top: 5, right: 8, bottom: 0, left: 2 }}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,.45)" />
                  <XAxis dataKey="date" minTickGap={50} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(date) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short' })} axisLine={false} tickLine={false} />
                  <YAxis width={58} domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => money(value, true)} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [money(value), 'Portfolio']} labelFormatter={(date) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'medium' })} contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#portfolioGradient)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </section>

            <section className="card p-5">
              <h2 className="section-title"><ShieldCheck size={16} className="text-brand-purple" /> Risk snapshot</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-navy-700 p-3">
                  <div className="text-[11px] text-slate-300">Annualized volatility</div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-200">{analytics.annualizedVolatility.toFixed(1)}%</div>
                </div>
                <div className="rounded-lg bg-navy-700 p-3">
                  <div className="text-[11px] text-slate-300">Max model drawdown</div>
                  <div className="mt-1 font-mono text-lg font-bold text-red-400">{analytics.maxDrawdown.toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {insights.map((insight) => (
                  <div key={insight.text} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                    {insight.level === 'positive'
                      ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-green" />
                      : <AlertTriangle size={14} className="mt-0.5 shrink-0 text-brand-yellow" />}
                    {insight.text}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="section-title mb-3">Position allocation</h2>
              <div className="grid grid-cols-[150px_1fr] items-center gap-3">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie aria-label="Portfolio position allocation" data={analytics.allocations} dataKey="weight" nameKey="ticker" innerRadius={45} outerRadius={72} paddingAngle={2}>
                      {analytics.allocations.map((holding, index) => <Cell key={holding.ticker} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Weight']} contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analytics.allocations.slice(0, 7).map((holding, index) => (
                    <div key={holding.ticker} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="font-semibold text-slate-300">{holding.ticker}</span>
                      <span className="ml-auto font-mono text-slate-400">{holding.weight.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="card p-5">
              <h2 className="section-title mb-4">Sector exposure</h2>
              <div className="space-y-3">
                {analytics.sectors.map((sector) => (
                  <div key={sector.name}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{sector.name}</span>
                      <span className="font-mono font-semibold text-slate-300">{sector.weight.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-navy-600"><div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-purple" style={{ width: `${sector.weight}%` }} /></div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-navy-700 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="section-title">Holdings</h2>
                <p className="mt-1 text-xs text-slate-400">{holdings.length} positions · open any company for detailed research</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400">Sort by
                <select className="select h-9 w-auto" value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
                  <option value="currentValue">Position value</option>
                  <option value="gainPercent">Total return</option>
                  <option value="dayChange">Daily P&amp;L</option>
                  <option value="quantScore">Quant score</option>
                  <option value="ticker">Ticker</option>
                </select>
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-navy-700 bg-navy-850 text-xs text-slate-400">
                  <th className="px-5 py-3 text-left font-medium">Company</th>
                  <th className="px-3 py-3 text-right font-medium">Shares</th>
                  <th className="px-3 py-3 text-right font-medium">Entry</th>
                  <th className="px-3 py-3 text-right font-medium">Price</th>
                  <th className="px-3 py-3 text-right font-medium">Value</th>
                  <th className="px-3 py-3 text-right font-medium">Total return</th>
                  <th className="px-3 py-3 text-center font-medium">Quant</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>
                  {sortedHoldings.map((holding) => (
                    <tr key={holding.ticker} className="table-row">
                      <td className="px-5 py-3"><Link className="flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue" to={`/stock/${holding.ticker}`}><div className="stock-mark h-9 w-9">{holding.ticker.slice(0, 2)}</div><div><div className="font-bold text-slate-200 hover:text-blue-300">{holding.ticker}</div><div className="max-w-[180px] truncate text-xs text-slate-400">{holding.stock.name}</div></div></Link></td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">{holding.shares.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-mono text-slate-400">{money(holding.entryPrice)}</td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">{money(holding.stock.price)}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-100">{money(holding.currentValue, true)}</td>
                      <td className={clsx('px-3 py-3 text-right font-mono font-bold', holding.gain >= 0 ? 'text-brand-green' : 'text-brand-red')}><div>{signedPercent(holding.gainPercent)}</div><div className="text-[10px] font-normal opacity-80">{holding.gain >= 0 ? '+' : ''}{money(holding.gain, true)}</div></td>
                      <td className="px-3 py-3 text-center"><QuantGrade grade={holding.stock.quantGrade} size="sm" /></td>
                      <td className="px-5 py-3"><div className="flex justify-end gap-1">
                        <button className="icon-button text-slate-500 hover:text-brand-blue" aria-label={`Edit ${holding.ticker} position`} onClick={(event) => { event.stopPropagation(); openEdit(holding.ticker); }}><Edit3 size={15} /></button>
                        <button className="icon-button text-slate-500 hover:text-brand-red" aria-label={`Delete ${holding.ticker} position`} onClick={(event) => { event.stopPropagation(); removePosition(holding.ticker); }}><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="empty-state">
          <Briefcase size={34} />
          <h2>Build your model portfolio</h2>
          <p>Add a position and entry price to calculate performance, factor quality, volatility, drawdown, and concentration.</p>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}><Plus size={14} /> Add first position</button>
        </div>
      )}

      <div className="data-notice">
        Portfolio analytics use simulated historical prices and current share counts. They exclude cash flows, dividends, fees, taxes, and rebalancing, and are for product demonstration only.
      </div>
    </div>
  );
}
