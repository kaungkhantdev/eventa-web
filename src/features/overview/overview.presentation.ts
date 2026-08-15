import { hashIndex } from '@/lib/palette'
import type { AlertSeverity, CardLook, PaymentStatus } from './overview.types'

/**
 * How the overview looks — the tints the static kit hand-wrote per demo row.
 *
 * Every class string here is copied from admin/home.html verbatim. What changed
 * is only *which* row gets which: the kit knew its four rows, this page gets
 * whatever the workspace holds, so a tint is chosen from the row's own key and
 * therefore never moves between visits.
 */

const AVATAR_TINTS: readonly string[] = [
  'bg-brand-soft text-brand-dark dark:text-brand',
  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
]

export function avatarTint(name: string): string {
  return AVATAR_TINTS[hashIndex(name, AVATAR_TINTS.length)]
}

const MEETING_TINTS: readonly string[] = [
  'bg-brand-soft text-brand',
  'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
]

export function meetingTint(key: string): string {
  return MEETING_TINTS[hashIndex(key, MEETING_TINTS.length)]
}

const CARD_LOOKS: readonly CardLook[] = [
  {
    card: 'bg-blue-50 dark:bg-blue-500/10',
    ring: 'ring-blue-50 dark:ring-blue-500/10',
    avatar: 'bg-white text-blue-700',
    avatarMore: 'bg-blue-600 text-white',
    bar: 'bg-blue-600',
  },
  {
    card: 'bg-brand-soft',
    ring: 'ring-brand-soft',
    avatar: 'bg-white text-brand-dark',
    avatarMore: 'bg-brand text-white',
    bar: 'bg-brand',
  },
  {
    card: 'bg-pink-50 dark:bg-pink-500/10',
    ring: 'ring-pink-50 dark:ring-pink-500/10',
    avatar: 'bg-white text-pink-700',
    avatarMore: 'bg-pink-500 text-white',
    bar: 'bg-pink-500',
  },
]

export function cardLook(slug: string): CardLook {
  return CARD_LOOKS[hashIndex(slug, CARD_LOOKS.length)]
}

/**
 * The activity ring's segment colours.
 *
 * Literal hex, as in the source: an SVG `stroke` cannot read a Tailwind token,
 * and these four are the kit's own donut palette.
 */
export const SHARE_COLORS: readonly string[] = ['#1ba770', '#3b82f6', '#ec4899', '#f59e0b']

/** How urgent an alert looks. A lookup, so a new severity is one line. */
export const ALERT_LOOK: Record<AlertSeverity, { icon: string; tone: string }> = {
  critical: { icon: 'hgi-alert-circle', tone: 'text-red-500' },
  warning: { icon: 'hgi-alert-circle', tone: 'text-amber-500' },
  info: { icon: 'hgi-checkmark-circle-02', tone: 'text-brand' },
}

/**
 * The ticket-type donut's ramp: the brand green fading to grey, as in the kit.
 * Largest share first, so the ramp reads as an ordering rather than a palette.
 */
export const TIER_COLORS: readonly string[] = ['#1ba770', '#4cbd96', '#9fe0cd', '#d1d5db']

/** How a payment status reads, and how it is tinted. */
export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: string }> = {
  paid: { label: 'Paid', tone: 'bg-brand-soft text-brand-dark dark:text-brand' },
  pending: {
    label: 'Pending',
    tone: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  },
  refunded: {
    label: 'Refunded',
    tone: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
  },
  failed: {
    label: 'Failed',
    tone: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  },
}

/** The three urgency bands of the selling-fast list, mildest last. */
export const URGENCY = {
  critical: {
    tone: 'text-red-500',
    iconTint: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
  },
  warning: {
    tone: 'text-amber-500',
    iconTint: 'bg-amber-50 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300',
  },
  normal: { tone: 'text-muted', iconTint: 'bg-brand-soft text-brand' },
}

/** The delta chip beside a KPI: green for better, red for worse, grey for flat. */
export const DELTA_TONE = {
  improved: 'text-brand',
  worsened: 'text-red-500',
  flat: 'text-muted',
}

export const DELTA_ICON = {
  up: 'hgi-arrow-up-right-01',
  down: 'hgi-arrow-down-right-01',
}
