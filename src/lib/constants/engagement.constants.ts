/** The engagement module's named constants. */

/** An event can be deleted after a broadcast; the broadcast still happened. */
export const GONE = 'Deleted event'

export const ANNOUNCEMENT_INTENTS = ['send', 'cancel', 'reschedule'] as const

/** The composer's "Delivery" choice. */
export const DELIVERY_MODES = ['now', 'schedule'] as const

export const FORM_ID = 'reschedule-announcement'

/**
 * Names this app knows, because a slug is not a sentence. Anything else is made
 * readable rather than shown raw — `kind` is free text from the worker, so a
 * new message type will reach the delivery log before this list does.
 */
export const KIND_LABEL: Record<string, string> = {
  'registration-confirmation': 'Registration confirmation',
  'cancellation-notice': 'Cancellation notice',
  'payment-receipt': 'Payment receipt',
  'event-reminder': 'Event reminder',
  'waitlist-offer': 'Waitlist offer',
  // Sent under the offer's own switch, logged apart so it is not read as one.
  'waitlist-offer-expired': 'Waitlist offer expired',
  'post-event-thankyou': 'Post-event thank-you',
  announcement: 'Announcement',
  'refund-notice': 'Refund notice',
}

export const MAX_SEARCH = 120

/** 'all' is the absence of a filter, not a value the API understands. */
export const DELIVERY_TABS = ['all', 'failed'] as const

/** What the API names nobody as. A row must never read "null joined". */
export const SOMEONE = 'Someone'
export const AN_EVENT = 'an event'

/** How many rows the notification bell previews. */
export const NOTIFICATION_PREVIEW_SIZE = 5

export const MINUTE_MS = 60_000
export const HOUR_MS = 60 * MINUTE_MS

export const NOTIFICATION_TABS = ['all', 'unread'] as const

/** What the bell says when its read failed for a reason the API did not word. */
export const PREVIEW_UNAVAILABLE = 'We couldn’t load your notifications.'

export const LOCALES = [
  { value: 'en' as const, label: 'English' },
  { value: 'th' as const, label: 'ไทย' },
]

export const PERCENT = 100

/**
 * Card avatars, ported from the kit. Keyed by the API's slug: a new message can
 * appear in the catalog before this app knows its face, and a Hugeicons slug
 * that does not exist renders as CJK tofu — so an unknown message borrows the
 * plainest true icon rather than a guess assembled from its name.
 */
export const LOOK: Record<string, { icon: string; iconClass: string }> = {
  'registration-confirmation': {
    icon: 'hgi-checkmark-badge-01',
    iconClass: 'bg-brand-soft text-brand',
  },
  'cancellation-notice': {
    icon: 'hgi-cancel-circle',
    iconClass: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
  },
  'payment-receipt': {
    icon: 'hgi-invoice-01',
    iconClass: 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
  },
  'event-reminder': {
    icon: 'hgi-clock-01',
    iconClass: 'bg-amber-50 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300',
  },
  'waitlist-offer': {
    icon: 'hgi-user-check-01',
    iconClass: 'bg-purple-50 text-purple-500 dark:bg-purple-500/15 dark:text-purple-300',
  },
  'post-event-thankyou': {
    icon: 'hgi-star',
    iconClass: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
  },
}

export const FALLBACK_LOOK = {
  icon: 'hgi-mail-01',
  iconClass: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}
