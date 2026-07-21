import type { Tone } from '../types'

/* Demo data for the Upcoming events card grid (admin/events-upcoming.html). */

export type UpToneStyle = {
  bg: string
  grad: string
  solid: string
  bar: string
  ring: string
}

export const UP_TONE: Record<Tone, UpToneStyle> = {
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

export type UpcomingEvent = {
  name: string
  icon: string
  tone: Tone
  days: number
  reg: string
  pct: number
  seed: string
  att: number
}

export const UPCOMING: UpcomingEvent[] = [
  { name: 'Tech Innovators Forum', icon: 'hgi-presentation-bar-chart-01', tone: 'amber', days: 3, reg: '39/50', pct: 78, seed: 'evt-conference', att: 39 },
  { name: 'UX Bangkok Meetup', icon: 'hgi-user-multiple', tone: 'indigo', days: 5, reg: '72/90', pct: 80, seed: 'evt-networking', att: 72 },
  { name: 'Cloud Builders Workshop', icon: 'hgi-briefcase-01', tone: 'teal', days: 8, reg: '40/60', pct: 67, seed: 'evt-workshop', att: 40 },
  { name: 'Hope for All Charity Gala', icon: 'hgi-charity', tone: 'brand', days: 12, reg: '34/51', pct: 67, seed: 'evt-charity', att: 34 },
  { name: 'Summer Music Festival', icon: 'hgi-mic-01', tone: 'violet', days: 15, reg: '320/400', pct: 80, seed: 'evt-festival', att: 320 },
  { name: 'Sunrise Yoga Retreat', icon: 'hgi-dumbbell-01', tone: 'red', days: 18, reg: '48/60', pct: 80, seed: 'evt-wellness', att: 48 },
]
