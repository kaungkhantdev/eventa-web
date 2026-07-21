/* Demo data for admin/home.html, ported verbatim from the page's inline script
   and markup. Colours that are page-local accents (donut segments, tinted event
   cards) are kept as literal hex / Tailwind class strings so the port renders
   pixel-identically. */

/** Today's Registrations feed (avatar carries the exact per-row tint). */
export const TODAY_REGISTRATIONS = [
  {
    initials: 'AP',
    name: 'Anong Pattana',
    detail: 'Tech Summit 2026 · VIP',
    time: '10:24',
    avatar: 'bg-brand-soft text-brand-dark dark:text-brand',
  },
  {
    initials: 'ST',
    name: 'Somchai Thongchai',
    detail: 'Bangkok Jazz Night · General',
    time: '10:02',
    avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  },
  {
    initials: 'PS',
    name: 'Ploy Srisai',
    detail: 'Sunrise Yoga Retreat · General',
    time: '09:47',
    avatar: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  },
  {
    initials: 'JW',
    name: 'James Wong',
    detail: 'Tech Summit 2026 · Early Bird',
    time: '09:31',
    avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  },
] as const

export type TodayRegistration = (typeof TODAY_REGISTRATIONS)[number]

/** Today's Meetings list. `icon` holds the exact per-row tint. */
export const TODAY_MEETINGS = [
  {
    title: 'Seating plan approval',
    time: '10:00 AM – 10:30 AM',
    who: 'Venue Coordinator · Sophia Reynolds',
    icon: 'bg-brand-soft text-brand',
  },
  {
    title: 'Sponsor onboarding call',
    time: '10:45 AM – 11:15 AM',
    who: 'Client · Brann Callahan',
    icon: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  },
] as const

export type TodayMeeting = (typeof TODAY_MEETINGS)[number]

/** Active-events donut segments (share of active events). */
export const ACTIVE_EVENTS = [
  { name: 'Tech Summit 2026', pct: 34, color: '#1ba770' },
  { name: 'Bangkok Jazz Night', pct: 27, color: '#3b82f6' },
  { name: 'Sunrise Yoga Retreat', pct: 22, color: '#ec4899' },
  { name: 'UX Bangkok Meetup', pct: 17, color: '#f59e0b' },
] as const

export type ActiveEvent = (typeof ACTIVE_EVENTS)[number]

/** Upcoming-event cards. Every colour class is the source's literal tint. */
export const UPCOMING_EVENTS = [
  {
    title: 'Tech Summit 2026',
    daysLeft: '3 days left',
    progress: 83,
    card: 'bg-blue-50 dark:bg-blue-500/10',
    ring: 'ring-blue-50 dark:ring-blue-500/10',
    initials: 'AP',
    avatarA: 'bg-white text-blue-700',
    more: '+312',
    avatarMore: 'bg-blue-600 text-white',
    bar: 'bg-blue-600',
  },
  {
    title: 'Bangkok Jazz Night',
    daysLeft: '12 days left',
    progress: 67,
    card: 'bg-brand-soft',
    ring: 'ring-brand-soft',
    initials: 'ST',
    avatarA: 'bg-white text-brand-dark',
    more: '+240',
    avatarMore: 'bg-brand text-white',
    bar: 'bg-brand',
  },
  {
    title: 'Sunrise Yoga Retreat',
    daysLeft: '18 days left',
    progress: 48,
    card: 'bg-pink-50 dark:bg-pink-500/10',
    ring: 'ring-pink-50 dark:ring-pink-500/10',
    initials: 'PS',
    avatarA: 'bg-white text-pink-700',
    more: '+88',
    avatarMore: 'bg-pink-500 text-white',
    bar: 'bg-pink-500',
  },
] as const

export type UpcomingEvent = (typeof UPCOMING_EVENTS)[number]

/** Alerts feed. Each item pairs plain lead text with one inline event link. */
export const ALERTS = [
  {
    icon: 'hgi-checkmark-circle-02',
    iconColor: 'text-brand',
    text: 'Registration form needs approval for ',
    link: 'Tech Summit 2026',
    to: '/admin/events',
  },
  {
    icon: 'hgi-alert-circle',
    iconColor: 'text-red-500',
    text: "Mia Thompson's payment was declined for ",
    link: 'Bangkok Jazz Night',
    to: '/admin/payments',
  },
  {
    icon: 'hgi-alert-circle',
    iconColor: 'text-red-500',
    text: 'Speaker not confirmed · ',
    link: 'Sunrise Yoga Retreat',
    to: '/admin/speakers',
  },
  {
    icon: 'hgi-alert-circle',
    iconColor: 'text-red-500',
    text: 'Vendor reply pending · ',
    link: 'Tech Summit 2026',
    to: '/admin/feedback',
  },
] as const

export type Alert = (typeof ALERTS)[number]

/** Website-template cards. */
export const TEMPLATES = [
  {
    tag: 'All-purpose',
    title: 'Classic',
    desc: 'All-purpose event page — details fill in automatically.',
  },
  { tag: 'Bold', title: 'Spotlight', desc: 'Split hero with a sticky register card.' },
  { tag: 'Minimal', title: 'Minimal', desc: 'Centered, understated event page.' },
  {
    tag: 'Festival',
    title: 'Vibrant',
    desc: 'Full-bleed poster hero for festivals & concerts.',
  },
] as const

export type Template = (typeof TEMPLATES)[number]
