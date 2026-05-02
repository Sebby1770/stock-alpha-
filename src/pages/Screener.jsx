import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Search, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { stocks, sectors } from '../data/stocks';
import QuantGrade from '../components/common/QuantGrade';
import MiniChart from '../components/common/MiniChart';
import { FactorBar } from '../components/common/FactorBar';
import clsx from 'clsx';

const fmtBig = (n) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${n}`;
};

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
const gradeOrder = Object.fromEntries(GRADES.map((g, i) => [g, i]));

const MCAP_OPTS = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Mega (>$200B)', min: 200e9, max: Infinity },
  { label: 'Large ($10–200B)', min: 10e9, max: 200e9 },
  { label: 'Mid ($2–10B)', min: 2e9, max: 10e9 },
  { label: 'Small (<$2B)', min: 0, max: 2e9 },
];

const COLS = [
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
  { key: 'chart', label: '30D', align: 'center' },
];

export default function Screener() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('All');
  const [mcap, setMcap] = useState(0);
  const [minGrade, setMinGrade] = useState('All');
  const [sortKey, setSortKey] = useState('quantScore');
  const [sortDir, setSortDir] = useState('desc');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  const filtered = useMemo(() => {
    const mcapOpt = MCAP_OPTS[mcap];
    return stocks
      .filter((s) => {
        if (query) {
          const q = query.toLowerCase();
          if (!s.ticker.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false;
        }
        if (sector !== 'All' && s.sector !== sector) return false;
        if (s.marketCap < mcapOpt.min || s.marketCap > mcapOpt.max) return false;
        if (minGrade !== 'All' && gradeOrder[s.quantGrade] > gradeOrder[minGrade]) return false;
        if (s.quantScore < minScore) return false;
        return true;
      })
      .sort((a, b) => {
        let av, bv;
        if (sortKey === 'quantGrade') {
          av = gradeOrder[a.quantGrade] ?? 99;
          bv = gradeOrder[b.quantGrade] ?? 99;
        } else if (['value', 'growth', 'momentum', 'profitability', 'revisions'].includes(sortKey)) {
          av = a.factors[sortKey];
          bv = b.factors[sortKey];
        } else {
          av = a[sortKey];
          bv = b[sortKey];
        }
        if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return sortDir === 'asc' ? av - bv : bv - av;
      });
  }, [query, sector, mcap, minGrade, minScore, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-slate-600 ml-0.5" />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-brand-blue ml-0.5" />
      : <ArrowDown size={12} className="text-brand-blue ml-0.5" />;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-brand-blue" />
            Stock Screener
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Filter and rank {stocks.length} stocks by quant factors, valuation, and momentum
          </p>
        </div>
        <button
          onClick={() => setShowFilters((f) => !f)}
          className="btn-secondary flex items-center gap-2"
        >
          <SlidersHorizontal size={14} />
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-slide-up">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Search</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input pl-8"
                placeholder="Ticker or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Sector</label>
            <select className="select" value={sector} onChange={(e) => setSector(e.target.value)}>
              <option>All</option>
              {sectors.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Market Cap</label>
            <select className="select" value={mcap} onChange={(e) => setMcap(+e.target.value)}>
              {MCAP_OPTS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Min Quant Grade</label>
            <select className="select" value={minGrade} onChange={(e) => setMinGrade(e.target.value)}>
              <option>All</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Min Score: <span className="text-brand-blue font-bold">{minScore.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0} max={5} step={0.1}
              value={minScore}
              onChange={(e) => setMinScore(+e.target.value)}
              className="w-full accent-brand-blue"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-0.5">
              <span>0</span><span>2.5</span><span>5</span>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-400">
          Showing <span className="text-slate-100 font-bold">{filtered.length}</span> of {stocks.length} stocks
        </span>
        {filtered.length !== stocks.length && (
          <button
            onClick={() => { setQuery(''); setSector('All'); setMcap(0); setMinGrade('All'); setMinScore(0); }}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                {COLS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== 'chart' && toggleSort(col.key)}
                    className={clsx(
                      'px-3 py-3 font-medium select-none',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                      col.key !== 'chart' && 'cursor-pointer hover:text-slate-300 transition-colors',
                    )}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {col.label}
                      {col.key !== 'chart' && <SortIcon col={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const pos = s.changePercent >= 0;
                return (
                  <tr
                    key={s.ticker}
                    className="table-row text-sm border-b border-navy-700/50"
                    onClick={() => navigate(`/stock/${s.ticker}`)}
                  >
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-200">{s.ticker}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[120px]">{s.name}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-200">
                      ${s.price.toFixed(2)}
                    </td>
                    <td className={clsx('px-3 py-3 text-right font-mono font-semibold', pos ? 'text-brand-green' : 'text-brand-red')}>
                      <span className="flex items-center justify-end gap-0.5">
                        {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {pos ? '+' : ''}{s.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <QuantGrade grade={s.quantGrade} size="sm" />
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-200">
                      {s.quantScore.toFixed(2)}
                    </td>
                    {/* Factor bars */}
                    {['value', 'growth', 'momentum', 'profitability', 'revisions'].map((f) => (
                      <td key={f} className="px-3 py-3">
                        <div className="w-20">
                          <FactorBar label={f} score={s.factors[f]} showLabel={false} compact />
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
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLS.length} className="text-center py-16 text-slate-500">
                    No stocks match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
