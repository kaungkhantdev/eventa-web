/* Demo data for the Event detail page (admin/event-detail.html). Ported
   verbatim from the inline <script>: registrations, attendees, speakers,
   the two-day agenda and the four ticket types, plus the shared tone maps. */

/** Avatar accent used across the registrations, attendees and speaker lists. */
export type AvatarTone = 'brand' | 'blue' | 'pink' | 'amber' | 'violet'

/** tone → avatar chip classes (light + dark). */
export const TONE: Record<AvatarTone, string> = {
  brand: 'bg-brand-soft text-brand-dark dark:text-brand',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
}

export type RegStatus = 'Paid' | 'Pending' | 'Refunded'

/** registration status → pill classes. */
export const REGSTATUS: Record<RegStatus, string> = {
  Paid: 'bg-brand-soft text-brand-dark dark:text-brand',
  Pending: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  Refunded: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

export type Registration = {
  name: string
  email: string
  ticket: string
  amount: string
  date: string
  status: RegStatus
  initials: string
  tone: AvatarTone
}

export const REGISTRATIONS: Registration[] = [
  { name: 'Anong Pattana', email: 'anong.p@email.com', ticket: 'VIP', amount: '฿3,500', date: 'Jul 2, 10:24', status: 'Paid', initials: 'AP', tone: 'brand' },
  { name: 'Somchai Thongchai', email: 'somchai.t@email.com', ticket: 'Standard', amount: '฿1,900', date: 'Jul 2, 10:02', status: 'Paid', initials: 'ST', tone: 'blue' },
  { name: 'Ploy Srisai', email: 'ploy.s@email.com', ticket: 'Early Bird', amount: '฿1,250', date: 'Jul 1, 09:47', status: 'Paid', initials: 'PS', tone: 'pink' },
  { name: 'James Wong', email: 'james.w@email.com', ticket: 'Early Bird', amount: '฿1,250', date: 'Jul 1, 09:31', status: 'Paid', initials: 'JW', tone: 'amber' },
  { name: 'Nadia Rahman', email: 'nadia.r@email.com', ticket: 'Standard', amount: '฿1,900', date: 'Jun 30, 16:12', status: 'Pending', initials: 'NR', tone: 'violet' },
  { name: 'David Chen', email: 'david.c@email.com', ticket: 'VIP', amount: '฿3,500', date: 'Jun 30, 14:05', status: 'Paid', initials: 'DC', tone: 'brand' },
  { name: 'Mia Thompson', email: 'mia.t@email.com', ticket: 'Student', amount: '฿650', date: 'Jun 29, 11:20', status: 'Refunded', initials: 'MT', tone: 'blue' },
  { name: 'Raj Patel', email: 'raj.p@email.com', ticket: 'Standard', amount: '฿1,900', date: 'Jun 28, 18:44', status: 'Paid', initials: 'RP', tone: 'pink' },
  { name: 'Grace Bennett', email: 'grace.b@email.com', ticket: 'Student', amount: '฿650', date: 'Jun 28, 15:33', status: 'Paid', initials: 'GB', tone: 'violet' },
  { name: 'Oliver Scott', email: 'oliver.s@email.com', ticket: 'Standard', amount: '฿1,900', date: 'Jun 27, 12:18', status: 'Paid', initials: 'OS', tone: 'amber' },
  { name: 'Kanya Rattana', email: 'kanya.r@email.com', ticket: 'VIP', amount: '฿3,500', date: 'Jun 27, 09:52', status: 'Pending', initials: 'KR', tone: 'brand' },
  { name: 'Ethan Brooks', email: 'ethan.b@email.com', ticket: 'Early Bird', amount: '฿1,250', date: 'Jun 26, 17:41', status: 'Paid', initials: 'EB', tone: 'blue' },
  { name: 'Suda Kittisak', email: 'suda.k@email.com', ticket: 'Standard', amount: '฿1,900', date: 'Jun 26, 11:09', status: 'Paid', initials: 'SK', tone: 'pink' },
  { name: 'Liam Foster', email: 'liam.f@email.com', ticket: 'Standard', amount: '฿1,900', date: 'Jun 25, 14:26', status: 'Refunded', initials: 'LF', tone: 'amber' },
  { name: 'Preeya Nakamura', email: 'preeya.n@email.com', ticket: 'VIP', amount: '฿3,500', date: 'Jun 25, 10:03', status: 'Paid', initials: 'PN', tone: 'violet' },
  { name: 'Marcus Reed', email: 'marcus.r@email.com', ticket: 'Early Bird', amount: '฿1,250', date: 'Jun 24, 16:55', status: 'Paid', initials: 'MR', tone: 'brand' },
  { name: 'Wichai Phumipat', email: 'wichai.p@email.com', ticket: 'Standard', amount: '฿1,900', date: 'Jun 24, 09:12', status: 'Pending', initials: 'WP', tone: 'blue' },
  { name: 'Chloe Adams', email: 'chloe.a@email.com', ticket: 'Student', amount: '฿650', date: 'Jun 23, 13:47', status: 'Paid', initials: 'CA', tone: 'pink' },
  { name: 'Nattapong Sri', email: 'nattapong.s@email.com', ticket: 'VIP', amount: '฿3,500', date: 'Jun 23, 08:38', status: 'Paid', initials: 'NS', tone: 'amber' },
  { name: 'Isabella Cruz', email: 'isabella.c@email.com', ticket: 'Standard', amount: '฿1,900', date: 'Jun 22, 15:20', status: 'Paid', initials: 'IC', tone: 'violet' },
  { name: 'Arthit Wongsawat', email: 'arthit.w@email.com', ticket: 'Early Bird', amount: '฿1,250', date: 'Jun 22, 10:44', status: 'Refunded', initials: 'AW', tone: 'brand' },
  { name: 'Sophie Turner', email: 'sophie.t@email.com', ticket: 'Standard', amount: '฿1,900', date: 'Jun 21, 12:01', status: 'Paid', initials: 'ST', tone: 'blue' },
]

/** Registration filter tabs, in source order. */
export const REG_FILTERS = ['all', 'Paid', 'Pending', 'Refunded'] as const
export type RegFilter = (typeof REG_FILTERS)[number]

export type Attendee = {
  name: string
  email: string
  company: string
  role: string
  ticket: string
  initials: string
  tone: AvatarTone
}

export const ATTENDEES: Attendee[] = [
  { name: 'Anong Pattana', email: 'anong.p@email.com', company: 'Nimbus AI', role: 'Head of AI', ticket: 'VIP', initials: 'AP', tone: 'brand' },
  { name: 'Somchai Thongchai', email: 'somchai.t@email.com', company: 'Fintech Labs', role: 'Engineer', ticket: 'Standard', initials: 'ST', tone: 'blue' },
  { name: 'Ploy Srisai', email: 'ploy.s@email.com', company: 'Skylark', role: 'Product Manager', ticket: 'Early Bird', initials: 'PS', tone: 'pink' },
  { name: 'James Wong', email: 'james.w@email.com', company: 'DevHouse', role: 'Founder', ticket: 'Early Bird', initials: 'JW', tone: 'amber' },
  { name: 'David Chen', email: 'david.c@email.com', company: 'Canvas', role: 'Design Lead', ticket: 'VIP', initials: 'DC', tone: 'brand' },
  { name: 'Raj Patel', email: 'raj.p@email.com', company: 'Nomad', role: 'Data Scientist', ticket: 'Standard', initials: 'RP', tone: 'pink' },
  { name: 'Grace Bennett', email: 'grace.b@email.com', company: 'Golden Co', role: 'Marketing', ticket: 'Student', initials: 'GB', tone: 'violet' },
  { name: 'Oliver Scott', email: 'oliver.s@email.com', company: 'Memoria', role: 'Developer', ticket: 'Standard', initials: 'OS', tone: 'amber' },
]

export type Speaker = {
  name: string
  role: string
  talk: string
  tag: string
  initials: string
  tone: AvatarTone
}

export const SPEAKERS: Speaker[] = [
  { name: 'Dr. Anna Wong', role: 'Head of AI, Nimbus', talk: 'The State of AI in Southeast Asia', tag: 'Keynote', initials: 'AW', tone: 'brand' },
  { name: 'Raj Patel', role: 'CTO, Fintech Labs', talk: 'Scaling Payments to Millions', tag: 'Track A', initials: 'RP', tone: 'blue' },
  { name: 'Mei Lin', role: 'VP Product, Skylark', talk: 'Product-led Growth in APAC', tag: 'Track B', initials: 'ML', tone: 'pink' },
  { name: 'Tom Becker', role: 'Founder, DevHouse', talk: 'Building Developer Communities', tag: 'Track A', initials: 'TB', tone: 'amber' },
  { name: 'Priya Sharma', role: 'Design Lead, Canvas', talk: 'Design Systems at Scale', tag: 'Track B', initials: 'PS', tone: 'violet' },
  { name: 'Ken Tanaka', role: 'Data Scientist, Nomad', talk: 'Machine Learning in Production', tag: 'Workshop', initials: 'KT', tone: 'brand' },
]

export type SessionType = 'Keynote' | 'Talk' | 'Workshop' | 'Panel' | 'Break'

/** session type → tone key into TONE. */
export const SESSION_TONE: Record<SessionType, AvatarTone> = {
  Keynote: 'brand',
  Talk: 'blue',
  Workshop: 'violet',
  Panel: 'amber',
  Break: 'brand',
}

export type Session = {
  time: string
  dur: string
  title: string
  type: SessionType
  who: string
  room: string
}

export type AgendaDay = {
  day: string
  sessions: Session[]
}

export const INITIAL_AGENDA: AgendaDay[] = [
  {
    day: 'Day 1 · Sat, Jul 18',
    sessions: [
      { time: '09:00', dur: '45m', title: 'Opening Keynote: Building Tomorrow', type: 'Keynote', who: 'Dr. Anna Wong', room: 'Hall A' },
      { time: '10:00', dur: '45m', title: 'Scaling Payments to Millions', type: 'Talk', who: 'Raj Patel', room: 'Hall A' },
      { time: '11:00', dur: '75m', title: 'Design Systems at Scale', type: 'Workshop', who: 'Priya Sharma', room: 'Hall B' },
      { time: '13:00', dur: '45m', title: 'The Future of Hybrid Events in SEA', type: 'Panel', who: 'Mei Lin +2', room: 'Hall A' },
    ],
  },
  {
    day: 'Day 2 · Sun, Jul 19',
    sessions: [
      { time: '09:30', dur: '45m', title: 'Product-led Growth in APAC', type: 'Keynote', who: 'Mei Lin', room: 'Hall A' },
      { time: '10:30', dur: '45m', title: 'Machine Learning in Production', type: 'Talk', who: 'Ken Tanaka', room: 'Hall A' },
      { time: '11:30', dur: '60m', title: 'Building Developer Communities', type: 'Workshop', who: 'Tom Becker', room: 'Hall B' },
      { time: '13:00', dur: '30m', title: 'Closing Remarks & Thank You', type: 'Talk', who: 'Dr. Anna Wong', room: 'Hall A' },
    ],
  },
]

export type EventTicket = {
  name: string
  price: string
  sold: number
  total: number
  revenue: string
  featured: boolean
}

export const INITIAL_TICKETS: EventTicket[] = [
  { name: 'Early Bird', price: '฿1,250', sold: 180, total: 200, revenue: '฿225k', featured: false },
  { name: 'Standard', price: '฿1,900', sold: 95, total: 150, revenue: '฿180.5k', featured: true },
  { name: 'VIP', price: '฿3,500', sold: 28, total: 40, revenue: '฿98k', featured: false },
  { name: 'Student', price: '฿650', sold: 9, total: 60, revenue: '฿5.9k', featured: false },
]

/** Constant event meta used by the share modal + flyer poster. */
export const EVT = {
  title: 'Tech Summit 2026',
  seed: 'tech-summit-2026',
  mon: 'JUL',
  day: '18',
  dateLine: 'Sat–Sun · Jul 18–19, 2026',
  loc: 'BITEC, Bangkok',
  url: 'eventa.co/e/tech-summit-2026',
} as const
