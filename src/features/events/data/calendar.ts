import type { Tone } from '../types'

/* Calendar-view demo data (admin/events.html → Calendar tab). Dates are stored
   as day-offsets from "today" and materialised at render time, exactly as the
   source did with addDays(new Date(), n). */

/** tone → event-pill classes inside a calendar cell. */
export const CAL_PILL: Record<Tone, string> = {
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-200',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200',
  brand: 'bg-brand-soft text-brand-dark dark:text-brand',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200',
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export type CalEventSeed = { offset: number; t: string; name: string; tone: Tone }

export const CAL_EVENT_SEEDS: CalEventSeed[] = [
  { offset: -3, t: '09:00', name: 'Team offsite', tone: 'brand' },
  { offset: 0, t: '09:30', name: 'Weekly standup', tone: 'blue' },
  { offset: 0, t: '15:00', name: 'Sponsor onboarding', tone: 'indigo' },
  { offset: 1, t: '11:00', name: 'Vendor call', tone: 'amber' },
  { offset: 2, t: '18:30', name: 'UX Bangkok Meetup', tone: 'indigo' },
  { offset: 3, t: '10:00', name: 'Cloud Builders Workshop', tone: 'teal' },
  { offset: 5, t: '14:00', name: 'Design review', tone: 'violet' },
  { offset: 5, t: '15:30', name: 'Sponsor sync', tone: 'amber' },
  { offset: 10, t: '09:00', name: 'Tech Innovators Forum', tone: 'amber' },
  { offset: 12, t: '19:00', name: 'Hope for All Charity Gala', tone: 'brand' },
  { offset: 12, t: '20:00', name: 'Sponsor dinner', tone: 'violet' },
  { offset: 12, t: '16:00', name: 'Stakeholder review', tone: 'violet' },
  { offset: 18, t: '17:00', name: 'Summer Music Festival', tone: 'violet' },
  { offset: 25, t: '18:00', name: 'Product Launch Mixer', tone: 'indigo' },
]
