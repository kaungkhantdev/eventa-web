import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { bangkokMonthKey } from '@/lib/format'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { categoriesApi, type CategoryInput } from './categories.api'
import { toCategoryCard } from './categories.mapper'
import { eventsApi, type ListEventsQuery } from './events.api'
import { toCalendarEvents, toEventRow, toUpcomingCard } from './events.mapper'
import { TYPE_META } from './events.presentation'
import type { PreviewEvent } from './landingTemplates'
import type {
  CalendarEvent,
  CategoryCard,
  EventBucket,
  EventRow,
  EventSort,
  EventType,
  EventsSummaryWire,
  Tone,
  UpcomingCard,
} from './types'

/**
 * What the events screens load, and what their controls do.
 *
 * Filters, paging and the chosen view live in the URL, so this module's only
 * job is to translate that query string into API calls and the result into view
 * models. The pages themselves read `useLoaderData()` and render.
 */

/* --------------------------------- events -------------------------------- */

/** Every event type the API knows, in the kit's order — the filter's options. */
export const EVENT_TYPES = Object.keys(TYPE_META) as EventType[]

export const EVENT_VIEWS = ['overview', 'calendar'] as const
export type EventView = (typeof EVENT_VIEWS)[number]

/** The orderings offered, spelled as the API spells them. */
export const EVENT_SORTS = ['registrations', 'name', 'date'] as const
export const EVENT_BUCKETS = ['active', 'completed'] as const

const DEFAULT_SORT: EventSort = 'registrations'
const DEFAULT_BUCKET: EventBucket = 'active'
const DEFAULT_VIEW: EventView = 'overview'

/** How many cards the upcoming grid asks for — four rows of the widest layout. */
const UPCOMING_LIMIT = 12

/**
 * The longest search each endpoint's DTO accepts (`@MaxLength`). Past it the API
 * answers 400 — and a loader that throws takes the whole screen down with it, so
 * a pasted URL in the search box is truncated here rather than rejected there.
 */
const MAX_EVENT_SEARCH = 120
const MAX_CATEGORY_SEARCH = 80

/** The `q` to send, or nothing at all when the box is empty. */
export function searchOf(params: URLSearchParams, max: number): string | undefined {
  const term = params.get('q')?.trim()
  return term ? term.slice(0, max) : undefined
}

/** Which of the two views the URL asks for. */
export function viewOf(params: URLSearchParams): EventView {
  return enumParam(params, 'view', EVENT_VIEWS, DEFAULT_VIEW)
}

/** The Bangkok month the calendar is showing; today's unless one was chosen. */
export function monthOf(params: URLSearchParams): string {
  const month = params.get('month')
  return month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : bangkokMonthKey(new Date())
}

/**
 * The URL, as a request to `GET /events`.
 *
 * A hand-typed parameter the API would reject falls back to the default rather
 * than being forwarded — the address bar is not a trusted input, and a 400 here
 * would show an error page instead of a table.
 */
export function listQueryOf(params: URLSearchParams): ListEventsQuery {
  const type = params.get('type')
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    q: searchOf(params, MAX_EVENT_SEARCH),
    type: EVENT_TYPES.includes(type as EventType) ? (type as EventType) : undefined,
    bucket: enumParam(params, 'bucket', EVENT_BUCKETS, DEFAULT_BUCKET),
    sort: enumParam(params, 'sort', EVENT_SORTS, DEFAULT_SORT),
  }
}

/** What the events screen renders — one shape per view, never half of each. */
export type EventsData =
  | {
      view: 'overview'
      rows: EventRow[]
      window: PageWindow
      summary: EventsSummaryWire
    }
  | { view: 'calendar'; month: string; events: CalendarEvent[]; count: number }

async function loadEvents({ request }: LoaderArgs): Promise<EventsData> {
  const params = queryOf(request)
  if (viewOf(params) === 'calendar') {
    const month = monthOf(params)
    const calendar = await eventsApi.calendar(month)
    return { view: 'calendar', month, events: toCalendarEvents(calendar.events), count: calendar.count }
  }
  // The badges count the whole workspace, so they are fetched beside the page
  // rather than derived from it — a filtered page cannot know the totals.
  const query = listQueryOf(params)
  const [page, summary] = await Promise.all([eventsApi.list(query), eventsApi.summary()])
  // Deleting the last row on page 2 leaves the loader asking for a page that no
  // longer exists. Send them to the last one that does, rather than showing an
  // empty table above a count that says there are ten.
  if (page.meta.total > 0 && query.page! > page.meta.totalPages) {
    throw redirect(withPage(request.url, page.meta.totalPages))
  }
  return {
    view: 'overview',
    rows: page.items.map(toEventRow),
    window: pageWindow(page.meta),
    summary,
  }
}

/** The same URL, pointing at a different page. */
function withPage(current: string, page: number): string {
  const url = new URL(current)
  url.searchParams.set('page', String(page))
  return url.pathname + url.search
}

/**
 * What the row menu can do: duplicate an event, or delete a draft. Anything
 * else the API refuses, and says why.
 */
async function runEventsAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const id = String(form.get('id') ?? '')
  if (form.get('intent') === 'duplicate') {
    await eventsApi.duplicate(id)
    return
  }
  await eventsApi.remove(id, Number(form.get('version')))
}

export const eventsRoute = {
  loader: pageData(loadEvents),
  action: pageAction(runEventsAction),
}

/* -------------------------------- upcoming ------------------------------- */

export interface UpcomingData {
  cards: UpcomingCard[]
}

export const upcomingRoute = {
  loader: pageData(async (): Promise<UpcomingData> => {
    const events = await eventsApi.upcoming(UPCOMING_LIMIT)
    return { cards: events.map(toUpcomingCard) }
  }),
}

/* ----------------------------- landing pages ----------------------------- */

/** How many of the workspace's events the "Preview with" switcher offers. */
const PREVIEW_EVENTS = 3

export interface LandingPagesData {
  /** The events a template can be previewed against — the newest few. */
  events: PreviewEvent[]
}

export const landingPagesRoute = {
  loader: pageData(async (): Promise<LandingPagesData> => {
    // The template catalogue is a product constant; the only thing the server
    // knows here is which events exist to preview one against.
    const page = await eventsApi.list({ limit: PREVIEW_EVENTS, sort: 'recent' })
    return {
      events: page.items.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
      })),
    }
  }),
}

/* ------------------------------- categories ------------------------------ */

/**
 * The categories screen is not paged — it asks for the whole set in one go, up
 * to the API's own maximum. That is what lets it sort by event count in the
 * browser without the count on screen disagreeing with the cards below it.
 */
export const CATEGORIES_LIMIT = 100

export const CATEGORY_SORTS = ['name', 'count-desc', 'count-asc'] as const
export type CategorySort = (typeof CATEGORY_SORTS)[number]

export const CATEGORY_VIEWS = ['grid', 'list'] as const
export type CategoryView = (typeof CATEGORY_VIEWS)[number]

export function categorySortOf(params: URLSearchParams): CategorySort {
  return enumParam(params, 'sort', CATEGORY_SORTS, 'name')
}

export function categoryViewOf(params: URLSearchParams): CategoryView {
  return enumParam(params, 'view', CATEGORY_VIEWS, 'grid')
}

export interface CategoriesData {
  cards: CategoryCard[]
  /** How many the workspace has in total, whether or not they all fit above. */
  total: number
}

/**
 * Order the cards.
 *
 * Name is ordered by the API; the two count orderings are not something it
 * offers, and are applied here — legitimately, because the whole set is in hand
 * rather than one page of it.
 */
export function sortCategories(cards: CategoryCard[], sort: CategorySort): CategoryCard[] {
  if (sort === 'name') return cards
  const direction = sort === 'count-desc' ? -1 : 1
  return [...cards].sort((a, b) => direction * (a.eventCount - b.eventCount))
}

async function loadCategories({ request }: LoaderArgs): Promise<CategoriesData> {
  const params = queryOf(request)
  const page = await categoriesApi.list({
    limit: CATEGORIES_LIMIT,
    q: searchOf(params, MAX_CATEGORY_SEARCH),
    sort: 'name',
  })
  return {
    cards: sortCategories(page.items.map(toCategoryCard), categorySortOf(params)),
    total: page.meta.total,
  }
}

/**
 * The panel's fields, as the API wants them.
 *
 * A cleared description is sent as `null`, never `undefined`: the API applies
 * only the keys it is given, and `JSON.stringify` drops an undefined one — so
 * "I deleted the description" would arrive as "I didn't mention it", the save
 * would report success, and the old text would still be there afterwards.
 */
export function categoryInputOf(form: FormData): CategoryInput {
  return {
    name: String(form.get('name') ?? '').trim(),
    icon: String(form.get('icon') ?? ''),
    color: String(form.get('color') ?? '') as Tone,
    description: String(form.get('description') ?? '').trim() || null,
  }
}

/** Create, rename or remove a category. */
async function runCategoriesAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')
  const id = Number(form.get('id'))

  if (intent === 'delete') {
    await categoriesApi.remove(id)
    return
  }

  const input = categoryInputOf(form)

  if (intent === 'update') {
    await categoriesApi.update(id, { ...input, version: Number(form.get('version')) })
    return
  }
  await categoriesApi.create(input)
}

export const categoriesRoute = {
  loader: pageData(loadCategories),
  action: pageAction(runCategoriesAction),
}
