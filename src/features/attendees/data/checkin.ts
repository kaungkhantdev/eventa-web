/* Check-in demo data — ported verbatim from admin/check-in.html.
   29 attendees with per-row avatar tones. `in` / `time` are mutated live as
   staff check people in and undo. */

export type CheckinTone = 'brand' | 'blue' | 'pink' | 'amber' | 'violet' | 'gray'

export type CheckinAttendee = {
  name: string
  email: string
  ini: string
  tone: CheckinTone
  ticket: string
  in: boolean
  time: string
}

/** Avatar chip tone classes, from the source TONE map. */
export const TONE: Record<CheckinTone, string> = {
  brand: 'bg-brand-soft text-brand-dark dark:text-brand',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  gray: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

export const CHECKIN_ATTENDEES: CheckinAttendee[] = [
  { name: 'Anong Pattana', email: 'anong.p@email.com', ini: 'AP', tone: 'brand', ticket: 'VIP', in: true, time: '09:08' },
  { name: 'Somchai Thongchai', email: 'somchai.t@email.com', ini: 'ST', tone: 'blue', ticket: 'General Admission', in: true, time: '09:12' },
  { name: 'Ploy Srisai', email: 'ploy.s@email.com', ini: 'PS', tone: 'pink', ticket: 'Early Bird', in: true, time: '09:15' },
  { name: 'James Wong', email: 'james.w@email.com', ini: 'JW', tone: 'amber', ticket: 'General Admission', in: true, time: '09:21' },
  { name: 'Mei Lin', email: 'mei.l@email.com', ini: 'ML', tone: 'violet', ticket: 'Early Bird', in: true, time: '09:34' },
  { name: 'Nattapong K.', email: 'nattapong.k@email.com', ini: 'NK', tone: 'brand', ticket: 'General Admission', in: true, time: '09:47' },
  { name: 'David Chen', email: 'david.c@email.com', ini: 'DC', tone: 'blue', ticket: 'VIP', in: true, time: '10:02' },
  { name: 'Kanya R.', email: 'kanya.r@email.com', ini: 'KR', tone: 'gray', ticket: 'Student', in: false, time: '' },
  { name: 'Wipada Srisuk', email: 'wipada.s@email.com', ini: 'WS', tone: 'pink', ticket: 'Early Bird', in: false, time: '' },
  { name: 'Raj Patel', email: 'raj.p@email.com', ini: 'RP', tone: 'amber', ticket: 'General Admission', in: false, time: '' },
  { name: 'Grace Bennett', email: 'grace.b@email.com', ini: 'GB', tone: 'violet', ticket: 'Student', in: false, time: '' },
  { name: 'Oliver Scott', email: 'oliver.s@email.com', ini: 'OS', tone: 'brand', ticket: 'VIP', in: false, time: '' },
  { name: 'Suda Wongsawat', email: 'suda.w@email.com', ini: 'SW', tone: 'blue', ticket: 'General Admission', in: true, time: '10:11' },
  { name: 'Preeya Charoen', email: 'preeya.c@email.com', ini: 'PC', tone: 'pink', ticket: 'Early Bird', in: true, time: '10:19' },
  { name: 'Marcus Reed', email: 'marcus.r@email.com', ini: 'MR', tone: 'amber', ticket: 'VIP', in: true, time: '10:26' },
  { name: 'Yuki Tanaka', email: 'yuki.t@email.com', ini: 'YT', tone: 'violet', ticket: 'General Admission', in: true, time: '10:33' },
  { name: 'Arthit Boonmee', email: 'arthit.b@email.com', ini: 'AB', tone: 'brand', ticket: 'Student', in: true, time: '10:41' },
  { name: 'Sofia Garcia', email: 'sofia.g@email.com', ini: 'SG', tone: 'blue', ticket: 'Early Bird', in: false, time: '' },
  { name: 'Kittisak Nakarin', email: 'kittisak.n@email.com', ini: 'KN', tone: 'gray', ticket: 'General Admission', in: false, time: '' },
  { name: 'Emma Davies', email: 'emma.d@email.com', ini: 'ED', tone: 'pink', ticket: 'VIP', in: true, time: '10:52' },
  { name: 'Ravi Kumar', email: 'ravi.k@email.com', ini: 'RK', tone: 'amber', ticket: 'General Admission', in: false, time: '' },
  { name: 'Malee Intanon', email: 'malee.i@email.com', ini: 'MI', tone: 'violet', ticket: 'Early Bird', in: true, time: '11:04' },
  { name: 'Daniel Kim', email: 'daniel.k@email.com', ini: 'DK', tone: 'brand', ticket: 'Student', in: false, time: '' },
  { name: 'Wanida Thongchai', email: 'wanida.t@email.com', ini: 'WT', tone: 'blue', ticket: 'General Admission', in: true, time: '11:12' },
  { name: 'Lucas Silva', email: 'lucas.s@email.com', ini: 'LS', tone: 'pink', ticket: 'VIP', in: false, time: '' },
  { name: 'Apinya Saetang', email: 'apinya.s@email.com', ini: 'AS', tone: 'amber', ticket: 'Early Bird', in: true, time: '11:23' },
  { name: 'Olivia Harris', email: 'olivia.h@email.com', ini: 'OH', tone: 'violet', ticket: 'General Admission', in: false, time: '' },
  { name: 'Narong Phongam', email: 'narong.p@email.com', ini: 'NP', tone: 'brand', ticket: 'Student', in: true, time: '11:35' },
  { name: 'Aisha Khan', email: 'aisha.k@email.com', ini: 'AK', tone: 'gray', ticket: 'General Admission', in: false, time: '' },
]

export type CheckinFilter = 'all' | 'in' | 'notyet'

export const CHECKIN_EVENTS = [
  'Tech Summit 2026',
  'Bangkok Jazz Night',
  'Sunrise Yoga Retreat',
  'Thai Street Food Festival',
  'UX Bangkok Meetup',
] as const

export const CHECKIN_TICKETS = ['VIP', 'General Admission', 'Early Bird', 'Student'] as const
