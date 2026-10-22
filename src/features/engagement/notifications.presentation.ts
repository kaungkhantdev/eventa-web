import type { FeedKind } from './notifications.types'

/**
 * Icon tints per kind, from the kit. Shared by the feed page and the header's
 * notification bell, so a kind reads the same colour in both.
 */
export const NOTIFICATION_TINT: Record<FeedKind, string> = {
  registration: 'bg-brand-soft text-brand',
  payment: 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
  payout: 'bg-brand-soft text-brand',
  alert: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
}
