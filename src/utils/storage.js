const APP_PREFIX = 'alpharank';

export function storageKey(name, version = 'v1') {
  return `${APP_PREFIX}:${name}:${version}`;
}

export function readJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Browsers can reject storage in private mode or when quota is full.
    return false;
  }
}
