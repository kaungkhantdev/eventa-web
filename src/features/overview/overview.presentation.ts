import { hashIndex } from '@/lib/palette'
import type { AlertSeverity, CardLook, PaymentStatus } from './overview.types'
import { AVATAR_TINTS, MEETING_TINTS } from '@/lib/constants/overview.constants'

/**
 * How the overview looks — the tints the static kit hand-wrote per demo row.
 *
 * Every class string here is copied from admin/home.html verbatim. What changed
 * is only *which* row gets which: the kit knew its four rows, this page gets
 * whatever the workspace holds, so a tint is chosen from the row's own key and
 * therefore never moves between visits.
 */

export function avatarTint(name: string): string {
  return AVATAR_TINTS[hashIndex(name, AVATAR_TINTS.length)]
}

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

/** How urgent an alert looks. A lookup, so a new severity is one line. */
export const ALERT_LOOK: Record<AlertSeverity, { icon: string; tone: string }> = {
  critical: { icon: 'hgi-alert-circle', tone: 'text-red-500' },
  warning: { icon: 'hgi-alert-circle', tone: 'text-amber-500' },
  info: { icon: 'hgi-checkmark-circle-02', tone: 'text-brand' },
}

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

/**
 * Whether the revenue trend has anything to draw.
 *
 * A period with no sales still comes back as a full series of zeroes, so the
 * chart drew a flat line along the axis and an empty grid — which reads as a
 * chart that failed rather than a month that earned nothing. Nought is a real
 * answer, and it deserves saying rather than plotting.
 */
export function hasRevenue(values: readonly number[]): boolean {
  return values.some((value) => value > 0)
}
