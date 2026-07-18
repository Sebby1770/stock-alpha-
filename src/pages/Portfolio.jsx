import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpDown,
  Briefcase,
  DollarSign,
  Download,
  Edit3,
  PieChart,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Undo2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import clsx from 'clsx';
import PositionForm from '../components/portfolio/PositionForm';
import QuantGrade from '../components/common/QuantGrade';
import MiniChart from '../components/common/MiniChart';
import { FactorBar, FactorScores } from '../components/common/FactorBar';
import { stocks } from '../data/stocks';
import {
  DEFAULT_POSITIONS,
  addPosition,
  buildAllocation,
  buildEquityCurve,
  buildPortfolioHoldings,
  getPortfolioSummary,
  removePosition,
  sanitizePositions,
  updatePosition,
} from '../utils/portfolio';
import { readJson, storageKey, writeJson } from '../utils/storage';
import { formatDateOnly } from '../utils/dates';

const PORTFOLIO_KEY = storageKey('portfolio', 'v1');
const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#ec4899', '#84cc16'];
const TICKERS = stocks.map((stock) => stock.ticker);

const fmtMoney = (value) => {
  const absolute = Math.abs(value);
  const formatted = absolute >= 1e6
    ? `$${(absolute / 1e6).toFixed(2)}M`
    : absolute.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return value < 0 ? `-${formatted}` : formatted;
};

const fmtShares = (value) => value.toLocaleString('en-US', { maximumFractionDigits: 4 });

const downloadCsv = (holdings) => {
  const rows = [
    ['Ticker', 'Shares', 'Average Entry', 'Current Price', 'Market Value', 'Gain/Loss', 'Return %', 'Quant Grade'],
    ...holdings.map((holding) => [
      holding.ticker,
      holding.shares,
      holding.entryPrice.toFixed(2),
      holding.stock.price.toFixed(2),
      holding.currentVal.toFixed(2),
      holding.gain.toFixed(2),
      holding.gainPct.toFixed(2),
      holding.stock.quantGrade,
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'alpharank-portfolio.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const SORTERS = {
  ticker: (holding) => holding.ticker,
  currentVal: (holding) => holding.currentVal,
  gainPct: (holding) => holding.gainPct,
  quantScore: (holding) => holding.stock.quantScore,
};

export default function Portfolio() {
  const [positions, setPositions] = useState(() => {
    const saved = readJson(PORTFOLIO_KEY, null);
    return saved === null
      ? sanitizePositions(DEFAULT_POSITIONS, TICKERS)
      : sanitizePositions(saved, TICKERS);
  });
  const [sortKey, setSortKey] = useState('currentVal');
  const [sortDir, setSortDir] = useState('desc');
  const [formMode, setFormMode] = useState(null);
  const [lastRemoved, setLastRemoved] = useState(null);
  const [resetBackup, setResetBackup] = useState(null);
  const [status, setStatus] = useState('');
  const [storageWarning, setStorageWarning] = useState('');

  const holdings = useMemo(() => buildPortfolioHoldings(positions, stocks), [positions]);
  const summary = useMemo(() => getPortfolioSummary(holdings), [holdings]);
  const equityCurve = useMemo(() => buildEquityCurve(holdings), [holdings]);
  const pieData = useMemo(() => buildAllocation(holdings), [holdings]);
  const editingPosition = formMode?.type === 'edit'
    ? positions.find((position) => position.ticker === formMode.ticker)
    : null;

  const sorted = useMemo(() => [...holdings].sort((a, b) => {
    const first = SORTERS[sortKey](a);
    const second = SORTERS[sortKey](b);
    const result = typeof first === 'string' ? first.localeCompare(second) : first - second;
    return sortDir === 'asc' ? result : -result;
  }), [holdings, sortDir, sortKey]);

  const persist = (next, message) => {
    setPositions(next);
    const saved = writeJson(PORTFOLIO_KEY, next);
    const warning = saved
      ? ''
      : 'This change is active for this session, but your browser blocked saving it. It may be lost when you close or reload this tab.';
    setStorageWarning(warning);
    setStatus([message, warning].filter(Boolean).join(' '));
  };

  const savePosition = (position) => {
    if (editingPosition) {
      persist(
        updatePosition(positions, editingPosition.ticker, position),
        `${editingPosition.ticker} was updated.`,
      );
    } else {
      const existing = positions.some((item) => item.ticker === position.ticker);
      persist(
        addPosition(positions, position),
        existing
          ? `A new ${position.ticker} lot was added to your existing position.`
          : `${position.ticker} was added to your portfolio.`,
      );
    }
    setFormMode(null);
    setLastRemoved(null);
    setResetBackup(null);
  };

  const deletePosition = (ticker) => {
    const removed = positions.find((position) => position.ticker === ticker);
    persist(removePosition(positions, ticker), `${ticker} was removed.`);
    setLastRemoved(removed || null);
    setResetBackup(null);
    if (formMode?.ticker === ticker) setFormMode(null);
  };

  const undoRemove = () => {
    if (!lastRemoved) return;
    persist(addPosition(positions, lastRemoved), `${lastRemoved.ticker} was restored.`);
    setLastRemoved(null);
    setResetBackup(null);
  };

  const resetPortfolio = () => {
    const defaults = sanitizePositions(DEFAULT_POSITIONS, TICKERS);
    setResetBackup(positions.map((position) => ({ ...position })));
    persist(
      defaults,
      'The sample portfolio was restored. Your previous positions can be recovered with Undo.',
    );
    setFormMode(null);
    setLastRemoved(null);
  };

  const undoReset = () => {
    if (!resetBackup) return;
    persist(resetBackup, 'Your previous portfolio was restored.');
    setResetBackup(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-100">
            <Briefcase size={22} className="text-brand-purple" />
            My Portfolio
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Build a local portfolio and monitor returns, allocation, concentration, and factor exposure.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => downloadCsv(holdings)}
            className="btn-secondary inline-flex items-center gap-2"
            disabled={!holdings.length}
          >
            <Download size={14} /> Export CSV
          </button>
          <button type="button" onClick={resetPortfolio} className="btn-secondary inline-flex items-center gap-2">
            <RotateCcw size={14} /> Reset to sample
          </button>
          <button type="button" onClick={() => setFormMode({ type: 'add' })} className="btn-primary inline-flex items-center gap-2">
            <Plus size={14} /> Add Position
          </button>
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">{status}</div>

      {storageWarning && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200"
        >
          <span className="font-semibold">Portfolio could not be saved.</span>{' '}
          {storageWarning}
        </div>
      )}

      {formMode && (
        <PositionForm
          key={editingPosition ? `edit-${editingPosition.ticker}` : 'add-position'}
          editingPosition={editingPosition}
          existingTickers={positions.map((position) => position.ticker)}
          onCancel={() => setFormMode(null)}
          onSubmit={savePosition}
          stocks={stocks}
        />
      )}

      {lastRemoved && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-blue/20 bg-brand-blue/10 px-4 py-3 text-sm text-blue-200">
          <span>{lastRemoved.ticker} was removed from this browser.</span>
          <button type="button" onClick={undoRemove} className="inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-white">
            <Undo2 size={14} /> Undo
          </button>
        </div>
      )}

      {resetBackup && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-blue/20 bg-brand-blue/10 px-4 py-3 text-sm text-blue-200">
          <span>The sample portfolio replaced your previous browser-saved positions.</span>
          <button type="button" onClick={undoReset} className="inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-white">
            <Undo2 size={14} /> Undo reset
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card glow-card p-5">
          <div className="mb-1 text-xs text-slate-400">Total Value</div>
          <div className="font-mono text-2xl font-extrabold text-slate-100">{fmtMoney(summary.totalValue)}</div>
          <div className={clsx('mt-1 text-xs', summary.totalGain >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {summary.totalGain >= 0 ? '+' : ''}{fmtMoney(summary.totalGain)} all-time
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-1 text-xs text-slate-400">Total Return</div>
          <div className={clsx('font-mono text-2xl font-extrabold', summary.totalGainPct >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {summary.totalGainPct >= 0 ? '+' : ''}{summary.totalGainPct.toFixed(2)}%
          </div>
          <div className="mt-1 text-xs text-slate-500">Cost basis {fmtMoney(summary.totalCost)}</div>
        </div>
        <div className="card p-5">
          <div className="mb-1 text-xs text-slate-400">Snapshot-day P&amp;L</div>
          <div className={clsx('font-mono text-2xl font-extrabold', summary.dailyPnL >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {summary.dailyPnL >= 0 ? '+' : ''}{fmtMoney(summary.dailyPnL)}
          </div>
          <div className="mt-1 text-xs text-slate-500">{holdings.length} {holdings.length === 1 ? 'position' : 'positions'}</div>
        </div>
        <div className="card p-5">
          <div className="mb-1 text-xs text-slate-400">Weighted Quant Score</div>
          <div className="font-mono text-2xl font-extrabold text-brand-blue">{summary.weightedQuantScore.toFixed(2)}</div>
          <div className="mt-1 text-xs text-slate-500">Weighted by current market value</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <h2 className="section-title">
            <TrendingUp size={16} className="text-brand-green" /> Current-Holdings Historical Replay (90D)
          </h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-yellow-300/80">
            Illustrative replay only: applies today&apos;s share counts to seeded synthetic price history and excludes
            transaction dates, cash flows, fees, and taxes. It is not actual portfolio performance.
          </p>
          {equityCurve.length ? (
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
                  tickFormatter={(date) => formatDateOnly(date, { month: 'short', day: 'numeric' })}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }}
                  formatter={(value) => [fmtMoney(value), 'Current-holdings replay']}
                  labelFormatter={(date) => formatDateOnly(date)}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#portGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-60 place-items-center rounded-lg border border-dashed border-navy-600 text-center text-sm text-slate-500">
              Add a position to build a current-holdings historical replay.
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="section-title mb-4">
            <PieChart size={16} className="text-brand-purple" /> Allocation
          </h2>
          {pieData.length ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RPieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [fmtMoney(value), 'Market value']} contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 6 }} />
                </RPieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className="text-slate-400">{item.name}</span>
                    <span className="ml-auto font-mono text-slate-300">{item.weight.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid h-60 place-items-center text-sm text-slate-500">No allocation to display.</div>
          )}
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <h2 className="section-title">
              <ShieldCheck size={16} className="text-brand-teal" /> Portfolio Health
            </h2>
            <p className="mt-1 text-xs text-slate-500">Value-weighted factor and concentration diagnostics.</p>
          </div>
          {summary.largestPosition && (
            <span className={clsx(
              'badge border',
              summary.largestWeight > 25
                ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                : 'border-brand-green/30 bg-brand-green/10 text-brand-green',
            )}>
              {summary.largestWeight > 25 ? 'Concentration watch' : 'Balanced concentration'}
            </span>
          )}
        </div>
        {holdings.length ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <FactorScores factors={summary.factorScores} />
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">Largest position</span>
                <strong className="font-mono text-slate-200">
                  {summary.largestPosition.ticker} · {summary.largestWeight.toFixed(1)}%
                </strong>
              </div>
              <div className="space-y-2">
                {summary.sectors.slice(0, 4).map((sector) => (
                  <div key={sector.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate text-slate-400">{sector.name}</span>
                      <span className="font-mono text-slate-300">{sector.weight.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-navy-600">
                      <div className="h-full rounded-full bg-brand-blue" style={{ width: `${sector.weight}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Portfolio health appears after you add your first position.</p>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-navy-700 p-5 sm:flex-row sm:items-center">
          <h2 className="section-title">
            <DollarSign size={16} className="text-brand-blue" /> Holdings
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="portfolio-sort" className="text-xs text-slate-500">Sort by</label>
            <select id="portfolio-sort" className="select w-auto py-1.5" value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
              <option value="currentVal">Market value</option>
              <option value="gainPct">Return</option>
              <option value="quantScore">Quant score</option>
              <option value="ticker">Ticker</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((direction) => direction === 'asc' ? 'desc' : 'asc')}
              className="btn-ghost inline-flex items-center gap-1.5 border border-navy-600"
              aria-label={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ArrowUpDown size={13} /> {sortDir === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700 bg-navy-850 text-xs text-slate-500">
                <th className="px-5 py-3 text-left font-medium">Stock</th>
                <th className="px-3 py-3 text-right font-medium">Shares</th>
                <th className="px-3 py-3 text-right font-medium">Entry</th>
                <th className="px-3 py-3 text-right font-medium">Current</th>
                <th className="px-3 py-3 text-right font-medium">Value</th>
                <th className="px-3 py-3 text-right font-medium">Gain/Loss</th>
                <th className="px-3 py-3 text-right font-medium">Return</th>
                <th className="hidden px-3 py-3 text-center font-medium md:table-cell">Rating</th>
                <th className="hidden px-3 py-3 text-center font-medium lg:table-cell">Value</th>
                <th className="hidden px-3 py-3 text-center font-medium lg:table-cell">Growth</th>
                <th className="hidden px-3 py-3 text-center font-medium lg:table-cell">Mom.</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((holding) => {
                const positive = holding.gain >= 0;
                const dayPositive = holding.stock.changePercent >= 0;
                return (
                  <tr key={holding.ticker} className="border-b border-navy-700/50 text-sm transition-colors hover:bg-navy-750">
                    <td className="px-5 py-3">
                      <Link to={`/stock/${holding.ticker}`} className="group flex items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-navy-500 bg-gradient-to-br from-brand-blue/30 to-brand-purple/20 text-xs font-bold text-blue-300">
                          {holding.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 group-hover:text-blue-300">{holding.ticker}</div>
                          <div className={clsx('text-xs', dayPositive ? 'text-brand-green' : 'text-brand-red')}>
                            {dayPositive ? '+' : ''}{holding.stock.changePercent.toFixed(2)}% latest simulated session
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">{fmtShares(holding.shares)}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-400">{fmtMoney(holding.entryPrice)}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-200">{fmtMoney(holding.stock.price)}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-100">{fmtMoney(holding.currentVal)}</td>
                    <td className={clsx('px-3 py-3 text-right font-mono font-semibold', positive ? 'text-brand-green' : 'text-brand-red')}>
                      {positive ? '+' : ''}{fmtMoney(holding.gain)}
                    </td>
                    <td className={clsx('px-3 py-3 text-right font-mono font-bold', positive ? 'text-brand-green' : 'text-brand-red')}>
                      {positive ? '+' : ''}{holding.gainPct.toFixed(2)}%
                    </td>
                    <td className="hidden px-3 py-3 text-center md:table-cell">
                      <QuantGrade grade={holding.stock.quantGrade} size="sm" />
                    </td>
                    {['value', 'growth', 'momentum'].map((factor) => (
                      <td key={factor} className="hidden px-3 py-3 lg:table-cell">
                        <div className="w-16">
                          <FactorBar label={factor} score={holding.stock.factors[factor]} showLabel={false} compact />
                        </div>
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <div className="mr-2 hidden w-16 xl:block">
                          <MiniChart data={holding.stock.priceHistory} positive={dayPositive} height={28} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormMode({ type: 'edit', ticker: holding.ticker })}
                          className="btn-ghost p-2"
                          aria-label={`Edit ${holding.ticker} position`}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePosition(holding.ticker)}
                          className="btn-ghost p-2 hover:text-brand-red"
                          aria-label={`Remove ${holding.ticker} position`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!sorted.length && (
                <tr>
                  <td colSpan={12} className="px-5 py-14 text-center">
                    <Briefcase size={28} className="mx-auto mb-3 text-slate-600" />
                    <p className="font-semibold text-slate-300">Your portfolio is empty</p>
                    <p className="mt-1 text-sm text-slate-500">Add a position or restore the sample portfolio to begin.</p>
                    <button type="button" onClick={() => setFormMode({ type: 'add' })} className="btn-primary mt-4 inline-flex items-center gap-2">
                      <Plus size={14} /> Add your first position
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
