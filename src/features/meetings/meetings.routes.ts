import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { api, type Query } from '@/lib/api'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { toMeetingCard } from './meetings.mapper'
import type {
  MeetingBucket,
  MeetingCard,
  MeetingCountsWire,
  MeetingMode,
  MeetingType,
  MeetingWire,
} from './meetings.types'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'

/**
 * Meetings with venues, sponsors, vendors and speakers (US-MTG-01..06).
 *
 * Bucket, type, event, search and page live in the URL. Which bucket a meeting
 * falls in is the API's answer, derived per request from the Bangkok day —
 * "today" is a Thai calendar fact, not the reader's clock.
 */

export const MEETING_TABS = ['all', 'today', 'upcoming', 'past'] as const
export type MeetingTab = (typeof MEETING_TABS)[number]

export const MEETING_TYPES: readonly MeetingType[] = [
  'Venue',
  'Sponsor',
  'Vendor',
  'Speaker',
  'Internal',
]

export const MEETING_MODES: readonly MeetingMode[] = ['Video', 'In person', 'Phone']

const MAX_SEARCH = 120
interface MeetingQuery extends Query {
  page?: number
  limit?: number
  bucket?: MeetingBucket
  type?: MeetingType
  eventId?: string
  search?: string
}

const meetingsApi = {
  list: (query: MeetingQuery) => api.list<MeetingWire>('/meetings', { query }),
  schedule: (body: unknown) => api.post<MeetingWire>('/meetings', body),
  reschedule: (id: string, body: unknown) => api.patch<MeetingWire>(`/meetings/${id}`, body),
  cancel: (id: string, reason: string | undefined) =>
    api.post<void>(`/meetings/${id}/cancel`, { reason }),
  /** Re-send the calendar invite after a failed sync (US-MTG-04). */
  sync: (id: string) => api.post<void>(`/meetings/${id}/sync`),
}

export function tabOf(params: URLSearchParams): MeetingTab {
  return enumParam(params, 'tab', MEETING_TABS, 'all')
}

export function listQueryOf(params: URLSearchParams): MeetingQuery {
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const tab = tabOf(params)
  const type = params.get('type')
  const search = params.get('q')?.trim()
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    bucket: tab === 'all' ? undefined : (tab as MeetingBucket),
    type: MEETING_TYPES.includes(type as MeetingType) ? (type as MeetingType) : undefined,
    eventId: params.get('eventId') ?? undefined,
    search: search ? search.slice(0, MAX_SEARCH) : undefined,
  }
}

export interface MeetingsData {
  cards: MeetingCard[]
  window: PageWindow
  counts: MeetingCountsWire
  events: EventOption[]
}

const NO_COUNTS: MeetingCountsWire = { all: 0, today: 0, upcoming: 0, past: 0 }

async function loadMeetings({ request }: LoaderArgs): Promise<MeetingsData> {
  const query = listQueryOf(queryOf(request))
  const [page, events] = await Promise.all([meetingsApi.list(query), eventOptions()])

  if (page.meta.total > 0 && query.page! > page.meta.totalPages) {
    throw redirect(withPage(request.url, page.meta.totalPages))
  }

  return {
    cards: page.items.map(toMeetingCard),
    window: pageWindow(page.meta),
    counts: (page.meta.counts as MeetingCountsWire | undefined) ?? NO_COUNTS,
    events,
  }
}

function withPage(current: string, page: number): string {
  const url = new URL(current)
  url.searchParams.set('page', String(page))
  return url.pathname + url.search
}

/**
 * A filled-in panel → what `POST /meetings` accepts.
 *
 * Times go as the Bangkok wall clock the organizer typed, with the date beside
 * them; the API resolves the instant. Sending a UTC timestamp instead would
 * make a 10:00 meeting depend on where the person scheduling it was sitting.
 */
export function meetingInputOf(form: FormData): Record<string, unknown> {
  const eventId = String(form.get('eventId') ?? '')
  return {
    title: String(form.get('title') ?? '').trim(),
    date: String(form.get('date') ?? ''),
    startTime: String(form.get('startTime') ?? ''),
    endTime: String(form.get('endTime') ?? ''),
    type: String(form.get('type') ?? 'Internal'),
    mode: String(form.get('mode') ?? 'Video'),
    person: String(form.get('person') ?? '').trim(),
    role: String(form.get('role') ?? '').trim() || undefined,
    guestEmail: String(form.get('guestEmail') ?? '').trim(),
    // Absent means a general meeting covering every event, which the API
    // spells by omitting the key — not by an empty string.
    eventId: eventId || undefined,
    notes: String(form.get('notes') ?? '').trim() || undefined,
  }
}

async function runMeetingsAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')
  const id = String(form.get('meetingId') ?? '')

  if (intent === 'schedule') {
    await meetingsApi.schedule(meetingInputOf(form))
    return
  }
  if (intent === 'reschedule') {
    // The version travels back so a change made in another tab is refused
    // rather than silently overwritten.
    await meetingsApi.reschedule(id, {
      ...meetingInputOf(form),
      version: Number(form.get('version')),
    })
    return
  }
  if (intent === 'sync') {
    await meetingsApi.sync(id)
    return
  }
  await meetingsApi.cancel(id, String(form.get('reason') ?? '').trim() || undefined)
}

export const meetingsRoute = {
  loader: pageData(loadMeetings),
  action: pageAction(runMeetingsAction),
}
