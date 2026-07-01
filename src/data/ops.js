export const readinessSummary = [
  { label: 'CI/CD', value: 94, status: 'Applied', detail: 'GitHub Actions builds, audits, and container-checks the production bundle.' },
  { label: 'Containerisation', value: 90, status: 'Applied', detail: 'Docker image serves the static app through nginx with SPA fallback and health probes.' },
  { label: 'Cloud Delivery', value: 84, status: 'Ready', detail: 'S3 or GitHub Pages can sit behind CloudFront, CDN caching, and WAF rules.' },
  { label: 'Observability', value: 86, status: 'Applied', detail: 'Runtime errors are captured locally; QPS, throughput, and availability targets are defined.' },
];

export const productionChecks = [
  {
    area: 'CI/CD',
    items: ['GitHub Actions', 'build verification', 'npm audit gate', 'deployment changelog'],
    state: 'Applied',
    impact: 'Every PR has a repeatable quality gate before merge.',
  },
  {
    area: 'Docker Staging',
    items: ['multi-stage image', 'nginx SPA fallback', 'static asset caching'],
    state: 'Applied',
    impact: 'The dashboard can be run locally or in a staging container.',
  },
  {
    area: 'S3 + CDN',
    items: ['immutable assets', 'index fallback', 'CloudFront cache policy'],
    state: 'Ready',
    impact: 'The app can be hosted cheaply as static infrastructure.',
  },
  {
    area: 'Firewall + Rate Limiting',
    items: ['WAF in front of CDN', 'API gateway throttles', 'bot filters'],
    state: 'Designed',
    impact: 'Protects future quote/news APIs from noisy clients.',
  },
  {
    area: 'Error Logging',
    items: ['runtime error boundary', 'release stamp', 'local incident queue'],
    state: 'Applied',
    impact: 'Turns user-facing failures into recoverable incidents.',
  },
  {
    area: 'Data Pipeline',
    items: ['SQS ingestion queue', 'Lambda workers', 'DynamoDB signal cache', 'Kafka/RabbitMQ option'],
    state: 'Designed',
    impact: 'Decouples market-data fetches from UI traffic.',
  },
  {
    area: 'Client Storage',
    items: ['versioned keys', 'try/catch persistence', 'minimal saved fields'],
    state: 'Applied',
    impact: 'Keeps watchlists and error events resilient across schema changes.',
  },
  {
    area: 'Load Balancing',
    items: ['CDN edge', 'origin health checks', 'blue/green promotion'],
    state: 'Ready',
    impact: 'Provides a clean path from static demo to highly available cloud delivery.',
  },
];

export const architectureNodes = [
  { name: 'Browser', type: 'client', throughput: 'interactive' },
  { name: 'CloudFront / CDN', type: 'cache proxy', throughput: 'high availability' },
  { name: 'S3 or Pages', type: 'static host', throughput: 'immutable assets' },
  { name: 'API Gateway', type: 'firewall + rate limit', throughput: 'QPS guardrail' },
  { name: 'Lambda Workers', type: 'serverless', throughput: 'scheduled refresh' },
  { name: 'SQS', type: 'queue', throughput: 'burst smoothing' },
  { name: 'Kafka / RabbitMQ', type: 'queue', throughput: 'durable fanout' },
  { name: 'DynamoDB', type: 'database', throughput: 'signal cache' },
  { name: 'Error Logs', type: 'observability', throughput: 'incident trail' },
];

export const serviceLevelTargets = [
  { metric: 'Availability', target: '99.9%', current: 'static host ready' },
  { metric: 'P95 page load', target: '< 2.5s', current: 'route chunks split' },
  { metric: 'API QPS budget', target: '100 req/min/user', current: 'gateway design' },
  { metric: 'Cache TTL', target: '60s quotes / 1h research', current: 'CDN plan' },
  { metric: 'Queue lag', target: '< 30s signal refresh', current: 'SQS worker plan' },
  { metric: 'Error logging', target: '100% runtime exceptions', current: 'runbook defined' },
];

export const deploymentModes = [
  {
    name: 'GitHub Pages',
    command: 'npm run deploy',
    bestFor: 'simple public demo',
    notes: 'Existing base path points at /stock-alpha-/ for Pages.',
  },
  {
    name: 'Docker Staging',
    command: 'docker build -t alpharank . && docker run -p 8080:80 alpharank',
    bestFor: 'local staging and load balancer checks',
    notes: 'nginx serves immutable assets and falls back to index.html for React routes.',
  },
  {
    name: 'S3 + CloudFront',
    command: 'npm run build && aws s3 sync dist/ s3://<bucket>',
    bestFor: 'cheap cloud production',
    notes: 'Pair with WAF, cache policies, and HTTPS-only viewer protocol.',
  },
];

export const deliveryChannels = [
  {
    name: 'WebSocket Stream',
    latency: '< 250ms',
    reliability: 'hot quote tape',
    fallback: 'short polling',
    notes: 'Best for live ticks, watchlist deltas, and intraday signal changes.',
  },
  {
    name: 'Long Polling',
    latency: '1-15s',
    reliability: 'enterprise proxy safe',
    fallback: 'short polling',
    notes: 'Useful when firewalls block WebSocket upgrades but users still need push-like updates.',
  },
  {
    name: 'RPC Snapshot',
    latency: '< 500ms',
    reliability: 'read-only state',
    fallback: 'cached response',
    notes: 'Supports widgets, status probes, and deterministic dashboard reloads.',
  },
  {
    name: 'SQS Worker Queue',
    latency: '< 30s',
    reliability: 'durable ingestion',
    fallback: 'dead-letter replay',
    notes: 'Buffers expensive provider pulls before Lambda workers write signal snapshots.',
  },
];

export const cacheAndShardPlan = [
  { layer: 'Browser cache', key: 'route chunk + version', ttl: 'session', purpose: 'Avoid reloading heavy charts after navigation.' },
  { layer: 'CDN cache', key: 'asset hash', ttl: '1 year', purpose: 'Serve immutable Vite assets globally.' },
  { layer: 'API cache', key: 'ticker + interval', ttl: '60 seconds', purpose: 'Protect quote providers from duplicate QPS.' },
  { layer: 'DynamoDB shard', key: 'sector#ticker', ttl: 'market day', purpose: 'Partition signal reads by sector and symbol.' },
  { layer: 'Dead-letter store', key: 'provider + request id', ttl: '14 days', purpose: 'Debug failed Lambda/SQS ingestion jobs.' },
];

export const securityControls = [
  { control: 'Encryption', detail: 'HTTPS-only viewer policy, HSTS, and encrypted object storage.', state: 'Ready' },
  { control: 'Firewall', detail: 'WAF rules for bot filtering, geo anomalies, and abusive query patterns.', state: 'Designed' },
  { control: 'Rate Limiting', detail: 'API Gateway throttle budgets and per-user QPS ceilings.', state: 'Designed' },
  { control: 'Deployments', detail: 'Blue/green static releases with rollback to the previous asset version.', state: 'Ready' },
  { control: 'GitHub Flow', detail: 'Feature branches, pull requests, CI gates, and changelog entries per release.', state: 'Applied' },
];
