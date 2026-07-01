import {
  Activity,
  Cloud,
  Database,
  GitBranch,
  HardDrive,
  Lock,
  Radio,
  Rocket,
  Settings,
  Shield,
  Workflow,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  architectureNodes,
  cacheAndShardPlan,
  deploymentModes,
  deliveryChannels,
  productionChecks,
  readinessSummary,
  securityControls,
  serviceLevelTargets,
} from '../data/ops';
import clsx from 'clsx';

const stateTone = {
  Applied: 'text-brand-green border-brand-green/30 bg-brand-green/10',
  Ready: 'text-brand-blue border-brand-blue/30 bg-brand-blue/10',
  Designed: 'text-brand-yellow border-brand-yellow/30 bg-brand-yellow/10',
  Planned: 'text-slate-300 border-slate-500/30 bg-slate-500/10',
};

const nodeIcons = {
  client: Activity,
  'cache proxy': Cloud,
  'static host': HardDrive,
  'firewall + rate limit': Shield,
  serverless: Rocket,
  queue: Workflow,
  database: Database,
  observability: GitBranch,
};

function StatusPill({ state }) {
  return (
    <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', stateTone[state] || stateTone.Planned)}>
      {state}
    </span>
  );
}

function SummaryCard({ item }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1">{item.label}</div>
          <div className="text-2xl font-extrabold font-mono text-slate-100">{item.value}%</div>
        </div>
        <StatusPill state={item.status} />
      </div>
      <div className="mt-3 h-2 rounded-full bg-navy-700 overflow-hidden">
        <div className="h-full rounded-full bg-brand-blue" style={{ width: `${item.value}%` }} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{item.detail}</p>
    </div>
  );
}

export default function Ops() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Settings size={22} className="text-brand-blue" />
            Production Ops
          </h1>
          <p className="text-slate-400 text-sm mt-0.5 max-w-3xl">
            A deployment and reliability cockpit for the research platform: container staging, CI/CD, cloud hosting, API throttles, caching, and observability.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-brand-green/20 bg-brand-green/10 px-3 py-2 text-sm text-brand-green">
          <Lock size={15} />
          Static app hardened for staged deployment
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {readinessSummary.map((item) => <SummaryCard key={item.label} item={item} />)}
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-5 gap-6">
        <section className="2xl:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">
              <Workflow size={16} className="text-brand-purple" />
              Production Checklist
            </h2>
            <span className="text-xs text-slate-500">readiness map</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {productionChecks.map((check) => (
              <article key={check.area} className="rounded-lg border border-navy-600 bg-navy-850 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{check.area}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{check.impact}</p>
                  </div>
                  <StatusPill state={check.state} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {check.items.map((item) => (
                    <span key={item} className="rounded-full bg-navy-700 px-2.5 py-1 text-xs text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="2xl:col-span-2 card p-5">
          <h2 className="section-title mb-5">
            <Cloud size={16} className="text-brand-teal" />
            Cloud Path
          </h2>
          <div className="space-y-3">
            {architectureNodes.map((node) => {
              const Icon = nodeIcons[node.type] || Activity;
              return (
                <div key={node.name} className="flex items-center gap-3 rounded-lg border border-navy-600 bg-navy-850 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg border border-navy-500 bg-navy-700 text-brand-blue">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-200">{node.name}</div>
                    <div className="text-xs text-slate-500">{node.type}</div>
                  </div>
                  <div className="text-right text-xs text-slate-400">{node.throughput}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
        <section className="2xl:col-span-2 card p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="section-title">
              <Radio size={16} className="text-brand-green" />
              Data Delivery Plane
            </h2>
            <span className="text-xs text-slate-500">websocket / polling / rpc / queue</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {deliveryChannels.map((channel) => (
              <article key={channel.name} className="rounded-lg border border-navy-600 bg-navy-850 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{channel.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{channel.notes}</p>
                  </div>
                  <span className="rounded bg-navy-700 px-2 py-1 font-mono text-xs text-brand-blue">{channel.latency}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-navy-600 bg-navy-950 px-3 py-2">
                    <span className="block text-slate-500">Reliability</span>
                    <strong className="text-slate-300">{channel.reliability}</strong>
                  </div>
                  <div className="rounded border border-navy-600 bg-navy-950 px-3 py-2">
                    <span className="block text-slate-500">Fallback</span>
                    <strong className="text-slate-300">{channel.fallback}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="section-title mb-4">
            <Shield size={16} className="text-brand-yellow" />
            Security Controls
          </h2>
          <div className="space-y-3">
            {securityControls.map((item) => (
              <div key={item.control} className="rounded-lg border border-navy-600 bg-navy-850 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-200">{item.control}</span>
                  <StatusPill state={item.state} />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="section-title">
            <Database size={16} className="text-brand-purple" />
            Cache & Partition Plan
          </h2>
          <span className="text-xs text-slate-500">caching proxy / sharding / throughput</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-xs text-slate-500">
                <th className="px-3 py-3 text-left font-medium">Layer</th>
                <th className="px-3 py-3 text-left font-medium">Partition Key</th>
                <th className="px-3 py-3 text-left font-medium">TTL</th>
                <th className="px-3 py-3 text-left font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {cacheAndShardPlan.map((item) => (
                <tr key={`${item.layer}-${item.key}`} className="border-b border-navy-800 last:border-0">
                  <td className="px-3 py-3 font-semibold text-slate-200">{item.layer}</td>
                  <td className="px-3 py-3 font-mono text-xs text-brand-blue">{item.key}</td>
                  <td className="px-3 py-3 text-xs text-slate-400">{item.ttl}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{item.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="section-title mb-4">
            <Activity size={16} className="text-brand-green" />
            Service Targets
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={readinessSummary} margin={{ top: 4, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.5)" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {readinessSummary.map((item) => (
                  <Cell key={item.label} fill={item.value >= 85 ? '#10b981' : item.value >= 75 ? '#3b82f6' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid gap-2">
            {serviceLevelTargets.map((target) => (
              <div key={target.metric} className="grid grid-cols-3 gap-3 rounded-lg border border-navy-600 bg-navy-850 p-3 text-xs">
                <span className="font-semibold text-slate-200">{target.metric}</span>
                <span className="font-mono text-brand-blue">{target.target}</span>
                <span className="text-slate-500">{target.current}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="section-title mb-4">
            <Rocket size={16} className="text-brand-yellow" />
            Deployment Modes
          </h2>
          <div className="space-y-4">
            {deploymentModes.map((mode) => (
              <article key={mode.name} className="rounded-lg border border-navy-600 bg-navy-850 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{mode.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{mode.bestFor}</p>
                  </div>
                  <GitBranch size={16} className="text-brand-blue" />
                </div>
                <code className="mt-3 block overflow-x-auto rounded bg-navy-950 px-3 py-2 text-xs text-slate-300">
                  {mode.command}
                </code>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">{mode.notes}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
