import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { ApiError } from '@/lib/api'
import { satang } from '@/lib/format'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { eventsApi } from '@/features/events/events.api'
import { registrationsApi, type ListRegistrationsQuery, type TierWire } from './registrations.api'
import { toRegistrationRow } from './registrations.mapper'
import type {
  Registration,
  RegistrationCounts,
  RegistrationEntry,
  RegistrationWireStatus,
} from './registrations.types'

/**
 * What the registrations queue loads, and what its controls do (US-REG-01..03).
 *
 * The tab, the event, the search and the page all live in the URL: the API
 * filters and pages server-side, so the query string is what both the request
 * and the screen read. Nothing is re-filtered here — the count on each pill and
 * the rows beneath it come from one response and cannot disagree.
 */

/** The kit's four pills. `all` sends no status, so every bucket is counted. */
export const REG_TABS = ['all', 'pending', 'waitlist', 'cancelled'] as const
export type RegTab = (typeof REG_TABS)[number]

/** A pill, as the API spells the status it filters by. */
const TAB_STATUS: Record<Exclude<RegTab, 'all'>, RegistrationWireStatus> = {
  pending: 'pending',
  waitlist: 'waitlisted',
  cancelled: 'cancelled',
}

/** `@MaxLength(120)` on the DTO — past it the API answers 400, not a table. */
const MAX_SEARCH = 120

/** How many events the filter offers; the API's own maximum for one page. */
const EVENT_OPTIONS = 100

/** How many tiers the "Add registration" panel can choose between. */
const TIER_OPTIONS = 100

export function tabOf(params: URLSearchParams): RegTab {
  return enumParam(params, 'tab', REG_TABS, 'all')
}

/** The status to send, or nothing at all for All. */
export function statusOfTab(tab: RegTab): RegistrationWireStatus | undefined {
  return tab === 'all' ? undefined : TAB_STATUS[tab]
}

/**
 * The URL, as a request to `GET /registrations`.
 *
 * A hand-typed parameter the API would reject falls back to the default rather
 * than being forwarded — the address bar is not a trusted input, and a 400 in a
 * loader shows an error page instead of the queue.
 */
export function listQueryOf(params: URLSearchParams): ListRegistrationsQuery {
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const search = params.get('q')?.trim()
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    status: statusOfTab(tabOf(params)),
    eventId: params.get('eventId') ?? undefined,
    search: search ? search.slice(0, MAX_SEARCH) : undefined,
  }
}

/** What each pill counts. */
export interface TabCounts {
  all: number
  pending: number
  waitlist: number
  cancelled: number
}

/**
 * The API reports every status for the whole filtered queue, whichever tab is
 * open. All is their sum — confirmed and rejected have no pill of their own but
 * are still rows under it, and leaving them out would print a total smaller
 * than the table below it.
 */
export function tabCountsOf(counts: RegistrationCounts): TabCounts {
  return {
    all: counts.pending + counts.confirmed + counts.waitlisted + counts.cancelled + counts.rejected,
    pending: counts.pending,
    waitlist: counts.waitlisted,
    cancelled: counts.cancelled,
  }
}

/** One entry in the event filter. */
export interface EventOption {
  id: string
  name: string
}

/** One tier the panel can book, already narrowed to what it needs. */
export interface TierOption {
  id: string
  eventId: string
  name: string
  /** `Early Bird · ฿950` — priced here so the panel renders a string. */
  label: string
}

export interface RegistrationsData {
  rows: Registration[]
  window: PageWindow
  tabs: TabCounts
  /** The workspace's events, for the filter — not derived from the page shown. */
  events: EventOption[]
  /** Every bookable tier, for the "Add registration" panel. */
  tiers: TierOption[]
}

/** The counts the API hangs on `meta`, or zeros if the endpoint omitted them. */
const NO_COUNTS: RegistrationCounts = {
  pending: 0,
  confirmed: 0,
  waitlisted: 0,
  cancelled: 0,
  rejected: 0,
}

/**
 * The workspace's events, for the filter's options.
 *
 * The queue needs `regView` but `GET /events` needs `evCreate`, so Staff can
 * legitimately work this page without being allowed to list events. That 403 is
 * an answer about a *filter*, not about the queue — it costs them the dropdown,
 * and must not take the registrations down with it. Any other failure still
 * propagates to the route's error element.
 */
async function eventOptions(): Promise<EventOption[]> {
  return withoutForbidden(async () => {
    const page = await eventsApi.list({ limit: EVENT_OPTIONS, sort: 'recent' })
    return page.items.map((event) => ({ id: event.id, name: event.name }))
  })
}

/** The same, for the tiers the panel books against — `GET /tickets` is `evCreate` too. */
async function tierOptions(): Promise<TierOption[]> {
  return withoutForbidden(async () => {
    const page = await registrationsApi.tiers(TIER_OPTIONS)
    return page.items.map(toTierOption)
  })
}

function toTierOption(tier: TierWire): TierOption {
  return {
    id: tier.id,
    eventId: tier.eventId,
    name: tier.name,
    label: `${tier.name} · ${satang(tier.isFree ? 0 : tier.priceSatang)}`,
  }
}

/** Run an auxiliary fetch, treating "you may not" as "you get no options". */
async function withoutForbidden<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load()
  } catch (cause) {
    if (cause instanceof ApiError && cause.isForbidden) return []
    throw cause
  }
}

async function loadRegistrations({ request }: LoaderArgs): Promise<RegistrationsData> {
  const query = listQueryOf(queryOf(request))
  // The filter lists every event, so it is fetched beside the queue rather than
  // derived from the rows — one page of registrations knows only its own events.
  const [page, events, tiers] = await Promise.all([
    registrationsApi.list(query),
    eventOptions(),
    tierOptions(),
  ])

  // Rejecting the last row on page 3 leaves the loader asking for a page that no
  // longer exists. Send them to the last one that does, rather than showing an
  // empty table above a count that says there are ninety.
  if (page.meta.total > 0 && query.page! > page.meta.totalPages) {
    throw redirect(withPage(request.url, page.meta.totalPages))
  }

  return {
    rows: (page.items as RegistrationEntry[]).map(toRegistrationRow),
    window: pageWindow(page.meta),
    tabs: tabCountsOf((page.meta.counts as RegistrationCounts | undefined) ?? NO_COUNTS),
    events,
    tiers,
  }
}

/** The same URL, pointing at a different page. */
function withPage(current: string, page: number): string {
  const url = new URL(current)
  url.searchParams.set('page', String(page))
  return url.pathname + url.search
}

/**
 * Working the queue: approve, reject, or enter a booking taken at the door.
 *
 * A refusal comes back through `pageAction` as the API's own sentence and is
 * shown beside the control that was used — the server decides what may be done
 * here, and it writes the reason for the person reading it.
 */
async function runRegistrationsAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')

  if (intent === 'approve') {
    await registrationsApi.approve(String(form.get('id') ?? ''))
    return
  }

  if (intent === 'reject') {
    const reason = String(form.get('reason') ?? '').trim()
    await registrationsApi.reject(String(form.get('id') ?? ''), reason || null)
    return
  }

  await registrationsApi.add({
    eventId: String(form.get('eventId') ?? ''),
    ticketTypeId: String(form.get('ticketTypeId') ?? ''),
    quantity: Number(form.get('quantity')) || 1,
    name: String(form.get('name') ?? '').trim(),
    email: String(form.get('email') ?? '').trim(),
    phone: String(form.get('phone') ?? '').trim() || undefined,
    // An unchecked box is absent from the form data entirely, which is the
    // difference between "do not email them" and "I did not say" — the API
    // defaults to sending, so the flag is always stated.
    sendConfirmation: form.get('sendConfirmation') === 'on',
  })
}

export const registrationsRoute = {
  loader: pageData(loadRegistrations),
  action: pageAction(runRegistrationsAction),
}
