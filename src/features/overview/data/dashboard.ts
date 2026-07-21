/* Demo data for admin/dashboard.html, ported verbatim from the page's inline
   script and markup — same rows, same amounts, same Thai Baht formatting. */

export type StatCard = {
  icon: string
  label: string
  value: string
  delta: string
  deltaIcon: string
  deltaColor: string
  /** Extra grid-span classes (only the fifth tile carries one). */
  span?: string
}

/** KPI stat tiles across the top of the dashboard. */
export const STAT_CARDS: StatCard[] = [
  {
    icon: 'hgi-user-add-01',
    label: 'Total registrations',
    value: '1,340',
    delta: '8,2 %',
    deltaIcon: 'hgi-arrow-up-right-01',
    deltaColor: 'text-brand',
  },
  {
    icon: 'hgi-ticket-01',
    label: 'Ticket revenue',
    value: '฿48.29k',
    delta: '12,5 %',
    deltaIcon: 'hgi-arrow-up-right-01',
    deltaColor: 'text-brand',
  },
  {
    icon: 'hgi-calendar-03',
    label: 'Upcoming events',
    value: '12',
    delta: '3 new',
    deltaIcon: 'hgi-arrow-up-right-01',
    deltaColor: 'text-brand',
  },
  {
    icon: 'hgi-checkmark-badge-01',
    label: 'Check-in rate',
    value: '87 %',
    delta: '1,4 %',
    deltaIcon: 'hgi-arrow-down-right-01',
    deltaColor: 'text-red-500',
  },
  {
    icon: 'hgi-chair-01',
    label: 'Capacity filled',
    value: '78 %',
    delta: '4,6 %',
    deltaIcon: 'hgi-arrow-up-right-01',
    deltaColor: 'text-brand',
    span: 'sm:col-span-2 xl:col-span-1',
  },
]

export type RevenueRange = 'week' | 'month' | 'year'

export type RevenueSeries = {
  labels: string[]
  values: number[]
  max: number
  value: string
  delta: string
  up: boolean
}

/** Revenue Overview datasets for the Week / Month / Year toggle. */
export const REVENUE: Record<RevenueRange, RevenueSeries> = {
  week: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [3.2, 4.1, 3.8, 5.0, 4.6, 6.2, 7.1],
    max: 8,
    value: '฿34.0k',
    delta: '6,4 %',
    up: true,
  },
  month: {
    labels: ['1', '5', '10', '15', '20', '25', '30'],
    values: [9, 11, 10, 13, 12, 15, 17],
    max: 20,
    value: '฿41.2k',
    delta: '9,1 %',
    up: true,
  },
  year: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [28, 29, 28, 30, 38, 35, 34, 40, 44, 43, 40, 52],
    max: 60,
    value: '฿48.29k',
    delta: '12,5 %',
    up: true,
  },
}

/** Registrations-by-ticket-type donut segments + legend. */
export const TICKET_TYPES = [
  { name: 'General Admission', pct: 42, regs: 563, color: '#1ba770' },
  { name: 'VIP', pct: 24, regs: 322, color: '#4cbd96' },
  { name: 'Early Bird', pct: 18, regs: 241, color: '#9fe0cd' },
  { name: 'Student', pct: 16, regs: 214, color: '#d1d5db' },
] as const

export type TicketType = (typeof TICKET_TYPES)[number]

/** Tickets Selling Fast list. `border` is false on the first (top) row. */
export const SELLING_FAST = [
  {
    icon: 'hgi-mic-01',
    iconClass: 'bg-amber-50 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300',
    name: 'Tech Summit 2026',
    meta: 'Jul 18 · BITEC',
    left: '8 left',
    leftColor: 'text-amber-500',
    border: false,
  },
  {
    icon: 'hgi-ticket-star',
    iconClass: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
    name: 'Bangkok Jazz Night',
    meta: 'Jul 12 · Sala Daeng',
    left: '3 left',
    leftColor: 'text-red-500',
    border: true,
  },
  {
    icon: 'hgi-calendar-03',
    iconClass: 'bg-brand-soft text-brand',
    name: 'Sunrise Yoga Retreat',
    meta: 'Jul 20 · Lumphini',
    left: '12 left',
    leftColor: 'text-muted',
    border: true,
  },
] as const

export type SellingFast = (typeof SELLING_FAST)[number]

export type RegistrationStatus = 'Paid' | 'Pending' | 'Refunded'

/** Status → badge tint, ported from the inline `badge` map. */
export const STATUS_BADGE: Record<RegistrationStatus, string> = {
  Paid: 'bg-brand-soft text-brand-dark dark:text-brand',
  Pending: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  Refunded: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

/** Recent Registrations table rows. */
export const RECENT_REGISTRATIONS: {
  initials: string
  name: string
  event: string
  amount: string
  status: RegistrationStatus
  time: string
}[] = [
  { initials: 'AP', name: 'Anong P.', event: 'Tech Summit 2026', amount: '฿1,250', status: 'Paid', time: '10:24' },
  { initials: 'ST', name: 'Somchai T.', event: 'Bangkok Jazz Night', amount: '฿480', status: 'Paid', time: '10:02' },
  { initials: 'WI', name: 'Walk-in', event: 'Sunrise Yoga Retreat', amount: '฿890', status: 'Pending', time: '09:47' },
  { initials: 'PS', name: 'Ploy S.', event: 'Tech Summit 2026', amount: '฿1,250', status: 'Paid', time: '09:31' },
  { initials: 'JW', name: 'James W.', event: 'Bangkok Jazz Night', amount: '฿480', status: 'Refunded', time: '09:15' },
]
