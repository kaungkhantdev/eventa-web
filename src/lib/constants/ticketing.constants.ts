/** The ticketing module's named constants. */

export const DISCOUNT_PANEL_FORM_ID = 'discount-form'
export const MAX_PERCENT = 100
export const ALL_EVENTS = 'All events'

/** One order may hold at most this many seats — the API's own ceiling. */
export const MAX_PER_ORDER = 8
export const TICKET_PANEL_FORM_ID = 'ticket-form'

export const COPY_IDLE = 'Copy link'
export const COPY_DONE = 'Copied'
export const TICKET_QR_MODAL_COPY_RESET_MS = 1600

export const SATANG_PER_BAHT = 100
export const FULL = 100
export const BANGKOK = 'Asia/Bangkok'
export const RANGE_DASH = ' – '

export const DISCOUNT_TABS = ['all', 'active', 'scheduled', 'expired', 'disabled'] as const

/**
 * The longest search the API's DTO accepts (`@MaxLength`) — past it the API
 * answers 400. The routes cut a longer one; the search boxes stop at it.
 */
export const MAX_SEARCH_LENGTH = 120

export const DISCOUNTS_PAGE_COPY_RESET_MS = 1200

export const SHARE_FAILED = "That link couldn't be prepared. Close this and try again."

/**
 * What a quantity box says when it is read-only because the seat map sets it
 * (US-EVT-05). Shared by every place a tier's quantity is edited.
 */
export const SEAT_SET_QUANTITY = 'Set by the seat map'

export const FREE = 'Free'

/**
 * The kit hand-tinted each card's icon square. Real inventory has whatever the
 * workspace sells, so the tint comes from the tier's own id — stable, so a card
 * does not change colour when the list is refiltered.
 */
export const ICON_TINTS: readonly string[] = [
  'bg-amber-50 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300',
  'bg-brand-soft text-brand',
  'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
  'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-purple-50 text-purple-500 dark:bg-purple-500/15 dark:text-purple-300',
]

export const TICKET_TABS = ['all', 'onsale', 'scheduled', 'paused', 'soldout'] as const
