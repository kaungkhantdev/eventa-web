/* Attendees demo data — ported verbatim from admin/attendees.html.
   3 seeded rows + 2844 deterministically generated = 2847 total. The generator
   uses an avalanche integer hash (no Math.random) so the tab-count badges land
   on their targets, exactly like the source. */

export type Attendee = {
  name: string
  email: string
  initials: string
  phone: string
  events: number
  tickets: number
  tag: string | null
  date: string
  ts: number
  isNew: boolean
  checkedIn: boolean
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(n: number, len: number): string {
  let s = String(n)
  while (s.length < len) s = '0' + s
  return s
}

const BASE = new Date(2026, 6, 16) // Jul 16, 2026
function dateFor(daysAgo: number): { str: string; ts: number } {
  const d = new Date(BASE.getTime())
  d.setDate(d.getDate() - daysAgo)
  return { str: MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(), ts: d.getTime() }
}

/* ---------- name / contact pools (deterministic, index-derived) ---------- */
const thaiFirst = ['Anong', 'Somchai', 'Ploy', 'Nattapong', 'Suda', 'Wichai', 'Preeya', 'Siriporn', 'Malee', 'Kanya', 'Arthit', 'Kanokwan', 'Suchada', 'Natthaphong', 'Apinya', 'Chalermchai', 'Duangkamol', 'Kittisak', 'Lawan', 'Manop', 'Narong', 'Orawan', 'Pichai', 'Rungnapa', 'Sakda', 'Tanapon', 'Wanida', 'Yupin', 'Chatchai', 'Busaba']
const thaiLast = ['Praditsarn', 'Tanakit', 'Suwannarat', 'Ratanakosin', 'Srisai', 'Boonmee', 'Charoen', 'Wongsawat', 'Chaiyaphon', 'Saetang', 'Intanon', 'Phongam', 'Rojanasakul', 'Thongchai', 'Sombat', 'Chaidee', 'Nakarin', 'Phromdit', 'Rattanaporn', 'Saengchan', 'Thanawat', 'Wattana', 'Sirikul', 'Aromdee', 'Bunnag', 'Kasemsan', 'Leelawat', 'Mongkut', 'Prasert', 'Yodsuwan']
const intlFirst = ['James', 'Mei', 'David', 'Rachel', 'Grace', 'Kevin', 'Emma', 'Tom', 'Ravi', 'Lily', 'Jun', 'Michael', 'Sarah', 'Daniel', 'Priya', 'Olivia', 'Liam', 'Sofia', 'Marcus', 'Aisha', 'Yuki', 'Omar', 'Elena', 'Lucas']
const intlLast = ['Whitfield', 'Lin', 'Okafor', 'Davies', 'Harris', 'Chen', 'Kumar', 'Nakamura', 'Kim', 'Park', 'Nguyen', 'Silva', 'Muller', 'Rossi', 'Cohen', 'Reyes', 'Santos', 'Khan', 'Wang', 'Lee', 'Garcia', 'Patel', 'Novak', 'Andersson']
const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'corpmail.com', 'proton.me']
const intlCodes = ['+1', '+44', '+65', '+81', '+61']

function initialsOf(name: string): string {
  const p = name.split(/\s+/)
  return ((p[0][0] || '') + (p[p.length - 1][0] || '')).toUpperCase()
}
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}
function emailFor(first: string, last: string, i: number): string {
  const f = slug(first)
  const l = slug(last)
  const dom = domains[i % domains.length]
  const style = i % 3
  if (style === 0) return f + '.' + l.charAt(0) + '@' + dom
  if (style === 1) return f + '.' + l + '@' + dom
  return f + '.' + l + (10 + (i % 89)) + '@' + dom
}
function phoneFor(isThai: boolean, i: number): string {
  if (isThai) return '+66 ' + (8 + (i % 2)) + (i % 10) + ' ' + pad((i * 13) % 1000, 3) + ' ' + pad((i * 29) % 10000, 4)
  return intlCodes[i % intlCodes.length] + ' ' + pad((i * 17) % 1000, 3) + ' ' + pad((i * 23) % 10000, 4)
}

// avalanche integer hash → well-mixed name/contact choices (deterministic)
function hash(n: number): number {
  n = n | 0
  n = Math.imul(n ^ (n >>> 16), 2246822507)
  n = Math.imul(n ^ (n >>> 13), 3266489909)
  n ^= n >>> 16
  return n >>> 0
}

function seed(
  name: string,
  email: string,
  phone: string,
  events: number,
  tickets: number,
  tag: string | null,
  daysAgo: number,
  isNew: boolean,
  checkedIn: boolean,
): Attendee {
  const dt = dateFor(daysAgo)
  return { name, email, initials: initialsOf(name), phone, events, tickets, tag, date: dt.str, ts: dt.ts, isNew, checkedIn }
}

/* ---------- build DATA: 3 seeded rows + 2844 generated = 2847 ---------- */
function buildAttendees(): Attendee[] {
  const data: Attendee[] = [
    seed('Anong Praditsarn', 'anong.p@gmail.com', '+66 81 234 5678', 5, 7, 'VIP', 1, false, true),
    seed('Somchai Tanakit', 'somchai.t@outlook.com', '+66 89 555 1023', 3, 3, null, 2, false, false),
    seed('Ploy Suwannarat', 'ploy.suwan@yahoo.com', '+66 92 345 6789', 8, 12, 'Speaker', 0, false, true),
  ]
  for (let i = 0; i < 2844; i++) {
    const h = hash(i + 1)
    const isThai = h % 100 < 72
    const first = isThai ? thaiFirst[(h >>> 3) % thaiFirst.length] : intlFirst[(h >>> 3) % intlFirst.length]
    const last = isThai ? thaiLast[(h >>> 11) % thaiLast.length] : intlLast[(h >>> 11) % intlLast.length]
    const name = first + ' ' + last
    // tag / isNew / checkedIn stay index-modulo so the tab-count badges hit their targets
    let tag: string | null = null
    if (i % 30 === 4) tag = 'VIP'
    else if (i % 19 === 6) tag = 'Speaker'
    else if (i % 23 === 9) tag = 'Sponsor'
    else if (i % 17 === 3) tag = 'Student'
    const dt = dateFor(4 + (h % 210))
    data.push({
      name,
      email: emailFor(first, last, i),
      initials: initialsOf(name),
      phone: phoneFor(isThai, i),
      events: 1 + ((h >>> 17) % 12),
      tickets: 1 + ((h >>> 22) % 15),
      tag,
      date: dt.str,
      ts: dt.ts,
      isNew: i % 13 === 2,
      checkedIn: i % 17 < 7,
    })
  }
  return data
}

export const ATTENDEES: Attendee[] = buildAttendees()

/** Badge class + icon + label per tag, from the source tagCell() map. */
export const TAG_BADGE: Record<string, { cls: string; icon: string; label: string }> = {
  VIP: { cls: 'badge-purple', icon: 'hgi-star', label: 'VIP' },
  Speaker: { cls: 'badge-amber', icon: 'hgi-mic-01', label: 'Speaker' },
  Sponsor: { cls: 'badge-blue', icon: 'hgi-building-06', label: 'Sponsor' },
  Student: { cls: 'badge-gray', icon: 'hgi-mortarboard-01', label: 'Student' },
}

export type AttendeeTab = 'all' | 'new' | 'checkedin' | 'vip'
export type AttendeeSort = 'activity' | 'name' | 'events' | 'tickets'

export const ATT_TAGS = ['All tags', 'VIP', 'Speaker', 'Sponsor', 'Student'] as const

export const ATT_EVENTS = [
  'Tech Summit 2026',
  'Bangkok Jazz Night',
  'Sunrise Yoga Retreat',
  'Thai Street Food Festival',
  'UX Bangkok Meetup',
] as const
