import { MASKED, bangkokDateRange, num } from '@/lib/format'
import { BADGE_LABEL, lookOfType } from './discover.presentation'
import type { CardBadge, CardPrice, DiscoverCard, EventCardWire } from './discover.types'

/**
 * A public feed row → the card the What's on grid renders (US-DISC-01).
 *
 * Everything the kit invented from the slug — a rating, a cover photo, three
 * attendee faces — is either the API's answer or absent. A fabricated 4.7 next
 * to a real organizer's name is a claim this product is not entitled to make.
 *
 * The going-cluster is the one thing kept in shape but not in substance: the
 * circles are drawn from the real count and carry no faces, because the feed is
 * public and the attendance port exposes nothing but a number.
 */

const FREE = 'Free'
/** The kit drew three; a card with two people should not claim a third. */
const MAX_FACES = 3

export function toDiscoverCard(row: EventCardWire): DiscoverCard {
  const look = lookOfType(row.type)
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    href: `/landing/${look.template}?event=${encodeURIComponent(row.slug)}`,
    category: row.categoryName ?? row.type,
    accent: look.colour,
    when: bangkokDateRange(row.startAt, row.endAt, row.timezone),
    where: placeOf(row),
    organizer: row.organizerName,
    rating: row.rating === null ? null : row.rating.toFixed(1),
    going: num(row.goingCount),
    faces: Math.min(row.goingCount, MAX_FACES),
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
