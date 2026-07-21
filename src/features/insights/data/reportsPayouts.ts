/* Bank-settlement history for the Reports · Payouts sub-page.
   Ported verbatim from the inline script in admin/reports-payouts.html.
   Mock data. */

export type ReportPayoutStatus = 'Paid' | 'In transit' | 'Pending'

export type ReportPayout = {
  ref: string
  date: string
  bank: string
  covered: string
  amount: number
  status: ReportPayoutStatus
  /** Event this payout is attributed to for the event-picker filter. */
  event: string
}

export const REPORT_PAYOUTS: ReportPayout[] = [
  { ref: 'PO-2043', date: 'Jul 15, 2026', bank: '•••• 6042 · Bangkok Bank', covered: '3 events', amount: 342000, status: 'Paid', event: 'All events' },
  { ref: 'PO-2042', date: 'Jul 12, 2026', bank: '•••• 6042 · Bangkok Bank', covered: 'Tech Summit 2026', amount: 418500, status: 'In transit', event: 'Tech Summit 2026' },
  { ref: 'PO-2041', date: 'Jul 10, 2026', bank: '•••• 3318 · Kasikorn Bank', covered: 'Bangkok Jazz Night', amount: 128640, status: 'Paid', event: 'Bangkok Jazz Night' },
  { ref: 'PO-2040', date: 'Jul 8, 2026', bank: '•••• 6042 · Bangkok Bank', covered: '2 events', amount: 256300, status: 'Paid', event: 'All events' },
  { ref: 'PO-2039', date: 'Jul 5, 2026', bank: '•••• 9075 · SCB', covered: 'Sunrise Yoga Retreat', amount: 178890, status: 'Pending', event: 'Sunrise Yoga Retreat' },
  { ref: 'PO-2038', date: 'Jul 3, 2026', bank: '•••• 6042 · Bangkok Bank', covered: '4 events', amount: 391200, status: 'Paid', event: 'All events' },
  { ref: 'PO-2037', date: 'Jun 30, 2026', bank: '•••• 3318 · Kasikorn Bank', covered: 'Thai Street Food Festival', amount: 162700, status: 'Paid', event: 'Thai Street Food Festival' },
  { ref: 'PO-2036', date: 'Jun 27, 2026', bank: '•••• 6042 · Bangkok Bank', covered: 'UX Bangkok Meetup', amount: 142000, status: 'In transit', event: 'UX Bangkok Meetup' },
  { ref: 'PO-2035', date: 'Jun 24, 2026', bank: '•••• 4420 · Krungthai', covered: '3 events', amount: 305400, status: 'Paid', event: 'All events' },
  { ref: 'PO-2034', date: 'Jun 20, 2026', bank: '•••• 6042 · Bangkok Bank', covered: 'Tech Summit 2026', amount: 224800, status: 'Paid', event: 'Tech Summit 2026' },
  { ref: 'PO-2033', date: 'Jun 17, 2026', bank: '•••• 9075 · SCB', covered: '2 events', amount: 198600, status: 'Pending', event: 'All events' },
  { ref: 'PO-2032', date: 'Jun 14, 2026', bank: '•••• 6042 · Bangkok Bank', covered: 'Bangkok Jazz Night', amount: 136500, status: 'Paid', event: 'Bangkok Jazz Night' },
  { ref: 'PO-2031', date: 'Jun 11, 2026', bank: '•••• 3318 · Kasikorn Bank', covered: '5 events', amount: 376900, status: 'Paid', event: 'All events' },
  { ref: 'PO-2030', date: 'Jun 8, 2026', bank: '•••• 6042 · Bangkok Bank', covered: 'Sunrise Yoga Retreat', amount: 165300, status: 'In transit', event: 'Sunrise Yoga Retreat' },
  { ref: 'PO-2029', date: 'Jun 4, 2026', bank: '•••• 4420 · Krungthai', covered: 'Thai Street Food Festival', amount: 152400, status: 'Paid', event: 'Thai Street Food Festival' },
  { ref: 'PO-2028', date: 'Jun 1, 2026', bank: '•••• 6042 · Bangkok Bank', covered: '3 events', amount: 288700, status: 'Paid', event: 'All events' },
]

/** Badge class per payout status, matching the static kit's BADGE map. */
export const REPORT_PAYOUT_BADGE: Record<ReportPayoutStatus, string> = {
  Paid: 'badge-green',
  'In transit': 'badge-blue',
  Pending: 'badge-amber',
}
