/* Demo data for the Reports & Analytics overview (admin/reports.html):
   stat cards, the range-switched revenue trend datasets, the ticket-type donut,
   and the two share-bar lists. Ported verbatim from the page's inline scripts. */

export type RtRange = '7d' | '30d' | '90d' | 'year'

export type RevenueDataset = {
  labels: string[]
  values: number[]
  max: number
  value: string
  delta: string
  up: boolean
}

/** Revenue trend series, one per date range — mirrors the dashboard technique. */
export const REVENUE_DATASETS: Record<RtRange, RevenueDataset> = {
  '7d': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [22, 28, 25, 31, 35, 40, 26],
    max: 45,
    value: '฿207k',
    delta: '4,8 %',
    up: true,
  },
  '30d': {
    labels: ['1', '5', '10', '15', '20', '25', '30'],
    values: [95, 100, 98, 110, 108, 115, 116],
    max: 130,
    value: '฿742k',
    delta: '9,1 %',
    up: true,
  },
  '90d': {
    labels: ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6'],
    values: [280, 310, 295, 340, 360, 395],
    max: 450,
    value: '฿1.98M',
    delta: '15,2 %',
    up: true,
  },
  year: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [210, 225, 205, 250, 275, 260, 290, 350, 370, 360, 340, 325],
    max: 400,
    value: '฿3.46M',
    delta: '12,5 %',
    up: true,
  },
}

/** Range pill-tab options, left of the export buttons. */
export const RANGE_TABS: { value: RtRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'year', label: 'Year' },
]

export type StatCard = {
  icon: string
  label: string
  value: string
  delta: string
  /** true → text-brand, false → text-red-500. */
  positive: boolean
  /** true → arrow-down-right icon, false → arrow-up-right. */
  down: boolean
  /** Only the refund card spans two columns on the sm grid. */
  wide?: boolean
}

export const STAT_CARDS: StatCard[] = [
  { icon: 'hgi-wallet-01', label: 'Revenue', value: '฿3.46M', delta: '12,5 %', positive: true, down: false },
  { icon: 'hgi-user-add-01', label: 'Registrations', value: '1,340', delta: '8,2 %', positive: true, down: false },
  { icon: 'hgi-checkmark-badge-01', label: 'Attendance rate', value: '79 %', delta: '1,4 %', positive: false, down: true },
  { icon: 'hgi-ticket-01', label: 'Avg ticket', value: '฿821', delta: '3 %', positive: true, down: false },
  { icon: 'hgi-delivery-return-01', label: 'Refund rate', value: '2,7 %', delta: '0,4 %', positive: true, down: true, wide: true },
]

export type TicketType = { name: string; pct: number; regs: number; color: string }

export const TICKET_TYPES: TicketType[] = [
  { name: 'General Admission', pct: 42, regs: 563, color: '#1ba770' },
  { name: 'VIP', pct: 24, regs: 322, color: '#4cbd96' },
  { name: 'Early Bird', pct: 18, regs: 241, color: '#9fe0cd' },
  { name: 'Student', pct: 16, regs: 214, color: '#d1d5db' },
]

export type EventBar = { name: string; width: number; regs: number }

/** "Registrations by event" — top 6 curated share bars (static in the source). */
export const REGISTRATIONS_BY_EVENT: EventBar[] = [
  { name: 'Tech Summit 2026', width: 100, regs: 412 },
  { name: 'Bangkok Jazz Night', width: 65, regs: 268 },
  { name: 'Sunrise Yoga Retreat', width: 49, regs: 201 },
  { name: 'Thai Street Food Festival', width: 43, regs: 178 },
  { name: 'UX Bangkok Meetup', width: 37, regs: 154 },
  { name: 'Startup Pitch Night', width: 31, regs: 127 },
]

export type ChannelBar = { name: string; pct: number }

/** "Sales by channel" — where registrations come from. */
export const SALES_BY_CHANNEL: ChannelBar[] = [
  { name: 'Website', pct: 62 },
  { name: 'Email', pct: 18 },
  { name: 'Social', pct: 12 },
  { name: 'Partner', pct: 8 },
]
