import type { BadgeTone } from '@/components/ui'

/**
 * How a registered event looks on the attendee's account page.
 *
 * The kit gave every demo card its own gradient and icon by hand. A real
 * account has whatever events the person booked, so the look is derived from
 * the event's slug — stable, so the same event is the same colour on every
 * visit, and varied enough that a list of six is not one flat block.
 */

interface CardLook {
  /** Gradient behind the cover image, seen while it loads or if it fails. */
  header: string
  /** The floating square badge. */
  badge: string
  tone: BadgeTone
}

const LOOKS: readonly CardLook[] = [
  { header: 'bg-gradient-to-br from-brand to-emerald-400', badge: 'bg-brand', tone: 'green' },
  { header: 'bg-gradient-to-br from-violet-500 to-fuchsia-400', badge: 'bg-violet-500', tone: 'purple' },
  { header: 'bg-gradient-to-br from-sky-500 to-cyan-400', badge: 'bg-sky-500', tone: 'blue' },
  { header: 'bg-gradient-to-br from-amber-500 to-orange-400', badge: 'bg-amber-500', tone: 'amber' },
]

/** Same slug, same look — a sum, not a hash, because it only has to spread. */
export function lookOf(slug: string): CardLook {
  let total = 0
  for (let i = 0; i < slug.length; i += 1) total += slug.charCodeAt(i)
  return LOOKS[total % LOOKS.length]
}

/** The icon on the card's badge — one shape, since the API sends no type here. */
export const EVENT_ICON = 'hgi-calendar-03'
