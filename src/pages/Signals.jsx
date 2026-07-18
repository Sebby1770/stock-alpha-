import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Download,
  Gauge,
  ShieldCheck,
  Star,
  StarOff,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { stocks } from '../data/stocks';
import QuantGrade from '../components/common/QuantGrade';
import MiniChart from '../components/common/MiniChart';
import {
  STRATEGIES,
  buildHistoricalScenario,
  getSectorSignalSummary,
  rankSignalCandidates,
  toPercent,
} from '../utils/analytics';
import { readJson, storageKey, writeJson } from '../utils/storage';
import { formatDateOnly } from '../utils/dates';
import clsx from 'clsx';

const WATCHLIST_KEY = storageKey('watchlist', 'v2');
const fmtMoney = (value) => `$${Math.round(value).toLocaleString('en-US')}`;

const signalColor = (score) => {
  if (score >= 72) return 'text-brand-green';
  if (score >= 60) return 'text-brand-blue';
  if (score >= 48) return 'text-brand-yellow';
  return 'text-slate-400';
};

const riskColor = (score) => {
  if (score < 32) return 'text-brand-green';
  if (score < 58) return 'text-brand-yellow';
  return 'text-brand-red';
};

const downloadCsv = (name, rows) => {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = readJson(WATCHLIST_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [storageWarning, setStorageWarning] = useState('');

  const persist = (next) => {
    setWatchlist(next);
    const saved = writeJson(WATCHLIST_KEY, next);
    setStorageWarning(saved
      ? ''
      : 'This watchlist change is active for this session, but your browser blocked saving it. It may be lost when you close or reload this tab.');
  };

  const toggle = (ticker) => {
    persist(
      watchlist.includes(ticker)
        ? watchlist.filter((item) => item !== ticker)
        : [...watchlist, ticker],
    );
  };

  return { watchlist, toggle, storageWarning };
}

function MetricCard({ icon: Icon, label, value, hint, tone = 'text-slate-100' }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400 mb-1">{label}</div>
          <div className={clsx('text-2xl font-extrabold font-mono', tone)}>{value}</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-navy-700 border border-navy-500 flex items-center justify-center text-brand-blue">
          <Icon size={18} />
        </div>
      </div>
      {hint && <div className="text-xs text-slate-500 mt-2">{hint}</div>}
    </div>
  );
}

function SignalRow({ stock, starred, onToggle, onOpen }) {
  return (
    <tr className="table-row text-sm">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggle(stock.ticker);
          }}
          className="btn-ghost p-1"
          aria-label={starred ? `Remove ${stock.ticker} from watchlist` : `Add ${stock.ticker} to watchlist`}
        >
          {starred ? <Star size={16} className="fill-brand-yellow text-brand-yellow" /> : <StarOff size={16} />}
        </button>
      </td>
      <td className="px-2 py-3">
        <button
          type="button"
          onClick={() => onOpen(stock.ticker)}
          className="max-w-[160px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          aria-label={`Open ${stock.ticker} research`}
        >
          <span className="block font-bold text-slate-200">{stock.ticker}</span>
          <span className="block truncate text-xs text-slate-500">{stock.name}</span>
        </button>
      </td>
      <td className="px-3 py-3 text-center">
        <QuantGrade grade={stock.quantGrade} size="sm" />
      </td>
      <td className={clsx('px-3 py-3 text-right font-mono font-bold', signalColor(stock.signalScore))}>
        {stock.signalScore.toFixed(0)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-brand-green">
        {toPercent(stock.upside)}
      </td>
      <td className={clsx('px-3 py-3 text-right font-mono', riskColor(stock.riskScore))}>
        {stock.riskScore.toFixed(0)}
      </td>
      <td className="px-3 py-3 text-right text-slate-400">
        {stock.signalLabel}
      </td>
      <td className="px-4 py-3">
        <div className="w-20">
          <MiniChart data={stock.priceHistory} positive={stock.trailingReturn >= 0} height={30} />
        </div>
      </td>
    </tr>
  );
}

export default function Signals() {
  const navigate = useNavigate();
  const { watchlist, toggle, storageWarning } = useWatchlist();
  const [strategy, setStrategy] = useState('balanced');
  const ranked = useMemo(() => rankSignalCandidates(stocks), []);
  const scenario = useMemo(() => buildHistoricalScenario(stocks, strategy), [strategy]);
  const sectors = useMemo(() => getSectorSignalSummary(stocks), []);
  const watchlistStocks = ranked.filter((stock) => watchlist.includes(stock.ticker));
  const top = ranked[0];
  const averageUpside = ranked.reduce((sum, stock) => sum + stock.upside, 0) / ranked.length;
  const lowRiskCount = ranked.filter((stock) => stock.riskScore < 35).length;

  const exportSignals = () => {
    downloadCsv('alpharank-signals.csv', [
      ['Ticker', 'Name', 'Signal Score', 'Signal', 'Quant Grade', 'Upside', 'Risk', 'Volatility', 'Drawdown'],
      ...ranked.map((stock) => [
        stock.ticker,
        stock.name,
        stock.signalScore.toFixed(1),
        stock.signalLabel,
        stock.quantGrade,
        stock.upside.toFixed(1),
        stock.riskScore.toFixed(1),
        stock.volatility.toFixed(1),
        stock.drawdown.toFixed(1),
      ]),
    ]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Activity size={22} className="text-brand-blue" />
            Signal Lab
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Rank stocks by quant quality, upside, risk, momentum, and community conviction.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STRATEGIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStrategy(item.id)}
              aria-pressed={strategy === item.id}
              className={clsx('btn-secondary', strategy === item.id && 'border-brand-blue text-brand-blue bg-brand-blue/10')}
            >
              {item.label}
            </button>
          ))}
          <button type="button" onClick={exportSignals} className="btn-primary flex items-center gap-2">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {storageWarning && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200"
        >
          <span className="font-semibold">Watchlist could not be saved.</span>{' '}
          {storageWarning}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={Target}
          label="Top Signal"
          value={top.ticker}
          hint={`${top.signalLabel} at ${top.signalScore.toFixed(0)}/100`}
          tone="text-brand-green"
        />
        <MetricCard
          icon={TrendingUp}
          label="Historical Scenario"
          value={toPercent(scenario.totalReturn)}
          hint={`${scenario.holdings.length} current model leaders replayed on synthetic history`}
          tone={scenario.totalReturn >= 0 ? 'text-brand-green' : 'text-brand-red'}
        />
        <MetricCard
          icon={Gauge}
          label="Average Upside"
          value={toPercent(averageUpside)}
          hint="Across the full research universe"
          tone="text-brand-blue"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Low-Risk Ideas"
          value={lowRiskCount}
          hint="Risk score below 35"
          tone="text-brand-yellow"
        />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-5 gap-6">
        <section className="2xl:col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-navy-700">
            <h2 className="section-title">
              <Target size={16} className="text-brand-green" />
              Signal Leaderboard
            </h2>
            <span className="text-xs text-slate-500">{ranked.length} ranked stocks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                  <th className="px-4 py-3 w-10" />
                  <th className="text-left px-2 py-3 font-medium">Stock</th>
                  <th className="text-center px-3 py-3 font-medium">Grade</th>
                  <th className="text-right px-3 py-3 font-medium">Signal</th>
                  <th className="text-right px-3 py-3 font-medium">Upside</th>
                  <th className="text-right px-3 py-3 font-medium">Risk</th>
                  <th className="text-right px-3 py-3 font-medium">Call</th>
                  <th className="px-4 py-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 14).map((stock) => (
                  <SignalRow
                    key={stock.ticker}
                    stock={stock}
                    starred={watchlist.includes(stock.ticker)}
                    onToggle={toggle}
                    onOpen={(ticker) => navigate(`/stock/${ticker}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="2xl:col-span-2 card p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">
              <Activity size={16} className="text-brand-purple" />
              Historical Scenario
            </h2>
            <span className="text-xs text-slate-500">{STRATEGIES.find((item) => item.id === strategy)?.label}</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={scenario.curve} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="signalScenario" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.5)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(date) => formatDateOnly(date, { month: 'short', day: 'numeric' })}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                axisLine={false}
                tickLine={false}
                width={48}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }}
                formatter={(value) => [fmtMoney(value), 'Equity']}
                labelFormatter={(date) => formatDateOnly(date)}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#signalScenario)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs leading-relaxed text-yellow-200">
            Illustrative only: the current snapshot&apos;s model ranking is replayed over simulated history. It uses future-known snapshot inputs, so this is not a time-causal backtest or evidence of expected returns.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenario.holdings.map((stock) => (
              <button
                key={stock.ticker}
                type="button"
                onClick={() => navigate(`/stock/${stock.ticker}`)}
                className="flex items-center justify-between gap-3 rounded-lg border border-navy-600 bg-navy-850 px-3 py-2 text-left hover:border-brand-blue transition-colors"
              >
                <span>
                  <strong className="block text-sm text-slate-200">{stock.ticker}</strong>
                  <small className="text-xs text-slate-500">{stock.sector}</small>
                </span>
                <span className={clsx('font-mono text-sm', signalColor(stock.signalScore))}>
                  {stock.signalScore.toFixed(0)}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="section-title">
              <ShieldCheck size={16} className="text-brand-teal" />
              Sector Signal Map
            </h2>
            <span className="text-xs text-slate-500">Signal vs risk</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectors} layout="vertical" margin={{ top: 0, right: 22, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.5)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="sector" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={145} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }} />
              <Bar dataKey="signal" radius={[0, 4, 4, 0]}>
                {sectors.map((item) => (
                  <Cell key={item.sector} fill={item.signal >= 60 ? '#10b981' : item.signal >= 48 ? '#3b82f6' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="section-title">
              <Star size={16} className="text-brand-yellow" />
              Watchlist
            </h2>
            <span className="text-xs text-slate-500">{watchlistStocks.length} saved</span>
          </div>
          {watchlistStocks.length ? (
            <div className="space-y-3">
              {watchlistStocks.map((stock) => (
                <button
                  key={stock.ticker}
                  type="button"
                  onClick={() => navigate(`/stock/${stock.ticker}`)}
                  className="w-full flex items-center justify-between gap-4 rounded-lg border border-navy-600 bg-navy-850 px-4 py-3 text-left hover:border-brand-blue transition-colors"
                >
                  <span className="min-w-0">
                    <strong className="block text-sm text-slate-200">{stock.ticker} - {stock.name}</strong>
                    <small className="text-xs text-slate-500">{stock.signalLabel} | {toPercent(stock.upside)} upside</small>
                  </span>
                  <span className={clsx('font-mono font-bold', signalColor(stock.signalScore))}>
                    {stock.signalScore.toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-navy-500 bg-navy-850 p-6 text-center">
              <p className="text-sm text-slate-400 mb-3">Save signal ideas from the leaderboard to build a persistent research list.</p>
              <button type="button" onClick={() => toggle(top.ticker)} className="btn-primary">
                Add {top.ticker}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
