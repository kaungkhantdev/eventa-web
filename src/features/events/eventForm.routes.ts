import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { ApiError } from '@/lib/api'
import { toast } from '@/lib/toast'
import { ticketingApi } from '@/features/ticketing/ticketing.api'
import { categoriesApi } from './categories.api'
import { eventContentApi } from './eventContent.api'
import { eventsApi, type PageSettingsBody } from './events.api'
import { CATEGORIES_LIMIT } from './events.routes'
import {
  toCreateBody,
  toEventFormValues,
  toTicketBody,
  toUpdateBody,
  type EventFormValues,
} from './eventForm.mapper'
import { quantityFromSeatsOf, seatTicketTypesOf, toReservedSeatingBody } from './eventSeating.mapper'
import { isTemplateId, type TemplateId } from './landingTemplates'
import type { CategoryWire } from './types'

/**
 * The create/edit wizard (US-EVT-02..07).
 *
 * On the API this is not one save. `POST /events` takes a handful of fields and
 * returns a draft; from then on the wizard is editing an id, and each step
 * PATCHes, or calls ticketing, seating or highlights. So the loader has two
 * branches — `?id=` present hydrates from the server, absent starts blank and
 * fetches only the category picker's options — and the action's first job on
 * a new event is to create it and put its id in the URL, so a refresh never
 * loses the work.
 */

/** One option in the Basics step's category picker. */
export interface CategoryChoice {
  id: number
  name: string
}

export interface EventFormData {
  values: EventFormValues
  /** The template chosen on the landing gallery, carried in via `?template=`. */
  template: TemplateId
  /** The workspace's categories, or null when this person may not list them. */
  categories: CategoryChoice[] | null
}

/**
 * The category picker's options (US-EVT-03).
 *
 * Listing categories takes the settings permission, which an organizer who may
 * create events need not have. "You may not" means no picker for them — not a
 * wizard that refuses to open. Any other failure still fails.
 */
export async function categoryChoices(
  list: () => Promise<readonly CategoryWire[]>,
): Promise<CategoryChoice[] | null> {
  try {
    return (await list()).map(({ id, name }) => ({ id, name }))
  } catch (cause) {
    if (cause instanceof ApiError && cause.isForbidden) return null
    throw cause
  }
}

/** Every category in the workspace, A–Z — the API's own maximum page. */
const listCategories = async () =>
  (await categoriesApi.list({ limit: CATEGORIES_LIMIT, sort: 'name' })).items

const DEFAULT_TEMPLATE: TemplateId = 'aurora'

/**
 * Which design the wizard opens on; anything unknown falls back.
 *
 * `?template=` wins, because that is the landing gallery's "Use template" — an
 * explicit choice made a moment ago. Failing that it is the event's own stored
 * design: reading only the query parameter meant an event saved as Spotlight
 * opened with Classic selected, and previewed itself with the wrong one.
 */
export function templateOf(params: URLSearchParams, stored?: string | null): TemplateId {
  const asked = params.get('template')
  if (asked && isTemplateId(asked)) return asked
  if (stored && isTemplateId(stored)) return stored
  return DEFAULT_TEMPLATE
}

async function loadEventForm({ request }: LoaderArgs): Promise<EventFormData> {
  const params = queryOf(request)
  const id = params.get('id')

  if (!id) {
    return {
      values: toEventFormValues(null, [], []),
      template: templateOf(params),
      categories: await categoryChoices(listCategories),
    }
  }

  // Independent reads; the wizard cannot render a half-loaded form, so they go
  // together and a failure lands on the route's error element.
  const [event, tickets, highlights, seating, categories] = await Promise.all([
    eventsApi.get(id),
    ticketingApi.forEvent(id),
    eventContentApi.highlights(id),
    eventContentApi.seating(id),
    categoryChoices(listCategories),
  ])

  const values = toEventFormValues(event, tickets, highlights)
  return {
    values: {
      ...values,
      seatingMode: seating.seatingMode,
      capacity: seating.capacity === null ? '' : String(seating.capacity),
      seatMapName: seating.seatMap?.name ?? '',
      seatRows: seating.seatMap ? String(seating.seatMap.rows) : '',
      seatsPerRow: seating.seatMap ? String(seating.seatMap.seatsPerRow) : '',
      seatTicketTypes: seatTicketTypesOf(seating.rows, seating.seatMap?.rows ?? 0, seating.seatMap?.seatsPerRow ?? 0),
      quantityFromSeats: quantityFromSeatsOf(tickets),
    },
    template: templateOf(params, event.landingTemplateId),
    categories,
  }
}

/**
 * What the organizer changed of the page's address and colour (US-PAGE-10),
 * read against the values the wizard was loaded with. Null when nothing did —
 * an unchanged address need not be re-checked, and an emptied box is not a
 * request for an address or a colour of nothing.
 */
export function pageChangesOf(saved: EventFormValues, form: FormData): PageSettingsBody | null {
  const changes: PageSettingsBody = {}
  const slug = String(form.get('slug') ?? '').trim()
  const accentColor = String(form.get('accentColor') ?? '').trim()
  if (slug && slug !== saved.slug) changes.slug = slug
  if (accentColor && accentColor !== saved.accentColor) changes.accentColor = accentColor
  return Object.keys(changes).length > 0 ? changes : null
}

/**
 * Save the page's address and colour, when either changed. Before the rest, so
 * an address already in use stops the save with the API's own sentence and
 * nothing is half-written.
 */
async function savePage(id: string, saved: EventFormValues, form: FormData): Promise<void> {
  const changes = pageChangesOf(saved, form)
  if (changes) await eventsApi.updatePage(id, changes)
}

const SAVED_TOAST = 'Changes saved.'
const SEAT_MAP_DEFERRED_TOAST = 'Saved. Give the new seats a ticket type in Assign seats to save the seat map.'

/**
 * What a save announces once it lands, or null for none.
 *
 * `notify` says the organizer ASKED to save — the header's button — so the save
 * is announced. A Next saves too, but silently: it is a side effect of moving
 * on, and a toast on every step would be noise. `seatMapDeferred` says Seating
 * saved the rest of the event and left the seat map to Assign seats
 * (US-EVT-05), so a bare "Changes saved." would claim the map was saved too.
 */
export function savedToastOf(form: FormData): string | null {
  if (form.get('notify') !== 'on') return null
  return form.get('seatMapDeferred') === 'on' ? SEAT_MAP_DEFERRED_TOAST : SAVED_TOAST
}

/** Everything the wizard's buttons do. */
async function runEventFormAction({ request }: LoaderArgs): Promise<Response | void> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? 'save')
  const values = JSON.parse(String(form.get('values') ?? '{}')) as EventFormValues

  /**
   * What to do once the write lands, decided by the button rather than the
   * intent — every step can be saved from the header, and each of them writes
   * through a different intent.
   *
   * The toast is `savedToastOf`'s to choose. `finish` additionally hands the
   * organizer back to the event, which only the last step's button does.
   */
  const savedToast = savedToastOf(form)
  const finish = form.get('finish') === 'on'
  const done = (eventId: string): Response | void => {
    if (savedToast) toast.success(savedToast)
    if (finish) return redirect(`/admin/event-detail?id=${eventId}`)
  }

  if (intent === 'create') {
    const created = await eventsApi.create(toCreateBody(values))
    // The id goes in the URL immediately: from here every step is an edit, and
    // a refresh or a closed tab must not strand a draft nobody can find.
    return redirect(`/admin/event-form?id=${created.id}`)
  }

  const id = values.id
  if (!id) throw new Error('This event has not been created yet.')

  if (intent === 'tickets') {
    // The event record too, not just the tiers. Capacity sits on this step,
    // under the tier table, and `saveTickets` writes only tiers — so the number
    // typed into Capacity never left the browser: the step reported itself
    // saved, and reopening the wizard showed the field empty again.
    //
    // The event goes first, so a version conflict stops here rather than after
    // half the step has been written.
    await eventsApi.update(id, toUpdateBody(values))
    await saveTickets(id, values)
    return done(id)
  }

  if (intent === 'remove-ticket') {
    await ticketingApi.remove(id, String(form.get('ticketId') ?? ''))
    return
  }

  if (intent === 'seating') {
    await saveSeating(id, values)
    return done(id)
  }

  if (intent === 'publish') {
    await savePage(id, values, form)
    const published = await eventsApi.publish(id, {
      visibility: String(form.get('visibility') ?? 'public'),
      landingTemplateId: String(form.get('template') ?? DEFAULT_TEMPLATE),
      confirmPastStart: form.get('confirmPastStart') === 'on',
      version: values.version ?? undefined,
    })
    return redirect(`/admin/event-detail?id=${published.id}`)
  }

  if (intent === 'unpublish') {
    await eventsApi.unpublish(id, values.version ?? undefined)
    return
  }

  // The default: save the step that is open.
  await savePage(id, values, form)
  await eventsApi.update(id, toUpdateBody(values))
  await eventContentApi.setHighlights(
    id,
    values.highlights.filter((h) => h.text.trim()).map((h) => ({ text: h.text.trim(), icon: h.icon })),
  )

  return done(id)
}

/**
 * Save every tier the step is showing: create the ones the API has never seen,
 * update the rest. Sequentially, so a refusal on one names that one rather than
 * arriving as an unattributable failure among several.
 */
async function saveTickets(eventId: string, values: EventFormValues): Promise<void> {
  for (const row of values.tickets) {
    const body = toTicketBody(row, values)
    if (!body.name) continue
    if (row.id) await ticketingApi.update(eventId, row.id, body)
    else await ticketingApi.add(eventId, body)
  }
}

/**
 * The room. General admission is a headcount; reserved is a named grid with a
 * ticket type for each seat (US-EVT-05).
 */
async function saveSeating(eventId: string, values: EventFormValues): Promise<void> {
  if (values.seatingMode === 'reserved') {
    await eventContentApi.setReservedSeating(eventId, toReservedSeatingBody(values))
    return
  }
  await eventContentApi.setGeneralSeating(eventId, Number(values.capacity) || 0)
}

export const eventFormRoute = {
  loader: pageData(loadEventForm),
  action: pageAction(runEventFormAction),
}
