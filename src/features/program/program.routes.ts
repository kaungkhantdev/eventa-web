import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { intParam } from '@/lib/urlFilters'
import { eventsApi } from '@/features/events/events.api'
import { programApi, type SessionInput, type SpeakerInput } from './program.api'
import { agendaDaysOf, sessionTypeOf, toAgendaBlock, toSpeakerCard } from './program.mapper'
import type { AgendaBlock, AgendaDay, SpeakerCard } from './program.types'

/**
 * The agenda and the speaker directory (US-PROG-01..07).
 *
 * Both are scoped to ONE event on the API. The kit's "All events" picker had
 * nothing behind it — a session belongs to a day of a particular event — so the
 * chosen event lives in the URL as `?eventId=` and defaults to the most recent
 * one, which is what an organizer is usually working on.
 */

const EVENT_OPTIONS = 100
const MAX_SEARCH = 120

/** One entry in the event picker both screens carry. */
export interface EventChoice {
  id: string
  name: string
  startAt: string
  endAt: string | null
}

async function eventChoices(): Promise<EventChoice[]> {
  const page = await eventsApi.list({ limit: EVENT_OPTIONS, sort: 'recent' })
  return page.items.map((event) => ({
    id: event.id,
    name: event.name,
    startAt: event.startAt,
    endAt: event.endAt,
  }))
}

/** The event being worked on: whatever the URL names, else the most recent. */
function chosenEvent(events: EventChoice[], params: URLSearchParams): EventChoice | null {
  const asked = params.get('eventId')
  return events.find((event) => event.id === asked) ?? events[0] ?? null
}

/* ── agenda ───────────────────────────────────────────────────────────── */

export interface AgendaData {
  events: EventChoice[]
  event: EventChoice | null
  days: AgendaDay[]
  /** Every session on the event, each carrying the day column it belongs in. */
  blocks: AgendaBlock[]
  /** Every speaker on the event, for the session form's picker. */
  speakers: { id: string; name: string }[]
}

async function loadAgenda({ request }: LoaderArgs): Promise<AgendaData> {
  const params = queryOf(request)
  const events = await eventChoices()
  const event = chosenEvent(events, params)
  if (!event) return { events, event: null, days: [], blocks: [], speakers: [] }

  const [sessions, speakers] = await Promise.all([
    programApi.sessions(event.id),
    programApi.speakers(event.id, { limit: EVENT_OPTIONS }),
  ])
  return {
    events,
    event,
    days: agendaDaysOf(event.startAt, event.endAt),
    // The whole event in one read. Grouping into columns is a layout decision,
    // not a second request, and an agenda is small enough to hold at once.
    blocks: sessions.map(toAgendaBlock),
    speakers: speakers.items.map((s) => ({ id: s.id, name: s.name })),
  }
}

export function sessionInputOf(form: FormData): SessionInput {
  const version = Number(form.get('version'))
  return {
    day: Number(form.get('day')) || 1,
    startTime: String(form.get('startTime') ?? ''),
    endTime: String(form.get('endTime') ?? '') || undefined,
    title: String(form.get('title') ?? '').trim(),
    type: sessionTypeOf(form.get('type')),
    room: String(form.get('room') ?? '').trim() || undefined,
    description: String(form.get('description') ?? '').trim() || undefined,
    // Several speakers can share a session, so every checked box counts.
    speakerIds: form.getAll('speakerIds').map(String).filter(Boolean),
    confirmSpeakerClash: form.get('confirmSpeakerClash') === 'on',
    version: Number.isInteger(version) && version > 0 ? version : undefined,
  }
}

async function runAgendaAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')
  const eventId = String(form.get('eventId') ?? '')
  const id = String(form.get('sessionId') ?? '')

  if (intent === 'create') {
    await programApi.createSession(eventId, sessionInputOf(form))
    return
  }
  if (intent === 'update') {
    await programApi.updateSession(eventId, id, sessionInputOf(form))
    return
  }
  await programApi.removeSession(eventId, id)
}

export const agendaRoute = {
  loader: pageData(loadAgenda),
  action: pageAction(runAgendaAction),
}

/* ── speakers ─────────────────────────────────────────────────────────── */

export interface SpeakersData {
  events: EventChoice[]
  event: EventChoice | null
  cards: SpeakerCard[]
  window: PageWindow
}

async function loadSpeakers({ request }: LoaderArgs): Promise<SpeakersData> {
  const params = queryOf(request)
  const events = await eventChoices()
  const event = chosenEvent(events, params)
  if (!event) return { events, event: null, cards: [], window: EMPTY_WINDOW }

  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const search = params.get('q')?.trim()
  const page = await programApi.speakers(event.id, {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    search: search ? search.slice(0, MAX_SEARCH) : undefined,
  })

  return {
    events,
    event,
    cards: page.items.map(toSpeakerCard),
    window: pageWindow(page.meta),
  }
}

/** What a workspace with no events shows: nothing, and no count either. */
const EMPTY_WINDOW: PageWindow = {
  from: 0,
  to: 0,
  total: 0,
  page: 1,
  pageCount: 1,
  size: DEFAULT_PAGE_SIZE,
}

export function speakerInputOf(form: FormData): SpeakerInput {
  const version = Number(form.get('version'))
  return {
    name: String(form.get('name') ?? '').trim(),
    role: String(form.get('role') ?? '').trim() || undefined,
    email: String(form.get('email') ?? '').trim() || undefined,
    phone: String(form.get('phone') ?? '').trim() || undefined,
    talkTitle: String(form.get('talkTitle') ?? '').trim() || undefined,
    bio: String(form.get('bio') ?? '').trim() || undefined,
    version: Number.isInteger(version) && version > 0 ? version : undefined,
  }
}

async function runSpeakersAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')
  const eventId = String(form.get('eventId') ?? '')
  const id = String(form.get('speakerId') ?? '')

  if (intent === 'create') {
    await programApi.createSpeaker(eventId, speakerInputOf(form))
    return
  }
  if (intent === 'update') {
    await programApi.updateSpeaker(eventId, id, speakerInputOf(form))
    return
  }
  await programApi.removeSpeaker(eventId, id)
}

export const speakersRoute = {
  loader: pageData(loadSpeakers),
  action: pageAction(runSpeakersAction),
}
