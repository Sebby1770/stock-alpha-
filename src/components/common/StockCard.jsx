import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import QuantGrade from './QuantGrade';
import MiniChart from './MiniChart';
import { FactorScores } from './FactorBar';
import clsx from 'clsx';

const fmt = (n, decimals = 2) =>
  n === undefined || n === null ? '—' : n.toFixed(decimals);

const fmtBig = (n) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n}`;
};

export default function StockCard({ stock, showFactors = true }) {
  const navigate = useNavigate();
  const positive = stock.changePercent >= 0;

  return (
    <div
      className="card-hover p-4 cursor-pointer group animate-slide-up"
      onClick={() => navigate(`/stock/${stock.ticker}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/stock/${stock.ticker}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue/30 to-brand-purple/20 border border-navy-500 flex items-center justify-center text-xs font-bold text-blue-300">
            {stock.ticker.slice(0, 2)}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
              {stock.ticker}
            </div>
            <div className="text-xs text-slate-500 truncate max-w-[120px]">{stock.name}</div>
          </div>
        </div>
        <QuantGrade grade={stock.quantGrade} size="md" showGlow />
      </div>

      {/* Price + Chart */}
      <div className="flex items-end justify-between gap-2 mb-3">
        <div>
          <div className="text-lg font-bold font-mono text-slate-100">
            ${fmt(stock.price)}
          </div>
          <div
            className={clsx(
              'flex items-center gap-0.5 text-xs font-medium',
              positive ? 'text-brand-green' : 'text-brand-red',
            )}
          >
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {positive ? '+' : ''}{fmt(stock.changePercent)}%
          </div>
        </div>
        <div className="flex-1 max-w-[100px]">
          <MiniChart data={stock.priceHistory} positive={positive} height={40} />
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div>
          <div className="text-slate-500">Mkt Cap</div>
          <div className="text-slate-300 font-medium">{fmtBig(stock.marketCap)}</div>
        </div>
        <div>
          <div className="text-slate-500">P/E</div>
          <div className="text-slate-300 font-medium">{fmt(stock.pe, 1)}x</div>
        </div>
        <div>
          <div className="text-slate-500">Div Yield</div>
          <div className="text-slate-300 font-medium">{fmt(stock.dividendYield, 2)}%</div>
        </div>
      </div>

      {/* Factor bars */}
      {showFactors && (
        <div className="border-t border-navy-700 pt-3">
          <FactorScores factors={stock.factors} compact />
        </div>
      )}

      {/* Quant score */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-500">Quant Score</span>
        <span className="font-bold font-mono text-slate-200">{stock.quantScore.toFixed(2)} / 5.00</span>
      </div>
    </div>
  );
}
