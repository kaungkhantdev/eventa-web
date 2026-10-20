/** The insights module's named constants. */

export const DATE_INPUT =
  'h-10 w-full rounded-lg bg-surface px-3 text-[13px] text-ink focus:outline-none focus:ring-4 focus:ring-brand/15 sm:w-36'

export const ARROW = {
  up: 'hgi-arrow-up-right-01',
  down: 'hgi-arrow-down-right-01',
} as const

export const REPORTS = [
  'registrations',
  'attendance',
  'events',
  'income',
  'discounts',
  'transactions',
  'payouts',
] as const

/**
 * The kit's brand tint ramp, applied BY POSITION.
 *
 * The mix arrives largest-first, so the biggest slice takes the strongest tint
 * the way the static page did. Not `hashIndex`, which is for lists that have no
 * order of their own — here the order is the point.
 */
export const MIX_RAMP = ['#1ba770', '#4cbd96', '#9fe0cd', '#d1d5db']

/** The stages the status control offers; '' is "every stage". */
export const EVENT_LIFECYCLES = ['upcoming', 'live', 'completed', 'cancelled', ''] as const

export const MAX_SEARCH = 120

/** How many events the overview previews before "View all". */
export const TOP_EVENTS = 6

export const OVERVIEW_RANGES = ['7d', '30d', '90d', 'year'] as const

export const NO_REVENUE = 'No revenue in this period.'
export const NOTHING_CLEARED = 'Paid registrations show up here as soon as the first one clears.'

/** US-RPT-02 AC2, in the story's own words — the API says the same. */
export const END_BEFORE_START = 'End date must be on or after the start date'

export const BOTH_DATES = 'Choose both a start and an end date'

/** The API's cap: 731 days, which the story states as 24 months. */
export const MAX_SPAN_MONTHS = 24
