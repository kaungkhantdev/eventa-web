import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { programApi } from '@/features/program/program.api'
import { sessionTypeOf } from '@/features/program/program.mapper'
import { ticketingApi } from '@/features/ticketing/ticketing.api'
import { eventDetailApi } from './eventDetail.api'
import {
  toAttendeeRow,
  toEventHeader,
  toOverview,
  toRegistrationRow,
  toSessionDay,
  toSpeakerCard,
  toTicketRow,
  type AgendaDay,
  type AttendeeRow,
  type EventHeader,
  type OverviewTiles,
  type RegistrationRow,
  type SpeakerCard,
  type TicketRow,
} from './eventDetail.mapper'

/**
 * The event workspace (US-EVT-14).
 *
 * Which event and which tab both live in the URL, so a tab can be linked to and
 * the back button steps through them. Only the open tab is fetched: the six
 * panels answer different questions of different tables, and loading all of them
 * to show one would make every visit pay for five it does not use.
 */

export const EVENT_TABS = [
  'overview',
  'registrations',
  'attendees',
  'speakers',
  'agenda',
  'tickets',
] as const
export type EventTab = (typeof EVENT_TABS)[number]

/** The API's own payment-status filters for the registrations tab. */
export const REGISTRATION_FILTERS = ['all', 'paid', 'pending', 'refunded'] as const
export type RegistrationFilter = (typeof REGISTRATION_FILTERS)[number]

/** How many speakers the tab shows before it would need paging of its own. */
const SPEAKER_LIMIT = 100

export function tabOf(params: URLSearchParams): EventTab {
  return enumParam(params, 'tab', EVENT_TABS, 'overview')
}

export function filterOf(params: URLSearchParams): RegistrationFilter {
  return enumParam(params, 'status', REGISTRATION_FILTERS, 'all')
}

/** What every tab shows: which event this is, and how it is doing. */
interface EventShell {
  header: EventHeader
  overview: OverviewTiles
}

/** What the open tab contributes. Kept as its own union so each arm is exact. */
export type TabData =
  | { tab: 'overview' }
  | {
      tab: 'registrations'
      rows: RegistrationRow[]
      window: PageWindow
      counts: { all: number; paid: number; pending: number; refunded: number }
      filter: RegistrationFilter
    }
  | { tab: 'attendees'; attendees: AttendeeRow[]; window: PageWindow }
  | { tab: 'speakers'; speakers: SpeakerCard[] }
  | { tab: 'agenda'; days: AgendaDay[] }
  | { tab: 'tickets'; tickets: TicketRow[] }

export type EventDetailData = EventShell & TabData

/** The event this screen is about, or back to the list if none was named. */
function eventIdOf(request: Request): string {
  const id = queryOf(request).get('id')
  if (!id) throw redirect('/admin/events')
  return id
}

async function loadEventDetail({ request }: LoaderArgs): Promise<EventDetailData> {
  const id = eventIdOf(request)
  const params = queryOf(request)
  const tab = tabOf(params)

  const [event, overview] = await Promise.all([
    eventDetailApi.event(id),
    eventDetailApi.overview(id),
  ])
  const shell: EventShell = { header: toEventHeader(event), overview: toOverview(overview) }

  return { ...shell, ...(await loadTab(id, tab, params)) }
}

async function loadTab(
  id: string,
  tab: EventTab,
  params: URLSearchParams,
): Promise<TabData> {
  const limit = pageSizeOf(params)

  if (tab === 'registrations') {
    const filter = filterOf(params)
    const page = await eventDetailApi.registrations(id, {
      page: intParam(params, 'page', 1),
      limit,
      status: filter === 'all' ? undefined : filter,
    })
    return {
      tab,
      rows: page.items.map(toRegistrationRow),
      window: pageWindow(page),
      counts: page.statusCounts,
      filter,
    }
  }

  if (tab === 'attendees') {
    const page = await eventDetailApi.attendees(id, {
      page: intParam(params, 'page', 1),
      limit,
    })
    return { tab, attendees: page.items.map(toAttendeeRow), window: pageWindow(page.meta) }
  }

  if (tab === 'speakers') {
    const page = await programApi.speakers(id, { limit: SPEAKER_LIMIT })
    return { tab, speakers: page.items.map(toSpeakerCard) }
  }

  if (tab === 'agenda') {
    return { tab, days: toSessionDay(await programApi.sessions(id)) }
  }

  if (tab === 'tickets') {
    return { tab, tickets: (await ticketingApi.forEvent(id)).map(toTicketRow) }
  }

  return { tab: 'overview' }
}

function pageSizeOf(params: URLSearchParams): number {
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  return isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE
}

/** Adding a session or a ticket tier from the workspace's slide-overs. */
async function runEventDetailAction({ request }: LoaderArgs): Promise<void> {
  const id = eventIdOf(request)
  const form = await request.formData()

  if (form.get('intent') === 'add-session') {
    await programApi.createSession(id, {
      day: Number(form.get('day')) || 1,
      startTime: String(form.get('startTime') ?? ''),
      endTime: String(form.get('endTime') ?? '') || undefined,
      title: String(form.get('title') ?? '').trim(),
      type: sessionTypeOf(form.get('type')),
      room: String(form.get('room') ?? '') || undefined,
    })
    return
  }

  if (form.get('intent') === 'remove-session') {
    await programApi.removeSession(id, String(form.get('sessionId') ?? ''))
    return
  }

  // A free tier carries no price at all; sending 0 would describe a paid tier
  // that happens to cost nothing, which the API prices differently.
  const isFree = form.get('isFree') === 'on'
  await ticketingApi.add(id, {
    name: String(form.get('name') ?? '').trim(),
    isFree,
    priceSatang: isFree ? undefined : bahtToSatang(String(form.get('price') ?? '')),
    total: Number(form.get('total')) || undefined,
  })
}

/** What the organizer typed in baht → the integer satang the API stores. */
export function bahtToSatang(price: string): number | undefined {
  const baht = Number(price)
  return Number.isFinite(baht) && baht >= 0 ? Math.round(baht * 100) : undefined
}

export const eventDetailRoute = {
  loader: pageData(loadEventDetail),
  action: pageAction(runEventDetailAction),
}
