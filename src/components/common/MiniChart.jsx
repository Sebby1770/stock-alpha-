import { ResponsiveContainer, LineChart, Line, Tooltip, Area, AreaChart } from 'recharts';

export default function MiniChart({ data, positive, height = 48, showTooltip = false }) {
  const color = positive ? '#10b981' : '#ef4444';
  const gradientId = `mini-${positive ? 'pos' : 'neg'}-${Math.random().toString(36).slice(2, 7)}`;
  const slice = data?.slice(-30) ?? [];

  if (!slice.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={slice} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showTooltip && (
          <Tooltip
            contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 6, fontSize: 11 }}
            itemStyle={{ color: '#e2e8f0' }}
            labelStyle={{ color: '#94a3b8', fontSize: 10 }}
            formatter={(v) => [`$${v.toFixed(2)}`, 'Price']}
          />
        )}
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={showTooltip ? { r: 3, fill: color } : false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
