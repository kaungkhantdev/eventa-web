import type { LoaderArgs } from '@/app/loaders'
import { session } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import { publicPageApi } from './publicPage.api'
import { toLandingEvent } from './publicPage.mapper'
import { overlayDraft, toDraftPreview } from './draftPreview'
import { isTemplateId, type TemplateId } from '@/features/events/landingTemplates'
import type { LandingEvent } from './types'

/**
 * The real public event page (US-PAGE-01..08).
 *
 * Deliberately NOT behind `pageData()`: that gates on an organizer session, and
 * this page exists to be opened by anyone with the link. A failure still throws
 * an `ApiError`, which the route's error element renders — a slug that does not
 * exist becomes "Not found" rather than a blank screen.
 */

export interface PublicEventData {
  event: LandingEvent
  /** Which of the four designs the organizer chose. */
  template: TemplateId
  /** Search engines must not index a preview or an unpublished page. */
  noIndex: boolean
}

const DEFAULT_TEMPLATE: TemplateId = 'aurora'

export const publicEventRoute = {
  loader: async ({ params }: LoaderArgs): Promise<PublicEventData> => {
    const page = await publicPageApi.page(params.slug ?? '')
    return {
      event: toLandingEvent(page),
      // The API types this loosely; narrow it here rather than cast, so an
      // unknown value renders a real design instead of nothing.
      template: isTemplateId(page.event.template) ? page.event.template : DEFAULT_TEMPLATE,
      noIndex: page.share.noIndex,
    }
  },
}

/**
 * One template, shown on its own: `/landing/aurora?event=<slug>`.
 *
 * Two callers, two meanings. The landing-page switcher names a real event,
 * which is fetched like any other public page. The create-event wizard names
 * none while it is previewing a draft that has not been saved — so the page is
 * built from what has been typed, and nothing is borrowed from an event
 * belonging to somebody else. Previewing a live event, the wizard names it AND
 * sends what is typed, which is laid over the fetched page for a console
 * session only (see `livePreviewOf`).
 *
 * Never indexed either way: this URL shows a design, and the event's own
 * canonical page is `/e/<slug>`.
 */
export const templatePreviewRoute = {
  loader: async ({ params, request }: LoaderArgs): Promise<PublicEventData> => {
    const asked = params.template ?? ''
    const template = isTemplateId(asked) ? asked : DEFAULT_TEMPLATE
    const query = new URL(request.url).searchParams
    const slug = query.get('event')?.trim()
    if (!slug) return { event: toDraftPreview(query), template, noIndex: true }
    const saved = toLandingEvent(await publicPageApi.page(slug))
    return { event: livePreviewOf(query, saved, session.persona()), template, noIndex: true }
  },
}

/**
 * What a live event's preview shows (US-PAGE-09).
 *
 * The typed fields are laid over the saved page only for someone signed in to
 * the console: preview is the organizer's tool, "not attendees or the public",
 * and this URL is public while the page keeps the event's real tickets and
 * Register button. Anyone else following a link that carries typed fields gets
 * the real page, not a stranger's title or venue over a real event.
 */
export function livePreviewOf(
  query: URLSearchParams,
  saved: LandingEvent,
  persona: Persona | null,
): LandingEvent {
  return persona === 'admin' ? overlayDraft(query, saved) : saved
}
