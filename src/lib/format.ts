/** Shared formatters. The kit is Bangkok-based, so money is Thai Baht. */

export const THB = '฿'

/** 48290 -> "฿48,290" */
export function baht(n: number, opts: { decimals?: number } = {}): string {
  const { decimals = 0 } = opts
  return (
    THB +
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  )
}

/** 48290 -> "฿48.29k" — used in chart axes and compact stat tiles. */
export function bahtCompact(n: number): string {
  if (Math.abs(n) >= 1000) return THB + (n / 1000).toFixed(2).replace(/\.00$/, '') + 'k'
  return THB + n
}

/** 1340 -> "1,340" */
export function num(n: number): string {
  return n.toLocaleString('en-US')
}

/** 0.872 -> "87%" */
export function pct(n: number, decimals = 0): string {
  return (n * 100).toFixed(decimals) + '%'
}

/** "Harper Nelson" -> "HN" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}
