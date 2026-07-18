export function getRouterMode(baseUrl = '/') {
  return baseUrl === '/' ? 'browser' : 'hash';
}
