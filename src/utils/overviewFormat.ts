// Number formatting for the Business Overview. Indian grouping, lakh/crore
// shorthand for big money, and null-safe everywhere ("—" never "NaN").

const DASH = '—';

export function inr(n: number | null | undefined, opts: { compact?: boolean } = {}): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (opts.compact) {
    if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)}Cr`;
    if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)}L`;
    if (abs >= 1e4) return `${sign}₹${trim(abs / 1e3)}K`;
  }
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

function trim(v: number): string {
  return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1).replace(/\.0$/, '') : v.toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
}

export function num(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  return Math.round(n).toLocaleString('en-IN');
}

/** Ratio (0.123) → "12.3%". */
export function ratio(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  return `${(n * 100).toFixed(digits)}%`;
}

/** Already-a-percentage value (12.3) → "+12.3%". */
export function signedPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  const rounded = Math.abs(n) >= 1000 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('en-IN')}%`;
}

export function minutes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  return n >= 60 ? `${Math.floor(n / 60)}h ${Math.round(n % 60)}m` : `${Math.round(n)} min`;
}

/** Local YYYY-MM-DD for <input type="date"> and the API. */
export function isoDate(d: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
