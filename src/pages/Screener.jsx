import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal, Search, ArrowUpDown, ArrowUp, ArrowDown,
  TrendingUp, TrendingDown, Download, GitCompare, Bookmark, Trash2, Save,
} from 'lucide-react';
import { stocks, sectors } from '../data/stocks';
import { filterScreener, sortStocks, stocksToCsv, GRADES } from '../lib/quant';
import { loadPresets, savePresets, makePreset } from '../lib/presets';
import QuantGrade from '../components/common/QuantGrade';
import MiniChart from '../components/common/MiniChart';
import { FactorBar } from '../components/common/FactorBar';
import WatchlistButton from '../components/common/WatchlistButton';
import EmptyState from '../components/common/EmptyState';
import { useCompare } from '../context/CompareContext';
import clsx from 'clsx';

const fmtBig = (n) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${n}`;
};

const MCAP_OPTS = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Mega (>$200B)', min: 200e9, max: Infinity },
  { label: 'Large ($10–200B)', min: 10e9, max: 200e9 },
  { label: 'Mid ($2–10B)', min: 2e9, max: 10e9 },
  { label: 'Small (<$2B)', min: 0, max: 2e9 },
];

const COLS = [
  { key: 'watch', label: '', align: 'center', sortable: false },
  { key: 'ticker', label: 'Ticker', align: 'left' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'changePercent', label: 'Chg%', align: 'right' },
  { key: 'quantGrade', label: 'Rating', align: 'center' },
  { key: 'quantScore', label: 'Score', align: 'right' },
  { key: 'value', label: 'Value', align: 'center' },
  { key: 'growth', label: 'Growth', align: 'center' },
  { key: 'momentum', label: 'Momentum', align: 'center' },
  { key: 'profitability', label: 'Profit.', align: 'center' },
  { key: 'revisions', label: 'Revisions', align: 'center' },
  { key: 'marketCap', label: 'Mkt Cap', align: 'right' },
  { key: 'pe', label: 'P/E', align: 'right' },
  { key: 'dividendYield', label: 'Div%', align: 'right' },
  { key: 'chart', label: '30D', align: 'center', sortable: false },
  { key: 'compare', label: '', align: 'center', sortable: false },
];

export default function Screener() {
  const navigate = useNavigate();
  const { toggle: toggleCompare, isSelected, canAdd, count: compareCount } = useCompare();

  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('All');
  const [mcap, setMcap] = useState(0);
  const [minGrade, setMinGrade] = useState('All');
  const [sortKey, setSortKey] = useState('quantScore');
  const [sortDir, setSortDir] = useState('desc');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [presets, setPresets] = useState(() => loadPresets());
  const [presetId, setPresetId] = useState('');
  const [presetName, setPresetName] = useState('');

  const filtered = useMemo(() => {
    const mcapOpt = MCAP_OPTS[mcap];
    const list = filterScreener(stocks, {
      query,
      sector,
      minMarketCap: mcapOpt.min,
      maxMarketCap: mcapOpt.max,
      minGrade,
      minScore,
    });
    return sortStocks(list, sortKey, sortDir);
  }, [query, sector, mcap, minGrade, minScore, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const currentFilters = () => ({
    query, sector, mcap, minGrade, minScore, sortKey, sortDir,
  });

  const applyPreset = (id) => {
    setPresetId(id);
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setQuery(p.query);
    setSector(p.sector);
    setMcap(p.mcap);
    setMinGrade(p.minGrade);
    setMinScore(p.minScore);
    setSortKey(p.sortKey);
    setSortDir(p.sortDir);
  };

  const onSavePreset = () => {
    const made = makePreset(presetName, currentFilters());
    const withoutSame = presets.filter((x) => x.name.toLowerCase() !== made.name.toLowerCase());
    const next = savePresets([...withoutSame, made]);
    setPresets(next);
    setPresetId(made.id);
    setPresetName('');
  };

  const onDeletePreset = () => {
    if (!presetId) return;
    const next = savePresets(presets.filter((x) => x.id !== presetId));
    setPresets(next);
    setPresetId('');
  };

  const clearFilters = () => {
    setQuery('');
    setSector('All');
    setMcap(0);
    setMinGrade('All');
    setMinScore(0);
  };

  const exportCsv = () => {
    const csv = stocksToCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpharank-screener-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-slate-600 ml-0.5" aria-hidden="true" />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-brand-blue ml-0.5" aria-hidden="true" />
      : <ArrowDown size={12} className="text-brand-blue ml-0.5" aria-hidden="true" />;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-brand-blue" aria-hidden="true" />
            Stock Screener
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Filter and rank {stocks.length} stocks by quant factors, valuation, and momentum
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-40"
            aria-label="Export screener results as CSV"
          >
            <Download size={14} /> Export CSV
          </button>
          {compareCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/compare')}
              className="btn-primary flex items-center gap-2"
            >
              <GitCompare size={14} /> Compare ({compareCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((f) => !f)}
            className="btn-secondary flex items-center gap-2"
          >
            <SlidersHorizontal size={14} />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-slide-up">
          <div>
            <label htmlFor="screener-search" className="block text-xs text-slate-400 mb-1.5">Search</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="screener-search"
                className="input pl-8"
                placeholder="Ticker or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="screener-sector" className="block text-xs text-slate-400 mb-1.5">Sector</label>
            <select id="screener-sector" className="select" value={sector} onChange={(e) => setSector(e.target.value)}>
              <option>All</option>
              {sectors.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="screener-mcap" className="block text-xs text-slate-400 mb-1.5">Market Cap</label>
            <select id="screener-mcap" className="select" value={mcap} onChange={(e) => setMcap(+e.target.value)}>
              {MCAP_OPTS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="screener-grade" className="block text-xs text-slate-400 mb-1.5">Min Quant Grade</label>
            <select id="screener-grade" className="select" value={minGrade} onChange={(e) => setMinGrade(e.target.value)}>
              <option>All</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="screener-score" className="block text-xs text-slate-400 mb-1.5">
              Min Score: <span className="text-brand-blue font-bold">{minScore.toFixed(1)}</span>
            </label>
            <input
              id="screener-score"
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={minScore}
              onChange={(e) => setMinScore(+e.target.value)}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-0.5">
              <span>0</span><span>2.5</span><span>5</span>
            </div>
          </div>
        </div>
      )}

      <div className="card px-4 py-3 flex items-end gap-2 flex-wrap">
        <Bookmark size={14} className="text-brand-blue mb-2.5 hidden sm:block" aria-hidden="true" />
        <div className="min-w-[140px] flex-1">
          <label htmlFor="screener-preset" className="block text-xs text-slate-400 mb-1.5">Preset</label>
          <select
            id="screener-preset"
            className="select"
            value={presetId}
            onChange={(e) => applyPreset(e.target.value)}
          >
            <option value="">Apply…</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn-secondary flex items-center gap-1.5 disabled:opacity-40"
          onClick={onDeletePreset}
          disabled={!presetId}
          aria-label="Delete selected preset"
        >
          <Trash2 size={14} /> Delete
        </button>
        <div className="min-w-[140px] flex-1">
          <label htmlFor="screener-preset-name" className="block text-xs text-slate-400 mb-1.5">Save as</label>
          <input
            id="screener-preset-name"
            className="input"
            placeholder="Name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (presetName.trim()) onSavePreset();
              }
            }}
          />
        </div>
        <button
          type="button"
          className="btn-secondary flex items-center gap-1.5 disabled:opacity-40"
          onClick={onSavePreset}
          disabled={!presetName.trim()}
          aria-label="Save current filters as preset"
        >
          <Save size={14} /> Save
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-400">
          Showing <span className="text-slate-100 font-bold">{filtered.length}</span> of {stocks.length} stocks
        </span>
        {filtered.length !== stocks.length && (
          <button type="button" onClick={clearFilters} className="text-xs text-blue-400 hover:text-blue-300 focus-visible:underline">
            Clear filters
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No stocks match your filters"
            description="Try lowering the minimum score, clearing the sector filter, or searching a different ticker."
            action={
              <button type="button" onClick={clearFilters} className="btn-primary">
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable !== false && toggleSort(col.key)}
                      className={clsx(
                        'px-3 py-3 font-medium select-none',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.sortable !== false && 'cursor-pointer hover:text-slate-300 transition-colors',
                      )}
                      aria-sort={
                        sortKey === col.key
                          ? sortDir === 'asc' ? 'ascending' : 'descending'
                          : undefined
                      }
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {col.label}
                        {col.sortable !== false && col.label && <SortIcon col={col.key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const pos = s.changePercent >= 0;
                  const selected = isSelected(s.ticker);
                  return (
                    <tr
                      key={s.ticker}
                      className="table-row text-sm border-b border-navy-700/50"
                      onClick={() => navigate(`/stock/${s.ticker}`)}
                    >
                      <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <WatchlistButton ticker={s.ticker} size={15} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-200">{s.ticker}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[120px]">{s.name}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-slate-200">
                        ${s.price.toFixed(2)}
                      </td>
                      <td className={clsx('px-3 py-3 text-right font-mono font-semibold', pos ? 'text-brand-green' : 'text-brand-red')}>
                        <span className="flex items-center justify-end gap-0.5">
                          {pos ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
                          {pos ? '+' : ''}{s.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <QuantGrade grade={s.quantGrade} size="sm" />
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-200">
                        {s.quantScore.toFixed(2)}
                      </td>
                      {['value', 'growth', 'momentum', 'profitability', 'revisions'].map((f) => (
                        <td key={f} className="px-3 py-3">
                          <div className="w-20">
                            <FactorBar label={f} score={s.factors[f]} showLabel={false} compact showTooltip={false} />
                            <div className="text-center text-xs font-mono text-slate-400 mt-0.5">
                              {s.factors[f].toFixed(1)}
                            </div>
                          </div>
                        </td>
                      ))}
                      <td className="px-3 py-3 text-right text-xs text-slate-400">{fmtBig(s.marketCap)}</td>
                      <td className="px-3 py-3 text-right text-xs text-slate-400">{s.pe.toFixed(1)}x</td>
                      <td className="px-3 py-3 text-right text-xs text-slate-400">{s.dividendYield.toFixed(2)}%</td>
                      <td className="px-3 py-3">
                        <div className="w-16">
                          <MiniChart data={s.priceHistory} positive={pos} height={32} />
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={!selected && !canAdd}
                          onClick={() => toggleCompare(s.ticker)}
                          aria-label={selected ? `Remove ${s.ticker} from compare` : `Add ${s.ticker} to compare`}
                          aria-pressed={selected}
                          className={clsx(
                            'p-1.5 rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue/50 disabled:opacity-30',
                            selected
                              ? 'border-brand-purple/40 bg-brand-purple/15 text-brand-purple'
                              : 'border-navy-500 text-slate-500 hover:text-slate-200',
                          )}
                        >
                          <GitCompare size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
