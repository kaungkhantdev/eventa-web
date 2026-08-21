import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { api, type Query } from '@/lib/api'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { eventsApi } from '@/features/events/events.api'
import { toAttendeeRow } from './directory.mapper'
import type {
  AttendeeRow,
  AttendeeSegment,
  AttendeeSort,
  AttendeeTag,
  AttendeeWire,
  SegmentCountsWire,
} from './directory.types'

/**
 * Everyone who has ever registered (US-CHK-06/07).
 *
 * The segment, tag, sort, search and page are all URL parameters: the API
 * filters and sorts server-side across the whole directory, so the pill counts
 * and the rows describe the same answer. Sorting a fetched page instead would
 * rank the ten it happened to receive.
 */

export const SEGMENTS = ['all', 'new', 'checked_in', 'vip'] as const
export const SORTS = ['recent', 'name', 'events', 'tickets'] as const
export const TAGS: readonly AttendeeTag[] = ['VIP', 'Speaker', 'Sponsor', 'Student']

const MAX_SEARCH = 120
const EVENT_OPTIONS = 100

interface DirectoryQuery extends Query {
  page?: number
  limit?: number
  segment?: AttendeeSegment
  tag?: AttendeeTag
  search?: string
  sort?: AttendeeSort
}

const attendeesApi = {
  list: (query: DirectoryQuery) => api.list<AttendeeWire>('/attendees', { query }),
  /** Invite people to an event by email (US-CHK-07). */
  invite: (eventId: string, emails: string[], message: string | undefined) =>
    api.post<void>(`/events/${eventId}/attendees/email`, { emails, message }),
}

export function segmentOf(params: URLSearchParams): AttendeeSegment {
  return enumParam(params, 'segment', SEGMENTS, 'all')
}

export function listQueryOf(params: URLSearchParams): DirectoryQuery {
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const search = params.get('q')?.trim()
  const tag = params.get('tag')
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    segment: segmentOf(params),
    tag: TAGS.includes(tag as AttendeeTag) ? (tag as AttendeeTag) : undefined,
    search: search ? search.slice(0, MAX_SEARCH) : undefined,
    sort: enumParam(params, 'sort', SORTS, 'recent'),
  }
}

export interface DirectoryData {
  rows: AttendeeRow[]
  window: PageWindow
  counts: SegmentCountsWire
  /** The events an invitation can be sent for. */
  events: { id: string; name: string }[]
}

const NO_COUNTS: SegmentCountsWire = { all: 0, new: 0, checkedIn: 0, vip: 0 }

async function loadDirectory({ request }: LoaderArgs): Promise<DirectoryData> {
  const query = listQueryOf(queryOf(request))
  const [page, events] = await Promise.all([attendeesApi.list(query), eventOptions()])

  if (page.meta.total > 0 && query.page! > page.meta.totalPages) {
    throw redirect(withPage(request.url, page.meta.totalPages))
  }

  return {
    rows: page.items.map(toAttendeeRow),
    window: pageWindow(page.meta),
    counts: (page.meta.counts as SegmentCountsWire | undefined) ?? NO_COUNTS,
    events,
  }
}

async function eventOptions(): Promise<{ id: string; name: string }[]> {
  const page = await eventsApi.list({ limit: EVENT_OPTIONS, sort: 'recent' })
  return page.items.map((event) => ({ id: event.id, name: event.name }))
}

function withPage(current: string, page: number): string {
  const url = new URL(current)
  url.searchParams.set('page', String(page))
  return url.pathname + url.search
}

/**
 * Addresses typed into the invite box, one per line or comma-separated.
 *
 * De-duplicated because sending the same person two invitations to the same
 * event is the kind of thing that gets a workspace's mail marked as spam.
 */
export function emailsOf(raw: string): string[] {
  const seen = new Set<string>()
  for (const part of raw.split(/[\s,;]+/)) {
    const email = part.trim().toLowerCase()
    if (email.includes('@')) seen.add(email)
  }
  return [...seen]
}

async function runDirectoryAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const emails = emailsOf(String(form.get('emails') ?? ''))
  await attendeesApi.invite(
    String(form.get('eventId') ?? ''),
    emails,
    String(form.get('message') ?? '').trim() || undefined,
  )
}

export const directoryRoute = {
  loader: pageData(loadDirectory),
  action: pageAction(runDirectoryAction),
}
