import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'
import { api, type Query } from '@/lib/api'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { intParam } from '@/lib/urlFilters'
import { toAnnouncementRow, type AnnouncementRow } from './announcements.mapper'
import type { AnnouncementWire } from './announcements.types'

/** Broadcasts sent to an event's attendees (US-MSG-04). */

const announcementsApi = {
  list: (query: Query) => api.list<AnnouncementWire>('/announcements', { query }),
  /**
   * The send lives on the event Monitor (US-EVT-14) — a broadcast is something
   * you do to an event's attendees, and there is no second endpoint for it.
   */
  send: (eventId: string, body: { subject: string; message: string }) =>
    api.post(`/events/${eventId}/attendees/email`, { ...body, confirm: true }),
}

export interface AnnouncementsData {
  rows: AnnouncementRow[]
  window: PageWindow
  events: EventOption[]
}

async function loadAnnouncements({ request }: LoaderArgs): Promise<AnnouncementsData> {
  const params = queryOf(request)
  const page = intParam(params, 'page', 1)
  const asked = Number(params.get('limit'))
  const limit = isPageSize(asked) ? asked : DEFAULT_PAGE_SIZE
  const eventId = params.get('eventId') ?? undefined

  const [announcements, events] = await Promise.all([
    announcementsApi.list({ eventId, page, limit }),
    eventOptions(),
  ])

  const total = announcements.meta.total
  return {
    rows: announcements.items.map(toAnnouncementRow),
    // Built from what the API counted, not from the rows on screen, so
    // "Showing 1–10 of 48" cannot disagree with the list beneath it.
    window: pageWindow({
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }),
    events,
  }
}

/**
 * Sending one.
 *
 * Nothing is returned for the page to hold: the loader revalidates after an
 * action, so the new row comes back from the API rather than being pushed onto
 * a local list that could disagree with it.
 */
async function runAnnouncementsAction({ request }: LoaderArgs): Promise<null> {
  const form = await request.formData()
  await announcementsApi.send(String(form.get('eventId') ?? ''), {
    subject: String(form.get('subject') ?? '').trim(),
    message: String(form.get('message') ?? '').trim(),
  })
  return null
}

export const announcementsRoute = {
  loader: pageData(loadAnnouncements),
  action: pageAction(runAnnouncementsAction),
}
