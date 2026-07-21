/* Demo data + derivations for admin/meetings.html, ported verbatim from the
   page's inline <script>. TODAY is pinned to Jul 19, 2026, exactly as the
   source, so the today/upcoming/past buckets are stable. */

export type MeetingType = 'Venue' | 'Sponsor' | 'Vendor' | 'Speaker' | 'Internal'
export type MeetingMode = 'Video' | 'In person' | 'Phone'
export type MeetingBucket = 'today' | 'upcoming' | 'past'

export type TypeStyle = { tint: string; icon: string }
/** Icon + tint chip per meeting type. */
export const TYPE: Record<MeetingType, TypeStyle> = {
  Venue: { tint: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300', icon: 'hgi-building-03' },
  Sponsor: { tint: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300', icon: 'hgi-briefcase-01' },
  Vendor: { tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300', icon: 'hgi-delivery-box-01' },
  Speaker: { tint: 'bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300', icon: 'hgi-mic-01' },
  Internal: { tint: 'bg-brand-soft text-brand', icon: 'hgi-user-group' },
}

export type ModeStyle = { icon: string; label: string; badge: string }
/** Badge treatment per mode. Video is special-cased (Google Meet) in the row. */
export const MODE: Record<MeetingMode, ModeStyle> = {
  Video: { icon: 'hgi-video-01', label: 'Video call', badge: 'badge-blue' },
  'In person': { icon: 'hgi-location-01', label: 'In person', badge: 'badge-gray' },
  Phone: { icon: 'hgi-call-02', label: 'Phone', badge: 'badge-gray' },
}

/** Type options for the filter select (in addition to the "All types" entry). */
export const MEETING_TYPES: MeetingType[] = ['Venue', 'Sponsor', 'Vendor', 'Speaker', 'Internal']

/** Mode options for the schedule slide-over. */
export const MODE_OPTIONS: string[] = ['Google Meet', 'In person', 'Phone']

/** Related-event options for the schedule slide-over. */
export const EVENT_OPTIONS: string[] = [
  'Tech Summit 2026',
  'Bangkok Jazz Night',
  'Sunrise Yoga Retreat',
  'Thai Street Food Festival',
  'UX Bangkok Meetup',
  'General (all events)',
]

type RawMeeting = {
  title: string
  date: string
  start: string
  end: string
  type: MeetingType
  role: string
  person: string
  event: string
  mode: MeetingMode
}

const RAW: RawMeeting[] = [
  // today (Jul 19, 2026)
  { title: 'Seating plan approval', date: 'Jul 19, 2026', start: '10:00 AM', end: '10:30 AM', type: 'Venue', role: 'Venue Coordinator', person: 'Sophia Reynolds', event: 'Tech Summit 2026', mode: 'Video' },
  { title: 'Sponsor onboarding call', date: 'Jul 19, 2026', start: '10:45 AM', end: '11:15 AM', type: 'Sponsor', role: 'Client', person: 'Brann Callahan', event: 'Tech Summit 2026', mode: 'Video' },
  { title: 'Catering walkthrough', date: 'Jul 19, 2026', start: '2:00 PM', end: '2:45 PM', type: 'Vendor', role: 'Caterer', person: 'Niran Sae-lim', event: 'Thai Street Food Festival', mode: 'In person' },
  { title: 'Speaker tech check', date: 'Jul 19, 2026', start: '4:00 PM', end: '4:30 PM', type: 'Speaker', role: 'Keynote', person: 'Dr. Alan Cho', event: 'Tech Summit 2026', mode: 'Video' },
  // upcoming
  { title: 'Stage & AV planning', date: 'Jul 21, 2026', start: '11:00 AM', end: '12:00 PM', type: 'Vendor', role: 'AV Lead', person: 'Krit Phuwadol', event: 'Bangkok Jazz Night', mode: 'In person' },
  { title: 'Sponsor package review', date: 'Jul 22, 2026', start: '3:00 PM', end: '3:45 PM', type: 'Sponsor', role: 'Partnerships', person: 'Mei Ling', event: 'UX Bangkok Meetup', mode: 'Video' },
  { title: 'Instructor briefing', date: 'Jul 23, 2026', start: '9:00 AM', end: '9:30 AM', type: 'Speaker', role: 'Instructor', person: 'Anong Wattana', event: 'Sunrise Yoga Retreat', mode: 'Phone' },
  { title: 'Venue final walkthrough', date: 'Jul 24, 2026', start: '1:00 PM', end: '2:00 PM', type: 'Venue', role: 'Venue Coordinator', person: 'Sophia Reynolds', event: 'Tech Summit 2026', mode: 'In person' },
  { title: 'Ticketing sync', date: 'Jul 25, 2026', start: '10:00 AM', end: '10:30 AM', type: 'Internal', role: 'Ops team', person: 'Harper & Ops', event: 'Tech Summit 2026', mode: 'Video' },
  // past
  { title: 'Project kickoff', date: 'Jul 15, 2026', start: '9:00 AM', end: '10:00 AM', type: 'Internal', role: 'Ops team', person: 'Harper & Ops', event: 'Tech Summit 2026', mode: 'Video' },
  { title: 'Sponsor introduction', date: 'Jul 14, 2026', start: '2:00 PM', end: '2:30 PM', type: 'Sponsor', role: 'Client', person: 'Brann Callahan', event: 'Tech Summit 2026', mode: 'Video' },
  { title: 'Menu tasting', date: 'Jul 12, 2026', start: '12:00 PM', end: '1:00 PM', type: 'Vendor', role: 'Caterer', person: 'Niran Sae-lim', event: 'Thai Street Food Festival', mode: 'In person' },
  { title: 'Speaker confirmations', date: 'Jul 10, 2026', start: '4:00 PM', end: '4:30 PM', type: 'Speaker', role: 'Keynote', person: 'Dr. Alan Cho', event: 'Tech Summit 2026', mode: 'Phone' },
  { title: 'Budget review', date: 'Jul 8, 2026', start: '11:00 AM', end: '11:45 AM', type: 'Internal', role: 'Finance team', person: 'Finance & Harper', event: 'General', mode: 'Video' },
]

export type Meeting = RawMeeting & {
  bucket: MeetingBucket
  /** Google Meet link (Video meetings only). */
  link?: string
  /** Venue or "Phone call" (non-Video meetings). */
  where?: string
}

const TODAY = new Date(2026, 6, 19) // Jul 19, 2026
const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function parseDate(s: string): Date {
  const x = /^(\w{3}) (\d{1,2}), (\d{4})$/.exec(s)!
  return new Date(+x[3], MONTHS[x[1]], +x[2])
}
function parseMin(s: string): number {
  const x = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(s)!
  let h = +x[1] % 12
  if (x[3] === 'PM') h += 12
  return h * 60 + +x[2]
}
function daysFrom(m: RawMeeting): number {
  return Math.round((parseDate(m.date).getTime() - TODAY.getTime()) / 86400000)
}
function bucketOf(m: RawMeeting): MeetingBucket {
  const d = daysFrom(m)
  return d === 0 ? 'today' : d > 0 ? 'upcoming' : 'past'
}
function sortKey(m: RawMeeting): number {
  const d = daysFrom(m)
  const rank = d === 0 ? 0 : d > 0 ? 1 : 2
  return rank * 1e9 + Math.abs(d) * 2000 + parseMin(m.start)
}

/** "Jul 21, 2026" -> "Jul 21" (all demo dates are in 2026). */
export function shortDate(s: string): string {
  return s.replace(', 2026', '')
}

// where each meeting happens: video meetings get an auto-generated Google Meet
// link, else a venue/phone line.
const VENUE: Record<string, string> = {
  'Tech Summit 2026': 'BITEC · Bangna',
  'Bangkok Jazz Night': 'Iconsiam Hall',
  'Sunrise Yoga Retreat': 'Lumpini Park',
  'Thai Street Food Festival': 'Sanam Luang',
  'UX Bangkok Meetup': 'True Digital Park',
  General: 'Eventa HQ',
}
const MEET_CODES = [
  'kxz-mfqr-abc', 'ptw-dknv-xyz', 'rma-jqle-tps', 'vnc-wopd-hjk',
  'zbf-tulx-aqe', 'gcd-nrsy-lmp', 'hqv-eazt-wtd', 'pjm-krlo-suv',
]

let vi = 0
const built: Meeting[] = RAW.map((m) => {
  const bucket = bucketOf(m)
  if (m.mode === 'Video') {
    return { ...m, bucket, link: 'meet.google.com/' + MEET_CODES[vi++ % MEET_CODES.length] }
  }
  if (m.mode === 'In person') {
    return { ...m, bucket, where: VENUE[m.event] || 'On-site' }
  }
  return { ...m, bucket, where: 'Phone call' }
})
built.sort((a, b) => sortKey(a) - sortKey(b))

/** All meetings, chronologically sorted (today, then upcoming, then past). */
export const MEETINGS: Meeting[] = built
