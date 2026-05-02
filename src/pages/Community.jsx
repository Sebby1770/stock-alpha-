import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, ThumbsUp, MessageSquare, Target, PenLine, Filter } from 'lucide-react';
import { communityPosts, topCommunityPicks } from '../data/community';
import { getStockByTicker } from '../data/stocks';
import QuantGrade from '../components/common/QuantGrade';
import clsx from 'clsx';

const FILTERS = ['All', 'Buy', 'Hold', 'Sell'];

export default function Community() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [votes, setVotes] = useState({});
  const [showForm, setShowForm] = useState(false);

  const visible = communityPosts.filter(
    (p) => filter === 'All' || p.rating === filter,
  );

  const upvote = (id) =>
    setVotes((v) => ({ ...v, [id]: v[id] ? v[id] + 1 : 1 }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Users size={22} className="text-brand-cyan" />
            Community Analysis
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Crowdsourced investment theses, price targets, and research from {communityPosts.length * 12}+ analysts
          </p>
        </div>
        <button
          onClick={() => setShowForm((f) => !f)}
          className="btn-primary flex items-center gap-2"
        >
          <PenLine size={14} /> New Analysis
        </button>
      </div>

      {/* New post form */}
      {showForm && (
        <div className="card p-5 animate-slide-up border-brand-blue/30">
          <h2 className="section-title mb-4">
            <PenLine size={15} className="text-brand-blue" /> Submit Analysis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Ticker</label>
              <input className="input" placeholder="e.g. NVDA" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Rating</label>
              <select className="select">
                <option>Buy</option><option>Hold</option><option>Sell</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Price Target</label>
              <input className="input" placeholder="e.g. 500" type="number" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1.5">Title</label>
            <input className="input" placeholder="Compelling investment thesis headline..." />
          </div>
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1.5">Analysis</label>
            <textarea
              className="input min-h-[120px] resize-none"
              placeholder="Share your research, valuation model, and key catalysts..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary">Submit Analysis</button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <span className="text-xs text-slate-500 ml-auto">
              Analyses are subject to community moderation
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="xl:col-span-2 space-y-5">
          {/* Filter pills */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  filter === f
                    ? f === 'Buy' ? 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                      : f === 'Sell' ? 'bg-brand-red/20 text-brand-red border border-brand-red/30'
                      : f === 'Hold' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30'
                    : 'bg-navy-700 text-slate-400 hover:text-slate-200',
                )}
              >
                {f}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-500">{visible.length} posts</span>
          </div>

          {visible.map((post) => {
            const stock = getStockByTicker(post.ticker);
            const extraVotes = votes[post.id] || 0;
            return (
              <article key={post.id} className="card p-5 card-hover">
                {/* Post header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: post.avatarColor }}
                  >
                    {post.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-200">{post.author}</span>
                      <span className="text-slate-500">on</span>
                      <button
                        onClick={() => navigate(`/stock/${post.ticker}`)}
                        className="font-bold text-blue-400 hover:text-blue-300 font-mono text-sm"
                      >
                        {post.ticker}
                      </button>
                      {stock && <QuantGrade grade={stock.quantGrade} size="xs" />}
                      <span
                        className={clsx(
                          'badge',
                          post.rating === 'Buy' ? 'bg-brand-green/15 text-brand-green' :
                          post.rating === 'Sell' ? 'bg-brand-red/15 text-brand-red' :
                          'bg-yellow-500/15 text-yellow-400',
                        )}
                      >
                        {post.rating}
                      </span>
                      {post.priceTarget && (
                        <span className="badge bg-navy-600 text-slate-400 flex items-center gap-1">
                          <Target size={10} /> ${post.priceTarget}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto hidden sm:block">
                        {new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mt-1.5 leading-snug">
                      {post.title}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="text-sm text-slate-300 leading-relaxed space-y-3">
                  {post.body.split('\n\n').map((para, i) => (
                    <p key={i}>{para.trim()}</p>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {post.tags.map((t) => (
                    <span key={t} className="badge bg-navy-600 text-slate-500 text-xs">{t}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-navy-700 text-xs">
                  <button
                    onClick={() => upvote(post.id)}
                    className={clsx(
                      'flex items-center gap-1.5 font-semibold transition-colors',
                      extraVotes > 0 ? 'text-brand-green' : 'text-slate-400 hover:text-brand-green',
                    )}
                  >
                    <ThumbsUp size={13} />
                    {post.upvotes + extraVotes} upvotes
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                    <MessageSquare size={13} />
                    {post.comments} comments
                  </button>
                  {stock && (
                    <div className="ml-auto flex items-center gap-2 text-slate-500">
                      <span>${stock.price.toFixed(2)}</span>
                      <span className={stock.changePercent >= 0 ? 'text-brand-green' : 'text-brand-red'}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Top picks */}
          <div className="card p-5">
            <h2 className="section-title mb-4">
              <TrendingUp size={16} className="text-brand-yellow" />
              Top Community Picks
            </h2>
            <div className="space-y-3">
              {topCommunityPicks.map((pick, i) => {
                const stock = getStockByTicker(pick.ticker);
                return (
                  <div
                    key={pick.ticker}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-navy-750 cursor-pointer transition-colors"
                    onClick={() => navigate(`/stock/${pick.ticker}`)}
                  >
                    <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-yellow/20 to-brand-orange/10 border border-navy-500 flex items-center justify-center text-xs font-bold text-yellow-300">
                      {pick.ticker.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-200">{pick.ticker}</div>
                      <div className="text-xs text-slate-500">{pick.posts} analyses · Avg PT ${pick.avgTarget}</div>
                    </div>
                    <span
                      className={clsx(
                        'badge text-xs',
                        pick.consensus === 'Strong Buy' ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-blue/20 text-brand-blue',
                      )}
                    >
                      {pick.consensus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Platform Stats</h2>
            <div className="space-y-3">
              {[
                ['Analysts Active', '2,847', 'text-brand-blue'],
                ['Total Analyses', '14,293', 'text-brand-purple'],
                ['Avg Accuracy', '58.4%', 'text-brand-green'],
                ['Bullish Ratio', '62% / 38%', 'text-brand-yellow'],
              ].map(([label, val, color]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-navy-700 last:border-0">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className={clsx('text-sm font-bold font-mono', color)}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl bg-navy-700/50 border border-navy-600 p-4 text-xs text-slate-500 leading-relaxed">
            Community analyses are for educational purposes only. Not financial advice. Past accuracy does not guarantee future performance. Always do your own research.
          </div>
        </div>
      </div>
    </div>
  );
}
