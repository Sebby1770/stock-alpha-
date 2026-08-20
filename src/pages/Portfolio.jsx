import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, TrendingUp, PieChart, DollarSign, Trash2, RotateCcw,
  ArrowDownRight, ArrowUpRight, Wallet, Activity, Shield,
  Download, Flag, Layers,
} from 'lucide-react';
import { stocks } from '../data/stocks';
import { usePortfolio } from '../context/PortfolioContext';
import QuantGrade from '../components/common/QuantGrade';
import MiniChart from '../components/common/MiniChart';
import { FactorBar } from '../components/common/FactorBar';
import EmptyState from '../components/common/EmptyState';
import WatchlistButton from '../components/common/WatchlistButton';
import { maxDrawdown, sharpe, herfindahl, equityReturns } from '../lib/risk';
import { ledgerToCsv } from '../lib/broker';
import { factorAttribution } from '../lib/attribution';
import { FACTOR_KEYS, FACTOR_META } from '../lib/quant';
import { fmtMoney } from '../lib/format';
import clsx from 'clsx';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart as RPieChart, Pie, Cell,
} from 'recharts';

const fmtBig = (n) => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#ec4899', '#84cc16'];

const buildEquityCurve = (holdings, cash) => {
  const hist = holdings[0]?.stock?.priceHistory;
  if (!hist?.length) return [];
  const days = hist.length;
  return Array.from({ length: days }, (_, i) => {
    const mv = holdings.reduce((sum, h) => {
      const pt = h.stock.priceHistory[i];
      return sum + (pt ? pt.price * h.shares : 0);
    }, 0);
    return {
      date: hist[i].date,
      value: Math.round((cash + mv) * 100) / 100,
    };
  });
};

export default function Portfolio() {
  const navigate = useNavigate();
  const {
    enriched, cash, equity, pnl, realized, marketValue, ledger, stops,
    buyStock, sellStock, removePosition, resetToDefault,
    addStop, removeStop, executeStopSignals,
  } = usePortfolio();
  const [buyForm, setBuyForm] = useState({ ticker: '', shares: '' });
  const [sellForm, setSellForm] = useState({ ticker: '', shares: '' });
  const [buyError, setBuyError] = useState('');
  const [sellError, setSellError] = useState('');
  const [stopDrafts, setStopDrafts] = useState({});
  const [stopMsg, setStopMsg] = useState('');
  const didCheckStops = useRef(false);

  useEffect(() => {
    if (didCheckStops.current) return;
    didCheckStops.current = true;
    executeStopSignals();
  }, [executeStopSignals]);

  const holdings = enriched;
  const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  const dailyPnL = holdings.reduce((s, h) => s + h.stock.change * h.shares, 0);
  const equityCurve = useMemo(() => buildEquityCurve(holdings, cash), [holdings, cash]);

  const risk = useMemo(() => {
    const rets = equityReturns(equityCurve);
    const mv = marketValue;
    const weights = mv > 0 ? holdings.map((h) => h.currentVal / mv) : [];
    return {
      maxDd: maxDrawdown(equityCurve),
      sharpe: sharpe(rets),
      hhi: herfindahl(weights),
    };
  }, [equityCurve, holdings, marketValue]);

  const pieData = [
    ...holdings
      .slice()
      .sort((a, b) => b.currentVal - a.currentVal)
      .map((h) => ({
        name: h.ticker,
        value: equity > 0 ? Math.round((h.currentVal / equity) * 1000) / 10 : 0,
      })),
    ...(cash > 0 && equity > 0
      ? [{ name: 'CASH', value: Math.round((cash / equity) * 1000) / 10 }]
      : []),
  ];

  const avgQuant = holdings.length
    ? holdings.reduce((s, h) => s + h.stock.quantScore, 0) / holdings.length
    : 0;

  const recentLedger = [...ledger].reverse().slice(0, 20);

  const attr = useMemo(
    () => factorAttribution(holdings, stocks, (t) => {
      const row = holdings.find((h) => h.ticker === t);
      return row?.stock?.price ?? 0;
    }),
    [holdings],
  );

  const exportLedger = () => {
    const csv = ledgerToCsv(ledger);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpharank-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onCheckStops = () => {
    const hits = executeStopSignals();
    setStopMsg(hits.length ? `Executed ${hits.length} stop${hits.length === 1 ? '' : 's'}` : 'No stops triggered');
  };

  const setDraft = (ticker, field, value) => {
    setStopDrafts((prev) => ({
      ...prev,
      [ticker]: { ...(prev[ticker] || {}), [field]: value },
    }));
  };

  const submitStops = (ticker) => {
    const draft = stopDrafts[ticker] || {};
    const sl = Number(draft.sl);
    const tp = Number(draft.tp);
    if (Number.isFinite(sl) && sl > 0) addStop({ ticker, kind: 'stop_loss', price: sl });
    if (Number.isFinite(tp) && tp > 0) addStop({ ticker, kind: 'take_profit', price: tp });
  };

  const stopFor = (ticker, kind) =>
    (stops || []).find((s) => s.ticker === ticker && s.kind === kind);

  const onBuyTicker = (ticker) => setBuyForm((f) => ({ ...f, ticker }));
  const onSellTicker = (ticker) => {
    const lot = holdings.find((h) => h.ticker === ticker);
    setSellForm({ ticker, shares: lot ? String(lot.shares) : '' });
  };

  const submitBuy = (e) => {
    e.preventDefault();
    setBuyError('');
    const result = buyStock(buyForm.ticker, buyForm.shares);
    if (!result.ok) {
      setBuyError(result.error || 'Could not buy');
      return;
    }
    setBuyForm({ ticker: '', shares: '' });
  };

  const submitSell = (e) => {
    e.preventDefault();
    setSellError('');
    const result = sellStock(sellForm.ticker, sellForm.shares);
    if (!result.ok) {
      setSellError(result.error || 'Could not sell');
      return;
    }
    setSellForm({ ticker: '', shares: '' });
  };

  const buyStockRow = stocks.find((s) => s.ticker === buyForm.ticker);
  const buyNotional = buyStockRow && Number(buyForm.shares) > 0
    ? buyStockRow.price * Number(buyForm.shares)
    : 0;
  const sellLot = holdings.find((h) => h.ticker === sellForm.ticker);
  const sellNotional = sellLot && Number(sellForm.shares) > 0
    ? sellLot.stock.price * Number(sellForm.shares)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Briefcase size={22} className="text-brand-purple" aria-hidden="true" />
            Paper Broker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Cash ledger · fills at last mock price · saved in this browser
          </p>
        </div>
        <button
          type="button"
          onClick={resetToDefault}
          className="btn-secondary flex items-center gap-2"
          title="Reset to sample holdings and $100,000 cash"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 glow-card">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <Wallet size={12} aria-hidden="true" /> Cash
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-100">{fmtBig(cash)}</div>
          <div className="text-xs text-slate-500 mt-1">Settled buying power</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-400 mb-1">Equity</div>
          <div className="text-2xl font-extrabold font-mono text-slate-100">{fmtBig(equity)}</div>
          <div className="text-xs text-slate-500 mt-1">
            Cash + MV {fmtBig(marketValue)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-400 mb-1">P&amp;L</div>
          <div className="flex items-end gap-5 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Unrealized</div>
              <div className={clsx('text-2xl font-extrabold font-mono', pnl >= 0 ? 'text-brand-green' : 'text-brand-red')}>
                {pnl >= 0 ? '+' : ''}{fmtBig(pnl)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Realized</div>
              <div className={clsx('text-2xl font-extrabold font-mono', realized >= 0 ? 'text-brand-green' : 'text-brand-red')}>
                {realized >= 0 ? '+' : ''}{fmtBig(realized)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-1">Open vs cost {fmtBig(totalCost)} · closed from ledger</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-400 mb-1">Today&apos;s P&amp;L</div>
          <div className={clsx('text-2xl font-extrabold font-mono', dailyPnL >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {dailyPnL >= 0 ? '+' : ''}{fmtBig(dailyPnL)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{holdings.length} open lots</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield size={12} aria-hidden="true" /> Max drawdown
          </div>
          <div className="text-xl font-extrabold font-mono text-brand-red">
            {(risk.maxDd * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500">Peak-to-trough on mock curve</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Activity size={12} aria-hidden="true" /> Sharpe
          </div>
          <div className="text-xl font-extrabold font-mono text-brand-blue">
            {Number.isFinite(risk.sharpe) ? risk.sharpe.toFixed(2) : '—'}
          </div>
          <div className="text-xs text-slate-500">Ann. from daily mock returns</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-slate-400">HHI concentration</div>
          <div className="text-xl font-extrabold font-mono text-slate-100">
            {risk.hhi.toFixed(3)}
          </div>
          <div className="text-xs text-slate-500">Σ w² of open lots (1 = single name)</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-slate-400">Avg Quant Score</div>
          <div className="text-xl font-extrabold font-mono text-brand-blue">
            {holdings.length ? avgQuant.toFixed(2) : '—'}
          </div>
          <div className="text-xs text-slate-500">Portfolio quality score</div>
        </div>
      </div>

      {holdings.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-3">
            <Layers size={16} className="text-brand-purple" aria-hidden="true" /> Factor attribution
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Value-weighted holdings vs equal-weight mock universe
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-navy-700">
                  <th className="text-left py-2 font-medium">Factor</th>
                  <th className="text-right py-2 font-medium">Portfolio</th>
                  <th className="text-right py-2 font-medium">Universe</th>
                  <th className="text-right py-2 font-medium">Delta</th>
                </tr>
              </thead>
              <tbody>
                {FACTOR_KEYS.map((k) => {
                  const d = attr.delta[k];
                  return (
                    <tr key={k} className="border-b border-navy-700/50">
                      <td className="py-2 text-slate-300">{FACTOR_META[k].label}</td>
                      <td className="py-2 text-right font-mono text-slate-200">{attr.portfolio[k].toFixed(2)}</td>
                      <td className="py-2 text-right font-mono text-slate-400">{attr.universe[k].toFixed(2)}</td>
                      <td className={clsx('py-2 text-right font-mono font-semibold', d >= 0 ? 'text-brand-green' : 'text-brand-red')}>
                        {d >= 0 ? '+' : ''}{d.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={submitBuy} className="card p-5">
          <h2 className="section-title mb-4">
            <ArrowUpRight size={16} className="text-brand-green" aria-hidden="true" /> Buy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="buy-ticker" className="block text-xs text-slate-400 mb-1.5">Ticker</label>
              <select
                id="buy-ticker"
                className="select"
                required
                value={buyForm.ticker}
                onChange={(e) => onBuyTicker(e.target.value)}
              >
                <option value="">Select…</option>
                {stocks.map((s) => (
                  <option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="buy-shares" className="block text-xs text-slate-400 mb-1.5">Shares</label>
              <input
                id="buy-shares"
                className="input"
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="e.g. 10"
                value={buyForm.shares}
                onChange={(e) => setBuyForm((f) => ({ ...f, shares: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Fill @ {buyStockRow ? fmtMoney(buyStockRow.price) : 'last price'}
            {buyNotional > 0 ? ` · notional ${fmtMoney(buyNotional)}` : ''}
          </p>
          {buyError && <p className="text-sm text-brand-red mb-3" role="alert">{buyError}</p>}
          <button type="submit" className="btn-primary">Buy at last price</button>
        </form>

        <form onSubmit={submitSell} className="card p-5">
          <h2 className="section-title mb-4">
            <ArrowDownRight size={16} className="text-brand-red" aria-hidden="true" /> Sell
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="sell-ticker" className="block text-xs text-slate-400 mb-1.5">Lot</label>
              <select
                id="sell-ticker"
                className="select"
                required
                value={sellForm.ticker}
                onChange={(e) => onSellTicker(e.target.value)}
                disabled={holdings.length === 0}
              >
                <option value="">{holdings.length ? 'Select…' : 'No open lots'}</option>
                {holdings.map((h) => (
                  <option key={h.ticker} value={h.ticker}>
                    {h.ticker} · {h.shares} sh @ {fmtMoney(h.entryPrice)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sell-shares" className="block text-xs text-slate-400 mb-1.5">Shares</label>
              <input
                id="sell-shares"
                className="input"
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="e.g. 5"
                value={sellForm.shares}
                onChange={(e) => setSellForm((f) => ({ ...f, shares: e.target.value }))}
                disabled={holdings.length === 0}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Fill @ {sellLot ? fmtMoney(sellLot.stock.price) : 'last price'}
            {sellNotional > 0 ? ` · proceeds ${fmtMoney(sellNotional)}` : ''}
          </p>
          {sellError && <p className="text-sm text-brand-red mb-3" role="alert">{sellError}</p>}
          <button type="submit" className="btn-secondary" disabled={holdings.length === 0}>
            Sell at last price
          </button>
        </form>
      </div>

      {holdings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Briefcase}
            title="No open lots"
            description="Buy a name with cash, or reset to the sample book ($100,000 cash + seed positions). Mock data only."
            action={
              <button type="button" onClick={resetToDefault} className="btn-primary">Load sample book</button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 card p-5">
              <h2 className="section-title mb-4">
                <TrendingUp size={16} className="text-brand-green" aria-hidden="true" /> Equity curve (90D mock)
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
                    formatter={(v) => [fmtBig(v), 'Equity']}
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
                {pieData.slice(0, 8).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
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
                  {[...holdings].sort((a, b) => b.currentVal - a.currentVal).map((h) => {
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
                              aria-label={`Close ${h.ticker} position`}
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

      {holdings.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-navy-700 gap-3 flex-wrap">
            <h2 className="section-title">
              <Flag size={16} className="text-brand-yellow" aria-hidden="true" /> Stops
            </h2>
            <div className="flex items-center gap-2">
              {stopMsg && <span className="text-xs text-slate-400">{stopMsg}</span>}
              <button type="button" className="btn-primary" onClick={onCheckStops}>
                Check stops
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                  <th className="text-left px-5 py-3 font-medium">Ticker</th>
                  <th className="text-right px-3 py-3 font-medium">Last</th>
                  <th className="text-right px-3 py-3 font-medium">Stop-loss</th>
                  <th className="text-right px-3 py-3 font-medium">Take-profit</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {[...holdings].sort((a, b) => b.currentVal - a.currentVal).map((h) => {
                  const sl = stopFor(h.ticker, 'stop_loss');
                  const tp = stopFor(h.ticker, 'take_profit');
                  return (
                    <tr key={h.ticker} className="text-sm border-b border-navy-700/50">
                      <td className="px-5 py-3 font-bold text-slate-200">{h.ticker}</td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">{fmtMoney(h.stock.price)}</td>
                      <td className="px-3 py-3">
                        <input
                          className="input text-right font-mono"
                          type="number"
                          min="0.01"
                          step="any"
                          placeholder={sl ? String(sl.price) : 'SL'}
                          aria-label={`${h.ticker} stop-loss`}
                          value={stopDrafts[h.ticker]?.sl ?? (sl ? String(sl.price) : '')}
                          onChange={(e) => setDraft(h.ticker, 'sl', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          className="input text-right font-mono"
                          type="number"
                          min="0.01"
                          step="any"
                          placeholder={tp ? String(tp.price) : 'TP'}
                          aria-label={`${h.ticker} take-profit`}
                          value={stopDrafts[h.ticker]?.tp ?? (tp ? String(tp.price) : '')}
                          onChange={(e) => setDraft(h.ticker, 'tp', e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => submitStops(h.ticker)}
                        >
                          Set
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {stops.length > 0 && (
            <div className="p-5 border-t border-navy-700 space-y-2">
              <p className="text-xs text-slate-500">{stops.length} saved stop{stops.length === 1 ? '' : 's'}</p>
              <ul className="space-y-1.5">
                {stops.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span className={clsx(
                      'badge uppercase',
                      s.kind === 'stop_loss' ? 'bg-brand-red/15 text-brand-red' : 'bg-brand-green/15 text-brand-green',
                    )}
                    >
                      {s.kind === 'stop_loss' ? 'SL' : 'TP'}
                    </span>
                    <span className="font-bold text-slate-200">{s.ticker}</span>
                    <span className="font-mono text-slate-400">{fmtMoney(s.price)}</span>
                    {!s.enabled && <span className="text-xs text-slate-500">off</span>}
                    <button
                      type="button"
                      className="ml-auto p-1.5 rounded-md text-slate-500 hover:text-brand-red hover:bg-brand-red/10"
                      aria-label={`Remove ${s.ticker} ${s.kind}`}
                      onClick={() => removeStop(s.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-navy-700 gap-3 flex-wrap">
          <h2 className="section-title">
            <Activity size={16} className="text-brand-blue" aria-hidden="true" /> Ledger
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Last {recentLedger.length} of {ledger.length} fills</span>
            <button
              type="button"
              className="btn-secondary flex items-center gap-2 disabled:opacity-40"
              onClick={exportLedger}
              disabled={ledger.length === 0}
              aria-label="Export ledger as CSV"
            >
              <Download size={14} /> Export ledger CSV
            </button>
          </div>
        </div>
        {recentLedger.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500 text-center">
            No fills yet. Buys and sells print here with cash after each ticket.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                  <th className="text-left px-5 py-3 font-medium">Time</th>
                  <th className="text-left px-3 py-3 font-medium">Side</th>
                  <th className="text-left px-3 py-3 font-medium">Ticker</th>
                  <th className="text-right px-3 py-3 font-medium">Shares</th>
                  <th className="text-right px-3 py-3 font-medium">Price</th>
                  <th className="text-right px-3 py-3 font-medium">Realized</th>
                  <th className="text-left px-3 py-3 font-medium">Note</th>
                  <th className="text-right px-5 py-3 font-medium">Cash after</th>
                </tr>
              </thead>
              <tbody>
                {recentLedger.map((row) => (
                  <tr key={row.id} className="text-sm border-b border-navy-700/50">
                    <td className="px-5 py-2.5 text-slate-400 font-mono text-xs">
                      {new Date(row.ts).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={clsx(
                        'badge uppercase',
                        row.side === 'buy' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-red/15 text-brand-red',
                      )}
                      >
                        {row.side}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-200">{row.ticker}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-300">{row.shares}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-300">{fmtMoney(row.price)}</td>
                    <td className={clsx(
                      'px-3 py-2.5 text-right font-mono',
                      Number(row.realized) > 0 ? 'text-brand-green' : Number(row.realized) < 0 ? 'text-brand-red' : 'text-slate-400',
                    )}
                    >
                      {row.realized == null ? '—' : fmtMoney(row.realized)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{row.note || '—'}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-slate-200">{fmtMoney(row.cashAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Paper broker on simulated prices. Not a live market, not financial advice.
      </p>
    </div>
  );
}
