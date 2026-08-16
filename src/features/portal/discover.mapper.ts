import { MASKED, bangkokDayKey, num } from '@/lib/format'
import { BADGE_LABEL, lookOfType } from './discover.presentation'
import type { CardBadge, CardPrice, DiscoverCard, EventCardWire } from './discover.types'

/**
 * A public feed row → the card the What's on grid renders (US-DISC-01).
 *
 * Everything the kit invented from the slug — a rating, a cover photo, three
 * attendee faces — is either the API's answer or absent. A fabricated 4.7 next
 * to a real organizer's name is a claim this product is not entitled to make.
 */

const FREE = 'Free'

export function toDiscoverCard(row: EventCardWire): DiscoverCard {
  const look = lookOfType(row.type)
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    href: `/landing/${look.template}?event=${encodeURIComponent(row.slug)}`,
    category: row.categoryName ?? row.type,
    accent: look.colour,
    when: dateRange(row.startAt, row.endAt, row.timezone),
    where: placeOf(row),
    organizer: row.organizerName,
    rating: row.rating === null ? null : row.rating.toFixed(1),
    going: num(row.goingCount),
    price: priceOf(row.priceFrom),
    badge: badgeOf(row.badge),
    cover: row.coverImage,
  }
}

/** `null` means no tier is left to buy — the opposite claim to "it is free". */
function priceOf(priceFrom: string | null): CardPrice | null {
  if (priceFrom === null) return null
  return { label: priceFrom, isFree: priceFrom === FREE }
}

function badgeOf(badge: EventCardWire['badge']): CardBadge | null {
  if (badge === null) return null
  return { label: BADGE_LABEL[badge], kind: badge }
}

/**
 * Where it is held.
 *
 * Online is the fallback rather than the headline: a hybrid event with a room
 * still has to tell whoever is turning up which room.
 */
function placeOf(row: EventCardWire): string {
  const place = [row.venueName, row.city].filter(Boolean).join(', ')
  if (place) return place
  return row.isOnline ? 'Online' : MASKED
}

/**
 * The dates, spelled the way the kit's cards spell them.
 *
 * Compared on the Bangkok calendar day, never on the raw instants: an event
 * that ends at 18:00 local is `11:00Z`, and an evening start is already
 * tomorrow in UTC. Comparing instants would split single days and merge
 * separate ones depending on where the reader happens to be sitting.
 */
function dateRange(startAt: string, endAt: string | null, timeZone: string): string {
  const start = new Date(startAt)
  const end = endAt === null ? null : new Date(endAt)
  if (end === null || bangkokDayKey(start) === bangkokDayKey(end)) {
    return `${weekday(start, timeZone)}, ${monthDay(start, timeZone)}, ${year(start, timeZone)}`
  }
  if (sameMonth(start, end)) {
    return (
      `${weekday(start, timeZone)}–${weekday(end, timeZone)}, ` +
      `${monthDay(start, timeZone)}–${day(end, timeZone)}, ${year(end, timeZone)}`
    )
  }
  return `${monthDay(start, timeZone)} – ${monthDay(end, timeZone)}, ${year(end, timeZone)}`
}

function sameMonth(start: Date, end: Date): boolean {
  return bangkokDayKey(start).slice(0, 'YYYY-MM'.length) === bangkokDayKey(end).slice(0, 'YYYY-MM'.length)
}

const part = (options: Intl.DateTimeFormatOptions) => (at: Date, timeZone: string) =>
  at.toLocaleDateString('en-US', { timeZone, ...options })

const weekday = part({ weekday: 'short' })
const monthDay = part({ month: 'short', day: 'numeric' })
const day = part({ day: 'numeric' })
const year = part({ year: 'numeric' })
