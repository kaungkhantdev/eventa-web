/** The overview module's named constants. */

/**
 * The activity ring's SVG geometry (`ActivityRingPanel`): in a 42×42 viewBox,
 * r 15.915 makes the circumference 100, so a dash length is a percentage.
 */
export const ACTIVITY_RING_RADIUS = 15.915
export const ACTIVITY_RING_GAP = 2.4
export const ACTIVITY_RING_STROKE = 4.5
/** Where a dash offset of 0 would start; the kit rotates arcs to 12 o'clock. */
export const ACTIVITY_RING_TOP = 25

export const NO_ACTIVE_EVENTS = 'No active events.'
export const NOTHING_LIVE = 'Once an event is live and selling, its share of sign-ups shows here.'

/** What the empty Alerts panel says it will flag (US-DASH-06). */
export const NOTHING_WRONG =
  "We'll flag failed payments, cancellations and check-in problems here."

export const NONE_YET = 'No registrations yet.'
export const NOTHING_IN = 'Every sign-up across your events lands here, newest first.'

export const NO_REVENUE = 'No revenue in this period.'
export const NOTHING_SOLD = 'Paid registrations show up here as soon as the first one clears.'

export const NOTHING_LOW = 'No tickets running low.'
export const TIER_ICON = 'hgi-ticket-star'
export const NOTHING_SCARCE =
  'Tiers close to selling out show up here, the scarcest first.'

export const NO_REGISTRATIONS = 'No registrations yet.'
export const NOTHING_TO_SPLIT = 'Once tickets sell, the split by type shows here.'

export const MEETINGS = '/admin/meetings'
export const NONE_TODAY = 'No meetings scheduled today.'
export const NOTHING_BOOKED = 'Meetings you schedule for today appear here with their time and guest.'

export const REGISTRATIONS = '/admin/registrations'
export const NEW_EVENT = '/admin/event-form'
export const NOTHING_YET = 'Share your registration link and new attendees appear here in real time.'
/** Long enough to read, short enough that the button is ready for a second copy. */
export const COPIED_MS = 1500

export const NONE_UPCOMING = 'No upcoming events.'
export const NOTHING_SCHEDULED = 'Events you publish show up here as their date gets closer.'

export const SATANG_PER_BAHT = 100
export const PER_THOUSAND = 1000

/** Space above the tallest point, so the peak is not drawn on the ceiling. */
export const HEADROOM = 1.15

/**
 * How many seats one booking can take — `maxPerOrder` on the API.
 *
 * At or below it, a single order can clear the tier, which is what makes a low
 * count urgent rather than merely low (US-DASH-11).
 */
export const ONE_BOOKING = 8
export const LAST_FEW = 3

export const RANGES: readonly string[] = ['week', 'month', 'year']

/** Where this app mounts the modules the API's alert links name. */
export const CONSOLE = '/admin'

export const SEPARATOR = ' · '

export const TODAY = 'Today'

export const WHOLE_RING = 100

/** How many events the activity ring names before the legend stops reading. */
export const RING_SIZE = 4

/** How many of today's meetings the home panel previews. */
export const MEETING_PREVIEW = 2

/** How many upcoming events fit the card row. */
export const UPCOMING_PREVIEW = 3

export const AVATAR_TINTS: readonly string[] = [
  'bg-brand-soft text-brand-dark dark:text-brand',
  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
]

export const MEETING_TINTS: readonly string[] = [
  'bg-brand-soft text-brand',
  'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
]

/**
 * The activity ring's segment colours.
 *
 * Literal hex, as in the source: an SVG `stroke` cannot read a Tailwind token,
 * and these four are the kit's own donut palette.
 */
export const SHARE_COLORS: readonly string[] = ['#00c066', '#3b82f6', '#ec4899', '#f59e0b']

/**
 * The ticket-type donut's ramp: the brand green fading to grey, as in the kit.
 * Largest share first, so the ramp reads as an ordering rather than a palette.
 */
export const TIER_COLORS: readonly string[] = ['#00c066', '#3ecf8b', '#a0e7c6', '#d1d5db']

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

/** What the alert feed says when there is nothing outstanding (US-DASH-06). */
export const ALL_CAUGHT_UP = "You're all caught up."
