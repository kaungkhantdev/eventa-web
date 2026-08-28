import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { toast } from '@/lib/toast'
import { ticketingApi } from '@/features/ticketing/ticketing.api'
import { eventContentApi } from './eventContent.api'
import { eventsApi } from './events.api'
import {
  satangOf,
  toCreateBody,
  toEventFormValues,
  toUpdateBody,
  type EventFormValues,
} from './eventForm.mapper'
import { LANDING_TEMPLATES, type TemplateId } from './landingTemplates'

/**
 * The create/edit wizard (US-EVT-02..07).
 *
 * On the API this is not one save. `POST /events` takes a handful of fields and
 * returns a draft; from then on the wizard is editing an id, and each step
 * PATCHes, or calls ticketing, seating or highlights. So the loader has two
 * branches — `?id=` present hydrates from the server, absent starts blank and
 * makes no calls at all — and the action's first job on a new event is to
 * create it and put its id in the URL, so a refresh never loses the work.
 */

export interface EventFormData {
  values: EventFormValues
  /** The template chosen on the landing gallery, carried in via `?template=`. */
  template: TemplateId
}

const DEFAULT_TEMPLATE: TemplateId = 'aurora'

/** Which template `?template=` asked for; anything unknown falls back. */
export function templateOf(params: URLSearchParams): TemplateId {
  const asked = params.get('template')
  return LANDING_TEMPLATES.some((t) => t.id === asked) ? (asked as TemplateId) : DEFAULT_TEMPLATE
}

async function loadEventForm({ request }: LoaderArgs): Promise<EventFormData> {
  const params = queryOf(request)
  const id = params.get('id')
  const template = templateOf(params)

  if (!id) return { values: toEventFormValues(null, [], []), template }

  // Four independent reads; the wizard cannot render a half-loaded form, so
  // they go together and a failure lands on the route's error element.
  const [event, tickets, highlights, seating] = await Promise.all([
    eventsApi.get(id),
    ticketingApi.forEvent(id),
    eventContentApi.highlights(id),
    eventContentApi.seating(id),
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
    },
    template,
  }
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
   * `notify` says the organizer ASKED to save, so the save is announced. A Next
   * saves too, but silently: it is a side effect of moving on, and a toast on
   * every step would be noise. `finish` additionally hands them back to the
   * event, which only the last step's button does.
   */
  const notify = form.get('notify') === 'on'
  const finish = form.get('finish') === 'on'
  const done = (eventId: string): Response | void => {
    if (notify) toast.success('Changes saved.')
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
    const name = row.name.trim()
    if (!name) continue
    const body = {
      name,
      isFree: row.isFree,
      // A free tier carries no price at all — 0 would describe a paid tier that
      // happens to cost nothing, which the API stores differently.
      priceSatang: row.isFree ? undefined : satangOf(row.price),
      total: Number(row.quantity) || undefined,
    }
    if (row.id) await ticketingApi.update(eventId, row.id, body)
    else await ticketingApi.add(eventId, body)
  }
}

/**
 * The room. General admission is a headcount; reserved is a named grid, and the
 * API requires that name — the venue is the sensible default for it.
 */
async function saveSeating(eventId: string, values: EventFormValues): Promise<void> {
  if (values.seatingMode === 'reserved') {
    await eventContentApi.setReservedSeating(eventId, {
      name: values.seatMapName.trim() || values.venueName.trim() || 'Main hall',
      rows: Number(values.seatRows) || 1,
      seatsPerRow: Number(values.seatsPerRow) || 1,
    })
    return
  }
  await eventContentApi.setGeneralSeating(eventId, Number(values.capacity) || 0)
}

export const eventFormRoute = {
  loader: pageData(loadEventForm),
  action: pageAction(runEventFormAction),
}
