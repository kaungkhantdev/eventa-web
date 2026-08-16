/**
 * What's on, as the public feed sends it and as the card renders it
 * (US-DISC-01/02/03).
 */

/** The eight kinds of event the API will label a card with. */
export type EventType =
  | 'Conference'
  | 'Networking'
  | 'Workshop'
  | 'Charity & Gala'
  | 'Sports & Wellness'
  | 'Concert & Festival'
  | 'Exhibition'
  | 'Seminar'

/** `GET /public/discover` — one card, verbatim. */
export interface EventCardWire {
  id: string
  slug: string
  name: string
  type: EventType
  categoryName: string | null
  startAt: string
  endAt: string | null
  timezone: string
  isOnline: boolean
  venueName: string | null
  city: string | null
  coverImage: string | null
  organizerName: string
  goingCount: number
  /**
   * Already a display string — the API formats it, because only the API knows
   * which tiers a visitor could actually buy. `null` means none of them are
   * left, which is not the same as free.
   */
  priceFrom: string | null
  badge: 'waitlist' | 'selling_fast' | null
  rating: number | null
}

/** The urgency flag a card wears, once it has a label. */
export interface CardBadge {
  label: string
  /** `waitlist` is amber and solid; `selling_fast` is the quieter dark pill. */
  kind: 'waitlist' | 'selling_fast'
}

/** The cheapest way in, already decided. */
export interface CardPrice {
  label: string
  /** Free reads as one word; anything else is prefixed with "From". */
  isFree: boolean
}

/** One card on the What's on grid. */
export interface DiscoverCard {
  id: string
  slug: string
  name: string
  /** The public page this card opens — a landing template picked by type. */
  href: string
  category: string
  /** The type's colour, for the eyebrow above the title. */
  accent: string
  /** `Sat–Sun, Jul 18–19, 2026` on the Bangkok calendar. */
  when: string
  /** `BITEC, Bangkok`, or `Online` when there is nowhere to go. */
  where: string
  organizer: string
  /** `null` until the event has been rated — the star is hidden, never faked. */
  rating: string | null
  going: string
  /** `null` when nothing is left to buy: the card shows "—", never "฿0". */
  price: CardPrice | null
  badge: CardBadge | null
  /** `null` leaves the type's gradient showing rather than inventing a photo. */
  cover: string | null
}
