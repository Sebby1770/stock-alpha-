export const readinessSummary = [
  { label: 'CI/CD', value: 92, status: 'Applied', detail: 'GitHub Actions builds, audits, and validates the production bundle.' },
  { label: 'Containerisation', value: 86, status: 'Applied', detail: 'Docker image serves the static app through nginx with SPA fallback.' },
  { label: 'Cloud Delivery', value: 78, status: 'Ready', detail: 'S3 or GitHub Pages can sit behind CloudFront, CDN caching, and WAF rules.' },
  { label: 'Observability', value: 82, status: 'Applied', detail: 'Runtime errors are captured locally; QPS and availability targets are defined for live APIs.' },
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
    items: ['SQS ingestion queue', 'Lambda workers', 'DynamoDB signal cache'],
    state: 'Designed',
    impact: 'Decouples market-data fetches from UI traffic.',
  },
];

export const architectureNodes = [
  { name: 'Browser', type: 'client', throughput: 'interactive' },
  { name: 'CloudFront / CDN', type: 'cache proxy', throughput: 'high availability' },
  { name: 'S3 or Pages', type: 'static host', throughput: 'immutable assets' },
  { name: 'API Gateway', type: 'firewall + rate limit', throughput: 'QPS guardrail' },
  { name: 'Lambda Workers', type: 'serverless', throughput: 'scheduled refresh' },
  { name: 'SQS', type: 'queue', throughput: 'burst smoothing' },
  { name: 'DynamoDB', type: 'database', throughput: 'signal cache' },
  { name: 'Error Logs', type: 'observability', throughput: 'incident trail' },
];

export const serviceLevelTargets = [
  { metric: 'Availability', target: '99.9%', current: 'static host ready' },
  { metric: 'P95 page load', target: '< 2.5s', current: 'route chunks split' },
  { metric: 'API QPS budget', target: '100 req/min/user', current: 'gateway design' },
  { metric: 'Cache TTL', target: '60s quotes / 1h research', current: 'CDN plan' },
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
