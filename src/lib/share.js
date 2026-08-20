/**
 * Compact URL snapshots of a paper book: { cash, holdings }.
 * Payload is JSON then base64url (query-safe, no padding).
 */

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(s) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function snapshotOf(book) {
  const cash = Number(book?.cash);
  const holdings = [];
  if (Array.isArray(book?.holdings)) {
    for (const h of book.holdings) {
      if (!h || !h.ticker) continue;
      const shares = Number(h.shares);
      const entryPrice = Number(h.entryPrice);
      if (!Number.isFinite(shares) || shares <= 0) continue;
      if (!Number.isFinite(entryPrice) || entryPrice <= 0) continue;
      holdings.push({
        ticker: String(h.ticker).toUpperCase(),
        shares,
        entryPrice,
      });
    }
  }
  return {
    cash: Number.isFinite(cash) ? cash : 0,
    holdings,
  };
}

/**
 * Encode cash + lots for a `?book=` query (ledger/stops omitted).
 */
export function encodeBook(book) {
  return toBase64Url(JSON.stringify(snapshotOf(book)));
}

/**
 * Inverse of encodeBook. Returns `{ cash, holdings }` or null if the string is junk.
 */
export function decodeBook(str) {
  if (typeof str !== 'string') return null;
  let raw = str.trim();
  if (!raw) return null;
  try {
    if (raw.includes('%')) raw = decodeURIComponent(raw);
  } catch {
    // keep raw
  }
  let data;
  try {
    data = JSON.parse(fromBase64Url(raw));
  } catch {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (!('cash' in data) && !('holdings' in data)) return null;
  return snapshotOf(data);
}
