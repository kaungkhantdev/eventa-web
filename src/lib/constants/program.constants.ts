import type { PageWindow } from '@/lib/paging'
import { DEFAULT_PAGE_SIZE } from '@/lib/paging'

/** The program module's named constants. */

export const SESSION_PANEL_FORM_ID = 'session-form'

export const SPEAKER_PANEL_FORM_ID = 'speaker-form'

/** The calendar's first hour, and how tall an hour is — the kit's geometry. */
export const FIRST_HOUR = 9
export const LAST_HOUR = 16
export const HOUR_HEIGHT = 64

export const MINUTES_PER_HOUR = 60
/** The shortest block the calendar draws — still tall enough to click. */
export const MIN_BLOCK_HEIGHT = HOUR_HEIGHT / 4
export const MS_PER_DAY = 86_400_000

/** The session-removal confirmation (US-PROG-04). */
export const SESSION_REMOVAL_WARNING =
  'Removing this session won’t notify attendees who bookmarked it, and can’t be undone.'

export const EVENT_OPTIONS = 100

/**
 * The longest search the API's DTO accepts (`@MaxLength`) — past it the API
 * answers 400. The routes cut a longer one; the search boxes stop at it.
 */
export const MAX_SEARCH_LENGTH = 120

/** What a workspace with no events shows: nothing, and no count either. */
export const EMPTY_WINDOW: PageWindow = {
  from: 0,
  to: 0,
  total: 0,
  page: 1,
  pageCount: 1,
  size: DEFAULT_PAGE_SIZE,
}
