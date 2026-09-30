import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { bangkokDayKey, bangkokInstant } from '@/lib/format'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { ticketsApi, type ListTicketsQuery, type TicketInput } from './tickets.api'
import { toTicketCard } from './tickets.mapper'
import type { TicketCard, TicketCountsWire, TicketShareWire } from './tickets.types'
import type { TicketStatus } from './types'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'

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
 * The edit panel's form → the fields the wire carries.
 *
 * A free tier is priced at nothing whatever is left in the price box, since the
 * two controls can disagree and only one of them is the answer.
 */
export function ticketInputOf(form: FormData): TicketInput {
  const isFree = String(form.get('type') ?? 'paid') === 'free'
  const version = Number(form.get('version'))
  return {
    name: String(form.get('name') ?? '').trim(),
    isFree,
    priceSatang: isFree ? 0 : satangOrNothing(form.get('price')),
    total: figureOrNothing(form.get('total')),
    maxPerOrder: Number(form.get('maxPerOrder')) || undefined,
    salesStartAt: windowInstant(form.get('salesStartAt'), form.get('salesStartWas')),
    salesEndAt: windowInstant(form.get('salesEndAt'), form.get('salesEndWas')),
    version: Number.isInteger(version) && version > 0 ? version : undefined,
  }
}

const SATANG_PER_BAHT = 100

/**
 * Baht typed into the price box → the integer satang the wire carries.
 *
 * Rounded because satang is the smallest unit there is: a price of 10.005 baht
 * is not payable, and a float would be refused by the DTO.
 */
function satangOrNothing(value: FormDataEntryValue | null): number | undefined {
  const baht = figureOrNothing(value)
  return baht === undefined ? undefined : Math.round(baht * SATANG_PER_BAHT)
}

/**
 * An emptied box is "leave it as it is", never 0.
 *
 * The panel opens with the tier's own price and allocation already in the
 * boxes, so a box with nothing in it is one the organizer is still typing in.
 * Read as 0 it would put a paid tier on sale for nothing, or throw its
 * allocation open, on a save that was meant to change something else; sent as
 * an absent key, the API keeps what it holds. 0 is still sayable by typing it.
 *
 * What cannot be read at all — a box the browser degraded to plain text, a
 * replayed submission — is left out for the same reason, rather than becoming
 * the one figure nobody typed.
 */
function figureOrNothing(value: FormDataEntryValue | null): number | undefined {
  const typed = String(value ?? '').trim()
  if (!typed) return undefined
  const figure = Number(typed)
  return Number.isFinite(figure) ? figure : undefined
}

/**
 * A day picked in a date box → the instant the API stores.
 *
 * `was` is the instant the panel opened the box with. A date box holds a day
 * and the stored instant holds a time of day as well, so rebuilding the window
 * from the day alone would drag it back to Bangkok midnight: up to a day of
 * selling lost on a save that changed nothing, and a window that opens and
 * closes inside one Bangkok day collapsed onto itself, which the API refuses
 * outright. So the instant goes back verbatim while the box still names its
 * day, and only a day the organizer actually moved becomes a fresh midnight.
 *
 * A blank box is "no window", which the API expects as an absent key — and,
 * for a window it was prefilled with, cannot happen: the panel marks those
 * boxes required, because an absent key means "unchanged" here and clearing one
 * would otherwise look like removing a window it silently kept.
 */
function windowInstant(
  day: FormDataEntryValue | null,
  was: FormDataEntryValue | null,
): string | undefined {
  const picked = String(day ?? '')
  const stored = String(was ?? '')
  if (!picked) return undefined
  if (stored && bangkokDayKey(stored) === picked) return stored
  return bangkokInstant(picked) ?? undefined
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

/* Re-exported: this route module is where the page and its panels read the
   option shape from, and they should not each reach into the events feature. */
export type { EventOption }
