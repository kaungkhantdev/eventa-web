import type { EventBucket, EventStatus, EventType, Tone } from '../types'

/* Demo data for the Events management table (admin/events.html). Ported
   verbatim from the inline <script>: 28 active + 20 completed events. */

/** type → cover icon + tone (shared conventions from the source kit). */
export const TYPE_META: Record<EventType, { icon: string; tone: Tone }> = {
  Conference: { icon: 'hgi-presentation-bar-chart-01', tone: 'amber' },
  Networking: { icon: 'hgi-user-multiple', tone: 'indigo' },
  Workshop: { icon: 'hgi-briefcase-01', tone: 'teal' },
  'Charity & Gala': { icon: 'hgi-charity', tone: 'brand' },
  'Sports & Wellness': { icon: 'hgi-dumbbell-01', tone: 'red' },
  'Concert & Festival': { icon: 'hgi-mic-01', tone: 'violet' },
  Exhibition: { icon: 'hgi-image-01', tone: 'blue' },
  Seminar: { icon: 'hgi-graduation-scroll', tone: 'pink' },
}

/** tone → solid cover background. */
export const COVER: Record<Tone, string> = {
  brand: 'bg-brand',
  blue: 'bg-blue-500',
  pink: 'bg-pink-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  red: 'bg-red-500',
}

/** status → pill classes. */
export const STATUS_PILL: Record<EventStatus, string> = {
  Upcoming: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  Planned: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  Live: 'bg-brand-soft text-brand-dark dark:text-brand',
  Completed: 'bg-brand-soft text-brand-dark dark:text-brand',
}

export type EventRow = {
  id: string
  name: string
  date: string
  type: EventType
  tasks: string
  status: EventStatus
  bucket: EventBucket
  icon: string
  tone: Tone
}

type RawEvent = [
  name: string,
  date: string,
  type: EventType,
  tasks: string,
  status: EventStatus,
  bucket: EventBucket,
]

const RAW: RawEvent[] = [
  /* ----- active ----- */
  ['Tech Innovators Forum', 'August 27, 2025', 'Conference', '39/50', 'Upcoming', 'active'],
  ['UX Bangkok Meetup', 'August 20, 2025', 'Networking', '72/90', 'Upcoming', 'active'],
  ['Cloud Builders Workshop', 'August 22, 2025', 'Workshop', '40/60', 'Upcoming', 'active'],
  ['Hope for All Charity Gala', 'August 29, 2025', 'Charity & Gala', '34/51', 'Upcoming', 'active'],
  ['Sunrise Yoga Retreat', 'September 11, 2025', 'Sports & Wellness', '48/60', 'Planned', 'active'],
  ['DevOps World Bangkok', 'September 3, 2025', 'Conference', '210/300', 'Live', 'active'],
  ['Founders Coffee Connect', 'September 5, 2025', 'Networking', '58/80', 'Upcoming', 'active'],
  ['AI Prototyping Bootcamp', 'September 9, 2025', 'Workshop', '52/64', 'Upcoming', 'active'],
  ['Green Future Modern Art Expo', 'September 14, 2025', 'Exhibition', '180/250', 'Planned', 'active'],
  ['Marathon for Mangroves', 'September 18, 2025', 'Sports & Wellness', '640/800', 'Upcoming', 'active'],
  ['Indie Sound Night', 'September 21, 2025', 'Concert & Festival', '270/350', 'Live', 'active'],
  ['Product Strategy Masterclass', 'September 24, 2025', 'Seminar', '88/120', 'Upcoming', 'active'],
  ['Startup Pitch Arena', 'September 27, 2025', 'Networking', '96/140', 'Planned', 'active'],
  ['Cloud Security Summit', 'October 1, 2025', 'Conference', '145/200', 'Upcoming', 'active'],
  ['Watercolor Weekend', 'October 4, 2025', 'Workshop', '24/30', 'Upcoming', 'active'],
  ['Hearts United Benefit Ball', 'October 8, 2025', 'Charity & Gala', '110/160', 'Planned', 'active'],
  ['Sunset Trail Run', 'October 11, 2025', 'Sports & Wellness', '300/400', 'Upcoming', 'active'],
  ['Bangkok Design Biennale', 'October 15, 2025', 'Exhibition', '420/600', 'Live', 'active'],
  ['Jazz on the Rooftop', 'October 18, 2025', 'Concert & Festival', '190/240', 'Upcoming', 'active'],
  ['Data Science Forum', 'October 22, 2025', 'Conference', '160/220', 'Planned', 'active'],
  ['UX Research Roundtable', 'October 25, 2025', 'Seminar', '46/70', 'Upcoming', 'active'],
  ['Women in Tech Mixer', 'October 29, 2025', 'Networking', '78/100', 'Upcoming', 'active'],
  ['Mindful Movement Retreat', 'November 2, 2025', 'Sports & Wellness', '52/80', 'Planned', 'active'],
  ['Rapid Prototyping Lab', 'November 6, 2025', 'Workshop', '38/50', 'Upcoming', 'active'],
  ['Charity Gala Under the Stars', 'November 9, 2025', 'Charity & Gala', '128/200', 'Upcoming', 'active'],
  ['Neon Nights Festival', 'November 13, 2025', 'Concert & Festival', '520/700', 'Live', 'active'],
  ['Enterprise Cloud Expo', 'November 17, 2025', 'Exhibition', '340/500', 'Planned', 'active'],
  ['Leadership in Practice', 'November 20, 2025', 'Seminar', '64/90', 'Upcoming', 'active'],
  /* ----- completed ----- */
  ['Corporate Leadership Summit', 'December 20, 2024', 'Conference', '64/64', 'Completed', 'completed'],
  ['Summer Music Festival', 'June 15, 2025', 'Concert & Festival', '400/400', 'Completed', 'completed'],
  ['Product Launch Mixer', 'May 2, 2025', 'Networking', '30/30', 'Completed', 'completed'],
  ['Winter Code Conference', 'January 18, 2025', 'Conference', '280/280', 'Completed', 'completed'],
  ['New Year Networking Brunch', 'January 9, 2025', 'Networking', '95/95', 'Completed', 'completed'],
  ['Design Systems Workshop', 'February 12, 2025', 'Workshop', '48/48', 'Completed', 'completed'],
  ['Love & Give Charity Dinner', 'February 14, 2025', 'Charity & Gala', '150/150', 'Completed', 'completed'],
  ['Spring Wellness Retreat', 'March 8, 2025', 'Sports & Wellness', '70/70', 'Completed', 'completed'],
  ['Contemporary Art Showcase', 'March 22, 2025', 'Exhibition', '310/320', 'Completed', 'completed'],
  ['Acoustic Spring Sessions', 'March 29, 2025', 'Concert & Festival', '240/240', 'Completed', 'completed'],
  ['Frontend Masters Seminar', 'April 5, 2025', 'Seminar', '110/110', 'Completed', 'completed'],
  ['Startup Growth Summit', 'April 19, 2025', 'Conference', '260/260', 'Completed', 'completed'],
  ['Charity Fun Run', 'April 26, 2025', 'Sports & Wellness', '540/540', 'Completed', 'completed'],
  ['Investor Networking Night', 'May 16, 2025', 'Networking', '85/85', 'Completed', 'completed'],
  ['Ceramics & Craft Workshop', 'May 24, 2025', 'Workshop', '36/36', 'Completed', 'completed'],
  ['Hope Rising Benefit Gala', 'June 6, 2025', 'Charity & Gala', '175/175', 'Completed', 'completed'],
  ['Urban Photography Expo', 'June 21, 2025', 'Exhibition', '290/300', 'Completed', 'completed'],
  ['Cloud Native Seminar', 'July 3, 2025', 'Seminar', '130/130', 'Completed', 'completed'],
  ['Midyear Leadership Forum', 'July 12, 2025', 'Conference', '200/200', 'Completed', 'completed'],
  ['Summer Beats Block Party', 'July 19, 2025', 'Concert & Festival', '450/450', 'Completed', 'completed'],
]

export const EVENTS: EventRow[] = RAW.map(([name, date, type, tasks, status, bucket], i) => ({
  id: `evt-${i}`,
  name,
  date,
  type,
  tasks,
  status,
  bucket,
  icon: TYPE_META[type].icon,
  tone: TYPE_META[type].tone,
}))

/** Distinct event types, preserving first-seen order (for the type filter). */
export const EVENT_TYPES: EventType[] = Array.from(new Set(EVENTS.map((e) => e.type)))
