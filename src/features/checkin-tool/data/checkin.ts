/* Demo data for the Check-in tool, ported verbatim from the inline <script> in
   admin/check-in-tool.html. Per-event stats, the "Simulate scan" outcome queues,
   the five scan-result presets, the live feed seed, and the manual-search
   attendee list. */

export type BadgeClass = 'badge-green' | 'badge-blue' | 'badge-purple' | 'badge-gray'

export type ScanState = 'ok' | 'dupe' | 'invalid' | 'wrong' | 'void'

/** One entry in a "Simulate scan" queue / a decoded outcome. Only `state` is
 *  always present; the rest depend on the outcome kind. */
export type ScanOutcome = {
  state: ScanState
  name?: string
  ini?: string
  ticket?: string
  badge?: BadgeClass
  ref?: string
  at?: string
  otherEvent?: string
  on?: string
  note?: string
}

export type EventStats = { checked: number; total: number; onsite: number; late: number }

export type EventMeta = { name: string; date: string; status: string; dot: string }

export type Attendee = {
  name: string
  ini: string
  ticket: string
  badge: BadgeClass
  email: string
  checkedIn: boolean
}

export type FeedEntry = { name: string; ini: string; ticket: string; badge: BadgeClass; time: string }

/** The payload a check-in produces for the live feed + counter. */
export type FeedInput = { name: string; ini: string; ticket: string; badge: BadgeClass }

export type ResultDef = { bg: string; icon: string; title: string; hold: number }

/** The five events this station can bind to (the header's event picker). */
export const EVENTS = [
  'Tech Summit 2026',
  'Bangkok Jazz Night',
  'Sunrise Yoga Retreat',
  'Thai Street Food Festival',
  'UX Bangkok Meetup',
] as const

/** name → {date, status, dot} — the header meta, from EventaEventMeta / the
 *  shared event catalog in shell.js. */
export const EVENT_META: Record<string, EventMeta> = {
  'Tech Summit 2026': { name: 'Tech Summit 2026', date: 'Jul 18, 2026', status: 'Live', dot: 'bg-brand' },
  'Bangkok Jazz Night': { name: 'Bangkok Jazz Night', date: 'Jul 12, 2026', status: 'Live', dot: 'bg-brand' },
  'Sunrise Yoga Retreat': { name: 'Sunrise Yoga Retreat', date: 'Sep 11, 2026', status: 'Upcoming', dot: 'bg-blue-500' },
  'Thai Street Food Festival': { name: 'Thai Street Food Festival', date: 'Aug 3, 2026', status: 'Upcoming', dot: 'bg-blue-500' },
  'UX Bangkok Meetup': { name: 'UX Bangkok Meetup', date: 'Aug 20, 2026', status: 'Upcoming', dot: 'bg-blue-500' },
}

/** Per-event check-in stats. */
export const STATS: Record<string, EventStats> = {
  'Tech Summit 2026': { checked: 268, total: 312, onsite: 245, late: 9 },
  'Bangkok Jazz Night': { checked: 402, total: 480, onsite: 388, late: 12 },
  'Sunrise Yoga Retreat': { checked: 54, total: 60, onsite: 50, late: 2 },
  'Thai Street Food Festival': { checked: 1120, total: 1400, onsite: 980, late: 24 },
  'UX Bangkok Meetup': { checked: 88, total: 96, onsite: 72, late: 3 },
}

/* ---- demo scan outcomes ("Simulate scan" cycles through every state) ---- */
export const QUEUES: Record<string, ScanOutcome[]> = {
  'Tech Summit 2026': [
    { state: 'ok', name: 'Anong P.', ini: 'AP', ticket: 'General Admission', badge: 'badge-green' },
    { state: 'dupe', name: 'Somchai T.', ini: 'ST', ticket: 'VIP', badge: 'badge-purple', at: '09:12' },
    { state: 'invalid', ref: 'X8F2-QZ71-KK' },
    { state: 'wrong', name: 'Chai W.', ini: 'CW', ticket: 'General Admission', badge: 'badge-blue', otherEvent: 'Bangkok Jazz Night' },
    { state: 'ok', name: 'Wipada S.', ini: 'WS', ticket: 'Early Bird', badge: 'badge-blue' },
    { state: 'void', name: 'Nattapong K.', ini: 'NK', ticket: 'VIP', badge: 'badge-gray', on: '08 Jul' },
  ],
}

export const DEFAULT_QUEUE: ScanOutcome[] = [
  { state: 'ok', name: 'Guest A.', ini: 'GA', ticket: 'General Admission', badge: 'badge-green' },
  { state: 'dupe', name: 'Guest B.', ini: 'GB', ticket: 'VIP', badge: 'badge-purple', at: '10:04' },
  { state: 'invalid', ref: 'A1B2-C3D4-E5' },
  { state: 'ok', name: 'Guest C.', ini: 'GC', ticket: 'Early Bird', badge: 'badge-blue' },
  { state: 'void', name: 'Guest D.', ini: 'GD', ticket: 'Student', badge: 'badge-gray', on: '05 Jul' },
]

/* ---- scan result overlay presets (five outcomes) ---- */
export const RESULTS: Record<ScanState, ResultDef> = {
  ok: { bg: 'bg-brand', icon: 'hgi-checkmark-circle-02', title: 'Checked in', hold: 2400 },
  dupe: { bg: 'bg-amber-500', icon: 'hgi-alert-02', title: 'Already checked in', hold: 3200 },
  invalid: { bg: 'bg-red-500', icon: 'hgi-cancel-circle', title: 'Invalid ticket', hold: 3400 },
  wrong: { bg: 'bg-orange-500', icon: 'hgi-calendar-block-01', title: 'Wrong event', hold: 3400 },
  void: { bg: 'bg-slate-600', icon: 'hgi-blocked', title: 'Ticket cancelled', hold: 3400 },
}

/** Seed rows for the "Just checked in" live feed. */
export const INITIAL_FEED: FeedEntry[] = [
  { name: 'Ploy S.', ini: 'PS', ticket: 'VIP', badge: 'badge-purple', time: 'just now' },
  { name: 'James W.', ini: 'JW', ticket: 'General Admission', badge: 'badge-green', time: '1 min ago' },
  { name: 'Mei L.', ini: 'ML', ticket: 'Early Bird', badge: 'badge-blue', time: '3 min ago' },
  { name: 'Nattapong K.', ini: 'NK', ticket: 'General Admission', badge: 'badge-green', time: '4 min ago' },
  { name: 'David S.', ini: 'DS', ticket: 'VIP', badge: 'badge-purple', time: '8 min ago' },
]

/* first 5 records are the original static rows, verbatim; the rest fill out the list */
export const ATTENDEES: Attendee[] = [
  { name: 'Anong P.', ini: 'AP', ticket: 'General Admission', badge: 'badge-green', email: 'anong.p@email.com', checkedIn: false },
  { name: 'Somchai T.', ini: 'ST', ticket: 'VIP', badge: 'badge-purple', email: 'somchai.t@email.com', checkedIn: true },
  { name: 'Wipada S.', ini: 'WS', ticket: 'Early Bird', badge: 'badge-blue', email: 'wipada.s@email.com', checkedIn: false },
  { name: 'Nattapong K.', ini: 'NK', ticket: 'General Admission', badge: 'badge-green', email: 'nattapong.k@email.com', checkedIn: false },
  { name: 'Kanya R.', ini: 'KR', ticket: 'Student', badge: 'badge-gray', email: 'kanya.r@email.com', checkedIn: false },
  { name: 'Ploy S.', ini: 'PS', ticket: 'VIP', badge: 'badge-purple', email: 'ploy.s@email.com', checkedIn: true },
  { name: 'James W.', ini: 'JW', ticket: 'General Admission', badge: 'badge-green', email: 'james.w@email.com', checkedIn: true },
  { name: 'Mei L.', ini: 'ML', ticket: 'Early Bird', badge: 'badge-blue', email: 'mei.l@email.com', checkedIn: true },
  { name: 'David S.', ini: 'DS', ticket: 'VIP', badge: 'badge-purple', email: 'david.s@email.com', checkedIn: true },
  { name: 'Suda P.', ini: 'SP', ticket: 'General Admission', badge: 'badge-green', email: 'suda.p@email.com', checkedIn: false },
  { name: 'Wichai T.', ini: 'WT', ticket: 'Student', badge: 'badge-gray', email: 'wichai.t@email.com', checkedIn: false },
  { name: 'Preeya N.', ini: 'PN', ticket: 'VIP', badge: 'badge-purple', email: 'preeya.n@email.com', checkedIn: false },
  { name: 'Rachel D.', ini: 'RD', ticket: 'General Admission', badge: 'badge-green', email: 'rachel.d@email.com', checkedIn: false },
  { name: 'Kevin C.', ini: 'KC', ticket: 'Early Bird', badge: 'badge-blue', email: 'kevin.c@email.com', checkedIn: false },
  { name: 'Malee B.', ini: 'MB', ticket: 'General Admission', badge: 'badge-green', email: 'malee.b@email.com', checkedIn: false },
  { name: 'Arthit I.', ini: 'AI', ticket: 'Student', badge: 'badge-gray', email: 'arthit.i@email.com', checkedIn: false },
  { name: 'Grace H.', ini: 'GH', ticket: 'VIP', badge: 'badge-purple', email: 'grace.h@email.com', checkedIn: false },
  { name: 'Ravi K.', ini: 'RK', ticket: 'General Admission', badge: 'badge-green', email: 'ravi.k@email.com', checkedIn: false },
  { name: 'Siriporn W.', ini: 'SW', ticket: 'Early Bird', badge: 'badge-blue', email: 'siriporn.w@email.com', checkedIn: false },
  { name: 'Apinya C.', ini: 'AC', ticket: 'General Admission', badge: 'badge-green', email: 'apinya.c@email.com', checkedIn: false },
  { name: 'Tom H.', ini: 'TH', ticket: 'Student', badge: 'badge-gray', email: 'tom.h@email.com', checkedIn: false },
  { name: 'Kanokwan S.', ini: 'KS', ticket: 'VIP', badge: 'badge-purple', email: 'kanokwan.s@email.com', checkedIn: false },
  { name: 'Lily P.', ini: 'LP', ticket: 'General Admission', badge: 'badge-green', email: 'lily.p@email.com', checkedIn: false },
  { name: 'Manop R.', ini: 'MR', ticket: 'Early Bird', badge: 'badge-blue', email: 'manop.r@email.com', checkedIn: false },
]
