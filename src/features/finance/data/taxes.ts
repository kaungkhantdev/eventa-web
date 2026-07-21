/* Ported from admin/taxes.html — the monthly VAT ledger. VAT is a monthly
   filing: the return for a period is due on the 15th of the next month. VAT is
   7% of taxable sales; only filed periods have been remitted. */

export type TaxStatus = 'Filed' | 'Due' | 'Upcoming'

const VAT_RATE = 0.07
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const TAX_STATUS_BADGE: Record<TaxStatus, { cls: string; icon: string }> = {
  Filed: { cls: 'badge badge-green', icon: 'hgi-tick-02' },
  Due: { cls: 'badge badge-amber', icon: 'hgi-clock-01' },
  Upcoming: { cls: 'badge badge-gray', icon: 'hgi-calendar-03' },
}

type TaxSeed = { m: string; y: number; sales: number; wht: number; st: TaxStatus }

const TAX_SEED: TaxSeed[] = [
  { m: 'Jul', y: 2025, sales: 1240500, wht: 21700, st: 'Filed' },
  { m: 'Aug', y: 2025, sales: 1486200, wht: 25600, st: 'Filed' },
  { m: 'Sep', y: 2025, sales: 1352800, wht: 23150, st: 'Filed' },
  { m: 'Oct', y: 2025, sales: 1905400, wht: 33400, st: 'Filed' },
  { m: 'Nov', y: 2025, sales: 2140900, wht: 36800, st: 'Filed' },
  { m: 'Dec', y: 2025, sales: 2865300, wht: 49900, st: 'Filed' },
  { m: 'Jan', y: 2026, sales: 1720600, wht: 29750, st: 'Filed' },
  { m: 'Feb', y: 2026, sales: 1982450, wht: 34200, st: 'Filed' },
  { m: 'Mar', y: 2026, sales: 2308700, wht: 40100, st: 'Filed' },
  { m: 'Apr', y: 2026, sales: 2155300, wht: 37250, st: 'Filed' },
  { m: 'May', y: 2026, sales: 2640150, wht: 45600, st: 'Filed' },
  { m: 'Jun', y: 2026, sales: 3012800, wht: 52400, st: 'Due' },
  { m: 'Jul', y: 2026, sales: 3456900, wht: 60900, st: 'Due' },
  { m: 'Aug', y: 2026, sales: 3180400, wht: 55300, st: 'Upcoming' },
  { m: 'Sep', y: 2026, sales: 2742600, wht: 47600, st: 'Upcoming' },
]

export type TaxRow = {
  period: string
  year: number
  due: string
  sales: number
  vat: number
  wht: number
  remitted: number
  st: TaxStatus
}

/* derive: VAT = 7% of taxable sales; only filed periods have been remitted */
export const TAX_ROWS: TaxRow[] = TAX_SEED.map((r) => {
  const vat = Math.round(r.sales * VAT_RATE)
  const i = MONTHS.indexOf(r.m)
  return {
    period: r.m + ' ' + r.y,
    year: r.y,
    due: '15 ' + MONTHS[(i + 1) % 12] + ' ' + (i === 11 ? r.y + 1 : r.y),
    sales: r.sales,
    vat,
    wht: r.wht,
    remitted: r.st === 'Filed' ? vat : 0,
    st: r.st,
  }
})

export const TAX_YEARS = ['2026', '2025'] as const

export function nf(n: number): string {
  return n.toLocaleString('en-US')
}

export function baht(n: number): string {
  return '฿' + nf(n)
}

/* compact ฿ for the KPI headline figures (฿2.39M / ฿242k / ฿980) */
export function bahtShort(n: number): string {
  if (n >= 1000000) return '฿' + (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (n >= 1000) return '฿' + Math.round(n / 1000) + 'k'
  return '฿' + nf(n)
}
