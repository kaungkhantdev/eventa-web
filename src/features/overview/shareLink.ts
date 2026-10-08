import type { Panel } from '@/app/panels'
import type { UpcomingCard } from './overview.types'

/**
 * Which event the home page offers to share, and where its public page is.
 *
 * "Today's Registrations" spans every event, so an empty panel has no single
 * event of its own to promote. The soonest upcoming one is the answer the
 * organizer means: it is the event whose sign-ups they are waiting on today.
 */

/** The soonest upcoming event, or null when there is none to point at. */
export function nextEventSlug(upcoming: Panel<UpcomingCard[]>): string | null {
  // A failed panel is not "no events" — it is "we do not know", and offering a
  // link built from a guess is worse than offering none.
  if (!upcoming.ok) return null
  return upcoming.data[0]?.slug ?? null
}

/**
 * The canonical public page for an event.
 *
 * `/e/<slug>` is the route `landing.routes.ts` calls canonical. Built here
 * rather than taken from the API because the home payload carries no URL —
 * the event detail screen gets `publicUrl` from the server and should keep
 * using it.
 */
export function registrationLinkFor(origin: string, slug: string): string {
  return `${origin.replace(/\/+$/, '')}/e/${encodeURIComponent(slug)}`
}
