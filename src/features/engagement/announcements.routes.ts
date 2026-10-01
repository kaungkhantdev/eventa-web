import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'
import { bangkokInstantOfLocal } from '@/lib/format'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { intParam } from '@/lib/urlFilters'
import { announcementsApi, type SendAnnouncementInput } from './announcements.api'
import { toAnnouncementRow, type AnnouncementRow } from './announcements.mapper'

/** Broadcasts sent, or scheduled, to an event's attendees (US-MSG-04/05). */

export const ANNOUNCEMENT_INTENTS = ['send', 'cancel', 'reschedule'] as const
export type AnnouncementIntent = (typeof ANNOUNCEMENT_INTENTS)[number]

/** The composer's "Delivery" choice. */
export const DELIVERY_MODES = ['now', 'schedule'] as const
export type DeliveryMode = (typeof DELIVERY_MODES)[number]

/**
 * What a submitted form asks for. Anything unrecognised is a send — never a
 * cancel: a typo must not be able to call off somebody's announcement.
 */
export function announcementIntentOf(form: FormData): AnnouncementIntent {
  const asked = String(form.get('intent') ?? '')
  return ANNOUNCEMENT_INTENTS.find((intent) => intent === asked) ?? 'send'
}

/** The composer's form → which event, and the body the send endpoint takes. */
export function sendInputOf(form: FormData): { eventId: string; input: SendAnnouncementInput } {
  const input: SendAnnouncementInput = {
    subject: String(form.get('subject') ?? '').trim(),
    message: String(form.get('message') ?? '').trim(),
  }
  if (form.get('mode') === 'schedule') input.sendAt = scheduledAt(form)
  return { eventId: String(form.get('eventId') ?? ''), input }
}

/** The reschedule dialog's form → which announcement, and its new UTC time. */
export function rescheduleInputOf(form: FormData): { id: string; sendAt: string } {
  return { id: String(form.get('id') ?? ''), sendAt: scheduledAt(form) }
}

/**
 * The picked Bangkok time as a UTC instant. Never dropped when it cannot be
 * read: a scheduled send with no time must be refused by the API, under the
 * field — not quietly sent now.
 */
function scheduledAt(form: FormData): string {
  const picked = String(form.get('sendAt') ?? '')
  return bangkokInstantOfLocal(picked) ?? picked
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
 * Sending one — now or later — and changing one that has not gone.
 *
 * Nothing is returned for the page to hold: the loader revalidates after an
 * action, so the row comes back from the API rather than being pushed onto a
 * local list that could disagree with it.
 */
async function runAnnouncementsAction({ request }: LoaderArgs): Promise<null> {
  const form = await request.formData()
  await RUN[announcementIntentOf(form)](form)
  return null
}

const RUN: Record<AnnouncementIntent, (form: FormData) => Promise<unknown>> = {
  send: (form) => {
    const { eventId, input } = sendInputOf(form)
    return announcementsApi.send(eventId, input)
  },
  cancel: (form) => announcementsApi.cancel(String(form.get('id') ?? '')),
  reschedule: (form) => {
    const { id, sendAt } = rescheduleInputOf(form)
    return announcementsApi.reschedule(id, sendAt)
  },
}

export const announcementsRoute = {
  loader: pageData(loadAnnouncements),
  action: pageAction(runAnnouncementsAction),
}
