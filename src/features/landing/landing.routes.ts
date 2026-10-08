import type { LoaderArgs } from '@/app/loaders'
import { publicPageApi } from './publicPage.api'
import { toLandingEvent } from './publicPage.mapper'
import { toDraftPreview } from './draftPreview'
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
 * Two callers, two meanings. The landing-page switcher and Discover both name a
 * real event, which is fetched like any other public page. The create-event
 * wizard names none — it is previewing a draft that has not been saved — so the
 * page is built from what has been typed, and nothing is borrowed from an
 * event belonging to somebody else.
 *
 * Never indexed either way: this URL shows a design, and the event's own
 * canonical page is `/e/<slug>`.
 */
export const templatePreviewRoute = {
  loader: async ({ params, request }: LoaderArgs): Promise<PublicEventData> => {
    const asked = params.template ?? ''
    const template = isTemplateId(asked) ? asked : DEFAULT_TEMPLATE
    const slug = new URL(request.url).searchParams.get('event')?.trim()
    if (!slug) {
      return { event: toDraftPreview(new URL(request.url).searchParams), template, noIndex: true }
    }
    return { event: toLandingEvent(await publicPageApi.page(slug)), template, noIndex: true }
  },
}
