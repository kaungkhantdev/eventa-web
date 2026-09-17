/**
 * What `/notifications` returns (US-MSG-03).
 *
 * The API sends FACTS, not sentences — the feed is bilingual, so the wording is
 * composed here, in `notifications.mapper.ts`, from `kind` and these fields.
 */

/** The four things the feed can report. `alert` is a declined payment. */
export type FeedKind = 'registration' | 'payment' | 'payout' | 'alert'

/** Which stretch of time a group covers; the label is this app's to supply. */
export type FeedBucket = 'today' | 'yesterday' | 'earlierThisWeek' | 'lastWeek' | 'earlier'

export interface FeedItemWire {
  id: string
  kind: FeedKind
  /** UTC. */
  at: string
  unread: boolean
  eventId: string | null
  eventName: string | null
  /** The buyer, the payer. Null where nobody is named — a payout, say. */
  personName: string | null
  /** Integer satang, or null where the item is not about money. */
  amountSatang: number | null
  seats: number | null
  reference: string | null
}

export interface FeedGroupWire {
  bucket: FeedBucket
  /** Open by default; the rest sit behind "show older activity". */
  recent: boolean
  items: FeedItemWire[]
}

export interface NotificationFeedWire {
  counts: { all: number; unread: number }
  groups: FeedGroupWire[]
  /** When this member last marked the feed read; null if they never have. */
  readAt: string | null
}
