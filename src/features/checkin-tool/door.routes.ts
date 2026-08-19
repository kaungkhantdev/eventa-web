import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { eventsApi } from '@/features/events/events.api'
import { STATUS_LABEL } from '@/features/events/eventDetail.mapper'
import type { EventStatus } from '@/features/events/types'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { bangkokDate } from '@/lib/format'
import { intParam } from '@/lib/urlFilters'
import { countsOf, doorApi } from './door.api'
import { toAttendanceRow, toDoorCounts, toScanFeedback } from './door.mapper'
import type { AttendanceRow, DoorCounts, ScanFeedback } from './door.types'

/**
 * The two screens the door uses (US-REG-11/12/13).
 *
 * Both read `GET /events/:eventId/check-ins` — the queue by name, the station
 * newest-first. One list, two views.
 */

/** How many events the chooser offers. */
const EVENT_OPTIONS = 50

/** How many arrivals the station's live feed shows. */
export const FEED_SIZE = 8

export interface EventChoice {
  id: string
  name: string
  /** `Jul 18, 2026` on the Bangkok clock — the kit's header line. */
  when: string
  /** Paints the picker's status dot. */
  status: EventStatus
}

async function eventChoices(): Promise<EventChoice[]> {
  const page = await eventsApi.list({ limit: EVENT_OPTIONS, sort: 'recent' })
  return page.items.map((event) => ({
    id: event.id,
    name: event.name,
    when: event.startAt ? bangkokDate(event.startAt) : '',
    status: STATUS_LABEL[event.status],
  }))
}

/** The event being worked, from the URL, else the most recent. */
function chosenEvent(events: EventChoice[], params: URLSearchParams): EventChoice | null {
  const asked = params.get('eventId')
  return events.find((event) => event.id === asked) ?? events[0] ?? null
}

const STATUSES = ['checked_in', 'expected'] as const

/* ── the queue ────────────────────────────────────────────────────────── */

export interface QueueData {
  events: EventChoice[]
  event: EventChoice | null
  rows: AttendanceRow[]
  counts: DoorCounts
  window: PageWindow
}

const EMPTY_COUNTS: DoorCounts = {
  checkedIn: 0,
  expected: 0,
  total: 0,
  percent: 0,
  onSite: 0,
  late: 0,
}

/** A page with nothing on it — the shape `pageWindow` needs to say "0 of 0". */
const EMPTY_META = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
}

export const checkInQueueRoute = {
  loader: pageData(async ({ request }: LoaderArgs): Promise<QueueData> => {
    const params = queryOf(request)
    const events = await eventChoices()
    const event = chosenEvent(events, params)
    // A workspace with no events has nobody at the door — and no event id to
    // ask about, so there is nothing to fetch rather than nothing to show.
    if (!event) {
      return { events, event: null, rows: [], counts: EMPTY_COUNTS, window: pageWindow(EMPTY_META) }
    }

    const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
    const page = await doorApi.roll(event.id, {
      page: intParam(params, 'page', 1),
      limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
      ...statusOf(params),
      ...searchOf(params),
    })

    return {
      events,
      event,
      rows: page.items.map(toAttendanceRow),
      counts: toDoorCounts(countsOf(page.meta)),
      window: pageWindow(page.meta),
    }
  }),

  action: pageAction(async ({ request }: LoaderArgs) => {
    const form = await request.formData()
    const eventId = String(form.get('eventId') ?? '')
    const ticketId = String(form.get('ticketId') ?? '')
    if (form.get('intent') === 'undo') return doorApi.undo(eventId, ticketId)
    return doorApi.admit(eventId, ticketId)
  }),
}

/**
 * The status tab, when one is chosen. Absent rather than a default, because
 * "everyone" is a third answer the API spells by omitting the parameter.
 */
function statusOf(params: URLSearchParams) {
  const asked = params.get('status')
  return STATUSES.includes(asked as (typeof STATUSES)[number])
    ? { status: asked as (typeof STATUSES)[number] }
    : {}
}

function searchOf(params: URLSearchParams) {
  const search = params.get('q')?.trim()
  return search ? { search } : {}
}

/* ── the station ──────────────────────────────────────────────────────── */

export interface StationData {
  events: EventChoice[]
  event: EventChoice | null
  counts: DoorCounts
  /** Who just walked in, newest first. */
  feed: AttendanceRow[]
}

export const checkInStationRoute = {
  loader: pageData(async ({ request }: LoaderArgs): Promise<StationData> => {
    const events = await eventChoices()
    const event = chosenEvent(events, queryOf(request))
    if (!event) return { events, event: null, counts: EMPTY_COUNTS, feed: [] }

    const page = await doorApi.roll(event.id, {
      page: 1,
      limit: FEED_SIZE,
      status: 'checked_in',
      sort: 'recent',
    })
    return {
      events,
      event,
      counts: toDoorCounts(countsOf(page.meta)),
      feed: page.items.map(toAttendanceRow),
    }
  }),

  /**
   * A scan, or a name found by hand.
   *
   * The five outcomes come back as data, not as an error: an unknown code, a
   * ticket for another event and a refunded one are three different things for
   * the person on the door to do, and an exception would collapse all three
   * into "something went wrong".
   */
  action: pageAction(async ({ request }: LoaderArgs): Promise<{ scan: ScanFeedback }> => {
    const form = await request.formData()
    const eventId = String(form.get('eventId') ?? '')
    const ticketId = String(form.get('ticketId') ?? '')
    const result = ticketId
      ? await doorApi.admit(eventId, ticketId)
      : await doorApi.scan(eventId, String(form.get('qrToken') ?? '').trim())
    return { scan: toScanFeedback(result) }
  }),
}

/** The station's manual search — a resource route, asked only when typed into. */
export const checkInSearchRoute = {
  loader: pageData(async ({ request }: LoaderArgs): Promise<{ rows: AttendanceRow[] }> => {
    const params = queryOf(request)
    const eventId = params.get('eventId') ?? ''
    const search = params.get('q')?.trim() ?? ''
    if (!eventId || !search) return { rows: [] }
    const page = await doorApi.roll(eventId, { page: 1, limit: FEED_SIZE, search })
    return { rows: page.items.map(toAttendanceRow) }
  }),
}
