import type { EventStatus, EventType, Tone } from './types'

/**
 * The kit's visual vocabulary for events — which icon and colour a type wears,
 * and how a status is pilled.
 *
 * These are lookups, not data: they came from the static kit's markup and
 * survive the demo modules being deleted. Extending the product with a new
 * event type is one line in each table rather than a new branch anywhere.
 */

/** type → cover icon + tone. Copied from the source kit. */
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

/** What an unrecognised type falls back to, rather than rendering nothing. */
export const FALLBACK_TYPE_META = { icon: 'hgi-calendar-03', tone: 'brand' as Tone }

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

/**
 * status → pill classes and the glyph inside the pill.
 *
 * `Draft` and `Cancelled` have no counterpart in the static kit, which only ever
 * showed live events: they are rendered in the design system's neutral and
 * danger tones so that a real draft is legible rather than unstyled.
 */
export const STATUS_PILL: Record<EventStatus, { cls: string; icon: string }> = {
  Draft: { cls: 'bg-line text-muted', icon: 'hgi-note-edit' },
  Upcoming: {
    cls: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
    icon: 'hgi-time-schedule',
  },
  Planned: {
    cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    icon: 'hgi-calendar-03',
  },
  Live: { cls: 'bg-brand-soft text-brand-dark dark:text-brand', icon: 'hgi-tick-02' },
  Completed: {
    cls: 'bg-brand-soft text-brand-dark dark:text-brand',
    icon: 'hgi-checkmark-badge-01',
  },
  Cancelled: {
    cls: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
    icon: 'hgi-cancel-circle',
  },
}

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

/** tone → the upcoming card's tinted surface, gradient, bar and ring. */
export const UP_TONE: Record<Tone, { bg: string; grad: string; solid: string; bar: string; ring: string }> = {
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-500/10',
    grad: 'from-pink-400 to-pink-600',
    solid: 'bg-pink-500',
    bar: 'bg-pink-500',
    ring: 'ring-pink-50 dark:ring-pink-500/10',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    grad: 'from-blue-400 to-blue-600',
    solid: 'bg-blue-500',
    bar: 'bg-blue-600',
    ring: 'ring-blue-50 dark:ring-blue-500/10',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-400/10',
    grad: 'from-amber-400 to-amber-600',
    solid: 'bg-amber-500',
    bar: 'bg-amber-500',
    ring: 'ring-amber-50 dark:ring-amber-400/10',
  },
  brand: {
    bg: 'bg-brand-soft',
    grad: 'from-brand to-emerald-500',
    solid: 'bg-brand',
    bar: 'bg-brand',
    ring: 'ring-brand-soft',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    grad: 'from-violet-400 to-violet-600',
    solid: 'bg-violet-500',
    bar: 'bg-violet-500',
    ring: 'ring-violet-50 dark:ring-violet-500/10',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    grad: 'from-indigo-400 to-indigo-600',
    solid: 'bg-indigo-500',
    bar: 'bg-indigo-500',
    ring: 'ring-indigo-50 dark:ring-indigo-500/10',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-500/10',
    grad: 'from-teal-400 to-teal-600',
    solid: 'bg-teal-500',
    bar: 'bg-teal-500',
    ring: 'ring-teal-50 dark:ring-teal-500/10',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    grad: 'from-red-400 to-red-600',
    solid: 'bg-red-500',
    bar: 'bg-red-500',
    ring: 'ring-red-50 dark:ring-red-500/10',
  },
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

/** Whether the browser took the link — the three things a copy button can say. */
export type CopyState = 'idle' | 'copied' | 'failed'

/**
 * What the copy button reads.
 *
 * "Copied" is only ever shown when the clipboard actually accepted the text.
 * It used to be set unconditionally, with the rejection swallowed, so a refused
 * copy reported success and the organizer pasted nothing into the email they
 * were writing — the one failure they had no way to notice.
 */
export function copyLabel(state: CopyState): string {
  if (state === 'copied') return 'Copied'
  if (state === 'failed') return 'Select and copy'
  return 'Copy'
}

/**
 * Where an event's workspace lives.
 *
 * Named once because three screens build it — the table row, its kebab menu
 * and the wizard's header — and a route that is spelled out in each of them is
 * a route that gets renamed in two.
 */
export function eventDetailPath(id: string): string {
  return `/admin/event-detail?id=${encodeURIComponent(id)}`
}
