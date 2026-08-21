import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { bangkokInstant } from '@/lib/format'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { eventsApi } from '@/features/events/events.api'
import { ticketsApi, type ListTicketsQuery, type TicketInput } from './tickets.api'
import { toTicketCard } from './tickets.mapper'
import type { TicketCard, TicketCountsWire, TicketShareWire } from './tickets.types'
import type { TicketStatus } from './types'

/**
 * The cross-event ticket inventory (US-TKT-01..06).
 *
 * The tab, the event, the search and the page live in the URL: the API filters
 * and pages server-side, so the pill counts and the cards below them come from
 * one request and cannot disagree.
 */

export const TICKET_TABS = ['all', 'onsale', 'scheduled', 'paused', 'soldout'] as const
export type TicketTab = (typeof TICKET_TABS)[number]

/** `@MaxLength(120)` on the DTO — past it the API answers 400, not a list. */
const MAX_SEARCH = 120

/** How many events the filter offers; the API's own maximum for one page. */
const EVENT_OPTIONS = 100

export function tabOf(params: URLSearchParams): TicketTab {
  return enumParam(params, 'tab', TICKET_TABS, 'all')
}

export function listQueryOf(params: URLSearchParams): ListTicketsQuery {
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const tab = tabOf(params)
  const search = params.get('q')?.trim()
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    // All sends no status, so every bucket is listed.
    status: tab === 'all' ? undefined : (tab as TicketStatus),
    eventId: params.get('eventId') ?? undefined,
    search: search ? search.slice(0, MAX_SEARCH) : undefined,
  }
}

export interface TabCounts extends TicketCountsWire {
  all: number
}

/** Every status, plus their sum for the All pill. */
export function tabCountsOf(counts: TicketCountsWire): TabCounts {
  return {
    ...counts,
    all: counts.onsale + counts.scheduled + counts.paused + counts.soldout,
  }
}

/**
 * Baht typed into a form → the integer satang the wire carries.
 *
 * Rounded because satang is the smallest unit there is: a price of 10.005 baht
 * is not payable, and a float would be refused by the DTO. A free tier is
 * priced at nothing whatever is left in the price box, since the two controls
 * can disagree and only one of them is the answer.
 */
export function ticketInputOf(form: FormData): TicketInput {
  const isFree = String(form.get('type') ?? 'paid') === 'free'
  const price = Number(form.get('price')) || 0
  const version = Number(form.get('version'))
  return {
    name: String(form.get('name') ?? '').trim(),
    isFree,
    priceSatang: isFree ? 0 : Math.round(price * SATANG_PER_BAHT),
    total: Number(form.get('total')) || 0,
    maxPerOrder: Number(form.get('maxPerOrder')) || undefined,
    salesStartAt: instantOrNothing(form.get('salesStartAt')),
    salesEndAt: instantOrNothing(form.get('salesEndAt')),
    version: Number.isInteger(version) && version > 0 ? version : undefined,
  }
}

const SATANG_PER_BAHT = 100

/** A blank date field is "no window", which the API expects as an absent key. */
function instantOrNothing(value: FormDataEntryValue | null): string | undefined {
  return bangkokInstant(String(value ?? '')) ?? undefined
}

/** One entry in the event filter and the panel's event select. */
export interface EventOption {
  id: string
  name: string
}

export interface TicketsData {
  cards: TicketCard[]
  window: PageWindow
  tabs: TabCounts
  events: EventOption[]
}

async function loadTickets({ request }: LoaderArgs): Promise<TicketsData> {
  const query = listQueryOf(queryOf(request))
  // The counts describe the whole workspace and the events fill the filter, so
  // both are fetched beside the page rather than derived from the cards shown.
  const [page, counts, events] = await Promise.all([
    ticketsApi.list(query),
    ticketsApi.counts(),
    eventOptions(),
  ])

  // Deleting the last tier on page 3 leaves the loader asking for a page that
  // no longer exists; send them to the last one that does.
  if (page.meta.total > 0 && query.page! > page.meta.totalPages) {
    throw redirect(withPage(request.url, page.meta.totalPages))
  }

  return {
    cards: page.items.map(toTicketCard),
    window: pageWindow(page.meta),
    tabs: tabCountsOf(counts),
    events,
  }
}

async function eventOptions(): Promise<EventOption[]> {
  const page = await eventsApi.list({ limit: EVENT_OPTIONS, sort: 'recent' })
  return page.items.map((event) => ({ id: event.id, name: event.name }))
}

function withPage(current: string, page: number): string {
  const url = new URL(current)
  url.searchParams.set('page', String(page))
  return url.pathname + url.search
}

/**
 * Creating, editing, retiring and pausing a tier.
 *
 * Every branch names the event as well as the tier: the API scopes ticket
 * writes to their event, which is what keeps one workspace's edit from ever
 * addressing another's inventory.
 */
async function runTicketsAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')
  const eventId = String(form.get('eventId') ?? '')
  const ticketId = String(form.get('ticketId') ?? '')

  if (intent === 'create') {
    await ticketsApi.create(eventId, ticketInputOf(form))
    return
  }
  if (intent === 'update') {
    await ticketsApi.update(eventId, ticketId, ticketInputOf(form))
    return
  }
  if (intent === 'pause') {
    await ticketsApi.pause(eventId, ticketId)
    return
  }
  if (intent === 'resume') {
    await ticketsApi.resume(eventId, ticketId)
    return
  }
  await ticketsApi.remove(eventId, ticketId)
}

export const ticketsRoute = {
  loader: pageData(loadTickets),
  action: pageAction(runTicketsAction),
}

/**
 * The share link and QR for one tier, loaded on demand.
 *
 * Its own route rather than part of the page's data: the inventory shows ten
 * cards and nobody opens ten QR codes, so fetching them all up front would cost
 * ten requests to answer a question nobody asked.
 */
export const ticketShareRoute = {
  loader: pageData(async ({ request }: LoaderArgs): Promise<TicketShareWire> => {
    const params = queryOf(request)
    return ticketsApi.share(params.get('eventId') ?? '', params.get('ticketId') ?? '')
  }),
}
