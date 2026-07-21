/* Ported from admin/invoices.html — the invoice ledger plus every time-based
   derivation the static kit computed inline. Amounts are the VAT-inclusive
   total (฿, whole baht); subtotal + 7% VAT always reconstructs the row amount. */

export type InvoiceStatus = 'Paid' | 'Issued' | 'Overdue' | 'Void'

export type Invoice = {
  no: string
  ref: string
  issued: string
  due: string
  buyer: string
  sub: string
  ev: string
  amt: number
  /** Paid / Void are terminal, authored states. Issued / Overdue are DERIVED
   *  from the due date so they can never drift from it. */
  st?: 'Paid' | 'Void'
  paidVia?: string
  paidOn?: string
}

export const INVOICE_STATUS_BADGE: Record<InvoiceStatus, { cls: string; icon: string }> = {
  Paid: { cls: 'badge badge-green', icon: 'hgi-tick-02' },
  Issued: { cls: 'badge badge-blue', icon: 'hgi-invoice-01' },
  Overdue: { cls: 'badge badge-amber', icon: 'hgi-alert-01' },
  Void: { cls: 'badge badge-gray', icon: 'hgi-cancel-01' },
}

/** The event picker options, in source order (after "All events"). */
export const INVOICE_EVENTS = [
  'Tech Summit 2026',
  'Bangkok Jazz Night',
  'Sunrise Yoga Retreat',
  'Thai Street Food Festival',
  'UX Bangkok Meetup',
] as const

/* The kit's fixed "today" (matches the Taxes report). Everything time-based on
   this page derives from it, so the ageing text can never contradict the badge. */
const TODAY = new Date(2026, 6, 17) // Jul 17, 2026

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function parseD(s: string): Date {
  const m = /^(\w{3}) (\d{1,2}), (\d{4})$/.exec(s)
  if (!m) return new Date(NaN)
  return new Date(Number(m[3]), MONTHS[m[1]!]!, Number(m[2]))
}

function daysFromToday(s: string): number {
  return Math.round((parseD(s).getTime() - TODAY.getTime()) / 86400000)
}

/* Invoices carry 14-day payment terms: `due` = issued + 14d. Paid / Void are
   terminal and authored. Everything else is DERIVED from the due date — an
   unpaid bill is Overdue once its due date has passed, otherwise Issued. */
export const INVOICES: Invoice[] = [
  { no: '#INV-2041', ref: 'ORD-88214', issued: 'Jul 16, 2026', due: 'Jul 30, 2026', buyer: 'Siam Digital Co., Ltd.', sub: 'finance@siamdigital.co.th', ev: 'Tech Summit 2026', amt: 48000 },
  { no: '#INV-2040', ref: 'ORD-88209', issued: 'Jul 15, 2026', due: 'Jul 29, 2026', buyer: 'Anong Preechawut', sub: 'anong.p@gmail.com', ev: 'Tech Summit 2026', amt: 1250, st: 'Paid', paidVia: 'Card', paidOn: 'Jul 15, 2026' },
  { no: '#INV-2039', ref: 'ORD-88197', issued: 'Jul 14, 2026', due: 'Jul 28, 2026', buyer: 'Bangkok Cloudworks Ltd.', sub: 'ap@cloudworks.co.th', ev: 'Tech Summit 2026', amt: 32500, st: 'Paid', paidVia: 'Bank transfer', paidOn: 'Jul 16, 2026' },
  { no: '#INV-2038', ref: 'ORD-88186', issued: 'Jul 13, 2026', due: 'Jul 27, 2026', buyer: 'Somchai Thanakit', sub: 'somchai.t@outlook.com', ev: 'Bangkok Jazz Night', amt: 480, st: 'Paid', paidVia: 'PromptPay', paidOn: 'Jul 13, 2026' },
  { no: '#INV-2037', ref: 'ORD-88175', issued: 'Jul 12, 2026', due: 'Jul 26, 2026', buyer: 'Ploy Sirichai', sub: 'ploy.s@gmail.com', ev: 'Tech Summit 2026', amt: 2500 },
  { no: '#INV-2036', ref: 'ORD-88168', issued: 'Jul 11, 2026', due: 'Jul 25, 2026', buyer: 'Lotus Media Group', sub: 'billing@lotusmedia.co.th', ev: 'Bangkok Jazz Night', amt: 19200 },
  { no: '#INV-2035', ref: 'ORD-88154', issued: 'Jul 10, 2026', due: 'Jul 24, 2026', buyer: 'Kittipong Rattana', sub: 'kittipong.r@gmail.com', ev: 'UX Bangkok Meetup', amt: 640, st: 'Void' },
  { no: '#INV-2034', ref: 'ORD-88141', issued: 'Jul 9, 2026', due: 'Jul 23, 2026', buyer: 'Suda Kaewkla', sub: 'suda.k@yahoo.com', ev: 'Sunrise Yoga Retreat', amt: 1780, st: 'Paid', paidVia: 'Card', paidOn: 'Jul 10, 2026' },
  { no: '#INV-2033', ref: 'ORD-88133', issued: 'Jul 8, 2026', due: 'Jul 22, 2026', buyer: 'Thonburi Wellness Co.', sub: 'accounts@thonburiwell.com', ev: 'Sunrise Yoga Retreat', amt: 26700, st: 'Paid', paidVia: 'Bank transfer', paidOn: 'Jul 14, 2026' },
  { no: '#INV-2032', ref: 'ORD-88120', issued: 'Jul 7, 2026', due: 'Jul 21, 2026', buyer: 'Nutcha Wongsuwan', sub: 'nutcha.w@gmail.com', ev: 'Bangkok Jazz Night', amt: 960 },
  { no: '#INV-2031', ref: 'ORD-88112', issued: 'Jul 6, 2026', due: 'Jul 20, 2026', buyer: 'Wichai Chaiyaphum', sub: 'wichai.c@gmail.com', ev: 'Tech Summit 2026', amt: 1250, st: 'Paid', paidVia: 'Card', paidOn: 'Jul 6, 2026' },
  { no: '#INV-2030', ref: 'ORD-88104', issued: 'Jul 4, 2026', due: 'Jul 18, 2026', buyer: 'Ratchada Foods Co., Ltd.', sub: 'finance@ratchadafoods.th', ev: 'Thai Street Food Festival', amt: 13000 },
  { no: '#INV-2029', ref: 'ORD-88093', issued: 'Jul 3, 2026', due: 'Jul 17, 2026', buyer: 'Malee Panyarachun', sub: 'malee.p@gmail.com', ev: 'Thai Street Food Festival', amt: 650, st: 'Paid', paidVia: 'PromptPay', paidOn: 'Jul 5, 2026' },
  { no: '#INV-2028', ref: 'ORD-88081', issued: 'Jul 2, 2026', due: 'Jul 16, 2026', buyer: 'Siriporn Wattana', sub: 'siriporn.w@hotmail.com', ev: 'Tech Summit 2026', amt: 3750 },
  { no: '#INV-2027', ref: 'ORD-88070', issued: 'Jul 1, 2026', due: 'Jul 15, 2026', buyer: 'Narong Ruangsak', sub: 'narong.r@gmail.com', ev: 'UX Bangkok Meetup', amt: 320, st: 'Void' },
  { no: '#INV-2026', ref: 'ORD-88062', issued: 'Jun 29, 2026', due: 'Jul 13, 2026', buyer: 'Chao Phraya Bank PCL', sub: 'ap@chaophrayabank.co.th', ev: 'Tech Summit 2026', amt: 41250, st: 'Paid', paidVia: 'Bank transfer', paidOn: 'Jul 10, 2026' },
  { no: '#INV-2025', ref: 'ORD-88051', issued: 'Jun 27, 2026', due: 'Jul 11, 2026', buyer: 'Preeya Boonmee', sub: 'preeya.b@gmail.com', ev: 'Sunrise Yoga Retreat', amt: 890, st: 'Paid', paidVia: 'Card', paidOn: 'Jun 28, 2026' },
  { no: '#INV-2024', ref: 'ORD-88044', issued: 'Jun 25, 2026', due: 'Jul 9, 2026', buyer: 'Arthit Tantiwong', sub: 'arthit.t@gmail.com', ev: 'Sunrise Yoga Retreat', amt: 1780 },
  { no: '#INV-2023', ref: 'ORD-88032', issued: 'Jun 23, 2026', due: 'Jul 7, 2026', buyer: 'Sukhumvit Design Studio', sub: 'hello@sukhumvitdesign.co', ev: 'UX Bangkok Meetup', amt: 9600, st: 'Paid', paidVia: 'Bank transfer', paidOn: 'Jul 2, 2026' },
  { no: '#INV-2022', ref: 'ORD-88021', issued: 'Jun 21, 2026', due: 'Jul 5, 2026', buyer: 'Kanya Intharat', sub: 'kanya.i@gmail.com', ev: 'Thai Street Food Festival', amt: 1300, st: 'Paid', paidVia: 'Card', paidOn: 'Jun 22, 2026' },
  { no: '#INV-2021', ref: 'ORD-88015', issued: 'Jun 19, 2026', due: 'Jul 3, 2026', buyer: 'Chalerm Mekwattana', sub: 'chalerm.m@gmail.com', ev: 'Thai Street Food Festival', amt: 650, st: 'Void' },
  { no: '#INV-2020', ref: 'ORD-88006', issued: 'Jun 17, 2026', due: 'Jul 1, 2026', buyer: 'Orawan Wisetsuk', sub: 'orawan.w@outlook.com', ev: 'UX Bangkok Meetup', amt: 480 },
  { no: '#INV-2019', ref: 'ORD-87994', issued: 'Jun 15, 2026', due: 'Jun 29, 2026', buyer: 'Bangkok Jazz Society', sub: 'treasurer@bkkjazz.org', ev: 'Bangkok Jazz Night', amt: 14400 },
  { no: '#INV-2018', ref: 'ORD-87982', issued: 'Jun 12, 2026', due: 'Jun 26, 2026', buyer: 'Jun Nakamura', sub: 'jun.nakamura@gmail.com', ev: 'Bangkok Jazz Night', amt: 480, st: 'Paid', paidVia: 'PromptPay', paidOn: 'Jun 12, 2026' },
]

/** Single source of truth for an invoice's state. */
export function statusOf(iv: Invoice): InvoiceStatus {
  return iv.st ?? (daysFromToday(iv.due) < 0 ? 'Overdue' : 'Issued')
}

/** The whole dataset is 2026 — drop the redundant year on cell dates. */
export function shortD(s: string): string {
  const y = ', ' + TODAY.getFullYear()
  return s.endsWith(y) ? s.slice(0, -y.length) : s
}

/* Ageing that sits inline next to the due date — only meaningful while a bill
   is still outstanding. Terse ("in 9 days") because it renders beside the date. */
export function ageText(iv: Invoice): string {
  const st = statusOf(iv)
  if (st === 'Paid' || st === 'Void') return ''
  const d = daysFromToday(iv.due)
  if (d < 0) return Math.abs(d) + (Math.abs(d) === 1 ? ' day overdue' : ' days overdue')
  if (d === 0) return 'due today'
  return 'in ' + d + (d === 1 ? ' day' : ' days')
}

/* How the bill was settled — the bit Payments can't show you. */
export function payText(iv: Invoice): string {
  const st = statusOf(iv)
  if (st === 'Paid') return iv.paidVia + ' · ' + shortD(iv.paidOn ?? '')
  if (st === 'Void') return 'Voided'
  return 'Awaiting payment'
}

export function fmtBaht(n: number): string {
  return '฿' + n.toLocaleString('en-US')
}
