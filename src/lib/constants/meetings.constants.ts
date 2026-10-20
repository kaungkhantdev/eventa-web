/** The meetings module's named constants. */

export const FORM_ID = 'meeting-form'
export const ALL_EVENTS = 'All events'

export const SEPARATOR = ' · '

/** Said on a card that needs a calendar connected, to someone who cannot. */
export const ASK_ADMIN_NOTE = 'Ask an Admin to connect Google Calendar.'

/** The Mode box before the organizer has picked anything (US-MTG-03). */
export const NO_MODE = ''

export const MEETING_MODE_PROMPT = "Choose how you'll meet"

export const NOT_CONNECTED_NOTE =
  "Google Calendar isn't connected, so this meeting will be saved without an invite or Meet link."

export const MEETING_TABS = ['all', 'today', 'upcoming', 'past'] as const

/**
 * The longest search the API's DTO accepts (`@MaxLength`) — past it the API
 * answers 400. The routes cut a longer one; the search boxes stop at it.
 */
export const MAX_SEARCH_LENGTH = 120

export const ALL_TYPES = 'All types'

/** The kit's chip, from meetings.html's header — copied verbatim. */
export const CHIP_CLASS =
  'hidden items-center gap-1.5 rounded-lg border border-hair bg-surface px-2.5 py-1.5 text-[12px] font-medium text-muted lg:inline-flex'

/** How often the list re-reads itself while an invite is on its way. */
export const SYNC_POLL_MS = 3000

/** Reads per distinct set of pending meetings before the page stops asking. */
export const SYNC_POLL_LIMIT = 10
