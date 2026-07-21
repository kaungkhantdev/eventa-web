/* Payouts demo data — ported verbatim from admin/payouts.html.
   20 rows, Thai Baht amounts, four statuses. Every payout is to the same
   Stripe-connected bank account (SCB •••• 4821). */

export type PayoutStatus = 'Paid' | 'Processing' | 'Scheduled' | 'Failed'

export type Payout = {
  id: string
  amount: number
  bank: string
  status: PayoutStatus
  requested: string
  completed: string
}

const po = (
  id: string,
  amount: number,
  status: PayoutStatus,
  requested: string,
  completed: string,
): Payout => ({ id, amount, bank: 'SCB •••• 4821', status, requested, completed })

export const PAYOUTS: Payout[] = [
  po('#PO-2043', 850000, 'Paid', 'Jul 01, 2026', 'Jul 03, 2026'),
  po('#PO-2042', 120000, 'Processing', 'Jul 07, 2026', '—'),
  po('#PO-2041', 640500, 'Paid', 'Jun 24, 2026', 'Jun 26, 2026'),
  po('#PO-2040', 95000, 'Scheduled', 'Jul 09, 2026', '—'),
  po('#PO-2039', 1240000, 'Paid', 'Jun 15, 2026', 'Jun 17, 2026'),
  po('#PO-2038', 310000, 'Failed', 'Jun 10, 2026', '—'),
  po('#PO-2037', 480000, 'Paid', 'Jun 03, 2026', 'Jun 05, 2026'),
  po('#PO-2036', 2100000, 'Paid', 'May 28, 2026', 'May 30, 2026'),
  po('#PO-2035', 560000, 'Paid', 'May 20, 2026', 'May 22, 2026'),
  po('#PO-2034', 180000, 'Paid', 'May 14, 2026', 'May 16, 2026'),
  po('#PO-2033', 920000, 'Paid', 'May 06, 2026', 'May 08, 2026'),
  po('#PO-2032', 75000, 'Failed', 'Apr 29, 2026', '—'),
  po('#PO-2031', 1450000, 'Paid', 'Apr 21, 2026', 'Apr 23, 2026'),
  po('#PO-2030', 320000, 'Paid', 'Apr 12, 2026', 'Apr 14, 2026'),
  po('#PO-2029', 240000, 'Paid', 'Apr 03, 2026', 'Apr 05, 2026'),
  po('#PO-2028', 1780000, 'Paid', 'Mar 25, 2026', 'Mar 27, 2026'),
  po('#PO-2027', 150000, 'Paid', 'Mar 17, 2026', 'Mar 19, 2026'),
  po('#PO-2026', 890000, 'Paid', 'Mar 08, 2026', 'Mar 10, 2026'),
  po('#PO-2025', 410000, 'Paid', 'Feb 27, 2026', 'Mar 01, 2026'),
  po('#PO-2024', 1120000, 'Paid', 'Feb 18, 2026', 'Feb 20, 2026'),
]

/** Badge tone class per status, from the source `statusBadge` map. */
export const PAYOUT_STATUS_BADGE: Record<PayoutStatus, string> = {
  Paid: 'badge-green',
  Processing: 'badge-blue',
  Scheduled: 'badge-amber',
  Failed: 'badge-red',
}

export type PayoutTab = 'all' | 'paid' | 'processing' | 'scheduled' | 'failed'

/** Pill-tab value -> the status it filters on. */
export const PAYOUT_TAB_STATUS: Record<Exclude<PayoutTab, 'all'>, PayoutStatus> = {
  paid: 'Paid',
  processing: 'Processing',
  scheduled: 'Scheduled',
  failed: 'Failed',
}

/** Explainer note shown in the payout detail slide-over, per status. */
export const PAYOUT_NOTE: Record<PayoutStatus, string> = {
  Paid: 'This payout was completed and deposited to your bank account.',
  Processing: 'This payout is being processed and should arrive within 1–3 business days.',
  Scheduled: 'This payout is scheduled and will be initiated on the requested date.',
  Failed: 'This payout failed — please verify your bank details and try again.',
}
