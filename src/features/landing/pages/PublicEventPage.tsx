import { useEffect } from 'react'
import { useLoaderData } from 'react-router'
import type { TemplateId } from '@/features/events/landingTemplates'
import type { PublicEventData } from '../landing.routes'
import AtlasPage from './AtlasPage'
import AuroraPage from './AuroraPage'
import MinimalPage from './MinimalPage'
import NoirPage from './NoirPage'
import type { LandingEvent } from '../types'

/**
 * A published event, at its own public URL.
 *
 * The four designs already exist — they were built against a demo module and
 * are reused verbatim, now taking the real event as a required prop. This
 * component's whole job is choosing between them, which is the organizer's
 * decision, stored on the event and returned by the API.
 *
 * Also serves `/landing/<template>`, where the design is named by the path
 * rather than by the event — the landing-page switcher and the create-event
 * wizard both preview one that way.
 */

const TEMPLATES: Record<TemplateId, (props: { event: LandingEvent }) => React.ReactElement> = {
  aurora: AuroraPage,
  noir: NoirPage,
  minimal: MinimalPage,
  atlas: AtlasPage,
}

export default function PublicEventPage() {
  const { event, template, noIndex } = useLoaderData() as PublicEventData
  const Template = TEMPLATES[template]

  // The page title is what a shared link shows in a tab and a bookmark.
  useEffect(() => {
    const previous = document.title
    document.title = `${event.title} · Eventa`
    return () => {
      document.title = previous
    }
  }, [event.title])

  // A preview or an unpublished page must not be indexed. The API decides;
  // this only carries its answer into the document.
  useEffect(() => {
    if (!noIndex) return
    const tag = document.createElement('meta')
    tag.name = 'robots'
    tag.content = 'noindex'
    document.head.appendChild(tag)
    return () => tag.remove()
  }, [noIndex])

  return <Template event={event} />
}
