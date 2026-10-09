import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { mapPanel, panel, type Panel } from '@/app/panels'
import { api, type Query } from '@/lib/api'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { toTimeline } from './activity.mapper'
import type { AuditEntryWire, TimelineEntry } from './activity.types'
import { contactPatchOfForm, hasContactChanges } from './contact.changes'
import { toAttendeeRow } from './directory.mapper'
import type {
  AttendeeRow,
  AttendeeSegment,
  AttendeeSort,
  AttendeeTag,
  AttendeeWire,
  ContactPatch,
  SegmentCountsWire,
} from './directory.types'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'

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
interface DirectoryQuery extends Query {
  page?: number
  limit?: number
  segment?: AttendeeSegment
  tag?: AttendeeTag
  search?: string
  sort?: AttendeeSort
}

/** The URL parameter naming whose profile panel is open. */
export const PROFILE_PARAM = 'profile'

/** How far back the panel's timeline reaches before deferring to the audit log. */
const TIMELINE_LIMIT = 20

/** The one kind of record `GET /audit` can be asked the trail of today. */
const ATTENDEE_SUBJECT = 'attendee'

interface ActivityQuery extends Query {
  subjectType: typeof ATTENDEE_SUBJECT
  subjectId: number
  limit: number
}

/**
 * "What happened to this attendee", as `GET /audit` takes it.
 *
 * The subject is two parameters and the DTO refuses half of it — "Send
 * subjectType and subjectId together — half a subject matches nothing in
 * particular" — so the pair is built here, once, and cannot be sent apart. The
 * query is also behind a `forbidNonWhitelisted` pipe, which is why nothing else
 * is added to it speculatively: an unknown parameter is a 400, not an ignored
 * one.
 */
export function activityQueryOf(attendeeId: number): ActivityQuery {
  return { subjectType: ATTENDEE_SUBJECT, subjectId: attendeeId, limit: TIMELINE_LIMIT }
}

const attendeesApi = {
  list: (query: DirectoryQuery) => api.list<AttendeeWire>('/attendees', { query }),
  /**
   * One attendee's recorded history (US-REG-08 AC5).
   *
   * The audit trail is the only record of a contact correction — the same
   * entries the settings screen's security log lists, narrowed to one subject.
   * There is deliberately no second activity table to read instead.
   */
  activity: (attendeeId: number) =>
    api.list<AuditEntryWire>('/audit', { query: activityQueryOf(attendeeId) }),
  /** Invite people to an event by email (US-CHK-07). */
  invite: (eventId: string, emails: string[], message: string | undefined) =>
    api.post<void>(`/events/${eventId}/attendees/email`, { emails, message }),
  /**
   * Correct a name, email or phone (US-REG-08) — `regManage`, not `regView`.
   *
   * Answers with the whole directory entry, which is deliberately discarded:
   * the fetcher revalidates this route's loader, and that re-reads the segment
   * counts beside the row as well. Splicing the one row back in would leave a
   * second copy of server state here to go stale against it.
   */
  updateContact: (attendeeId: number, patch: ContactPatch) =>
    api.patch<AttendeeWire>(`/attendees/${attendeeId}`, patch),
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

/**
 * Which attendee's profile the URL is asking for, if any.
 *
 * Which panel is open is URL state like every filter on this page: the back
 * button closes it, the link can be shared, and — the reason it has to be in
 * the URL rather than in the page — the loader is what reads the timeline, and
 * a loader sees nothing but the request.
 *
 * Anything the API would refuse is read as "nobody". `subjectId` is validated
 * `@IsInt() @Min(1)` behind a `forbidNonWhitelisted` pipe, so a hand-typed
 * `?profile=0` would come back 400 — and a 400 under the panel would be
 * reported as a failed history when nothing is wrong with the attendee's.
 */
export function profileIdOf(params: URLSearchParams): number | null {
  const id = intParam(params, PROFILE_PARAM, 0)
  return id > 0 ? id : null
}

/** The history behind one profile panel, and what to say if it never arrived. */
export interface AttendeeActivity {
  /** Whose — so the page can tell a loaded timeline from the previous one. */
  attendeeId: number
  timeline: Panel<TimelineEntry[]>
}

export interface DirectoryData {
  rows: AttendeeRow[]
  window: PageWindow
  counts: SegmentCountsWire
  /** The events an invitation can be sent for. */
  events: EventOption[]
  /** Null when no profile is open — the common case. */
  activity: AttendeeActivity | null
}

const NO_COUNTS: SegmentCountsWire = { all: 0, new: 0, checkedIn: 0, vip: 0 }

async function loadDirectory({ request }: LoaderArgs): Promise<DirectoryData> {
  const params = queryOf(request)
  const query = listQueryOf(params)
  const profileId = profileIdOf(params)
  const [page, events, activity] = await Promise.all([
    attendeesApi.list(query),
    eventOptions(),
    // Wrapped rather than awaited bare: the profile's subject is the contact
    // details, which the directory row already carries, and the history is
    // context beside them. A failed read says so in its own section instead of
    // replacing a panel that can still do its job. `panel()` keeps letting an
    // expired session and a programming error through to their own handlers.
    loadActivity(profileId),
  ])

  if (page.meta.total > 0 && query.page! > page.meta.totalPages) {
    throw redirect(withPage(request.url, page.meta.totalPages))
  }

  return {
    rows: page.items.map(toAttendeeRow),
    window: pageWindow(page.meta),
    counts: (page.meta.counts as SegmentCountsWire | undefined) ?? NO_COUNTS,
    events,
    activity,
  }
}

async function loadActivity(attendeeId: number | null): Promise<AttendeeActivity | null> {
  if (attendeeId === null) return null
  const read = await panel(attendeesApi.activity(attendeeId))
  return { attendeeId, timeline: mapPanel(read, (page) => toTimeline(page.items)) }
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

/** What the edit panel asks for; anything else on this route is an invitation. */
export const CONTACT_INTENT = 'contact'

async function runDirectoryAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  if (String(form.get('intent') ?? '') === CONTACT_INTENT) return saveContact(form)
  return invite(form)
}

async function invite(form: FormData): Promise<void> {
  const emails = emailsOf(String(form.get('emails') ?? ''))
  await attendeesApi.invite(
    String(form.get('eventId') ?? ''),
    emails,
    String(form.get('message') ?? '').trim() || undefined,
  )
}

/**
 * Correct an attendee's contact details (US-REG-08).
 *
 * The panel submits what was typed alongside what the row said when it opened,
 * because only the difference is sent — see `contactPatchOf`. A refusal comes
 * back through `pageAction` as the API's own sentence and is shown beside the
 * control that was used, so the panel stays open with the typing still in it.
 */
async function saveContact(form: FormData): Promise<void> {
  const patch = contactPatchOfForm(form)
  if (!hasContactChanges(patch)) return
  await attendeesApi.updateContact(Number(form.get('attendeeId')), patch)
}

export const directoryRoute = {
  loader: pageData(loadDirectory),
  action: pageAction(runDirectoryAction),
}
