import { bangkokDayKey, satangAmount } from '@/lib/format'
import type { FeedBucket, FeedItemWire, FeedKind } from './notifications.types'

/**
 * The feed's view model (US-MSG-03).
 *
 * The API sends facts — a kind, a name, an amount — and never a sentence,
 * because the feed is bilingual and an English title composed on the server
 * could not be translated. Composing it is therefore this file's job, and it is
 * the only place that knows how a notification reads.
 */

/** A message fragment; `bold` fragments render inside `<b>`. */
export interface BodySegment {
  text: string
  bold?: boolean
}

export interface NotificationView {
  id: string
  kind: FeedKind
  icon: string
  title: string
  body: BodySegment[]
  time: string
  unread: boolean
}

const ICON: Record<FeedKind, string> = {
  registration: 'hgi-user-add-01',
  payment: 'hgi-wallet-01',
  payout: 'hgi-dollar-circle',
  alert: 'hgi-alert-circle',
}

const TITLE: Record<FeedKind, string> = {
  registration: 'New registration',
  payment: 'Payment received',
  payout: 'Payout completed',
  alert: 'Payment declined',
}

/** What the API names nobody as. A row must never read "null joined". */
const SOMEONE = 'Someone'
const AN_EVENT = 'an event'

export const GROUP_LABEL: Record<FeedBucket, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  earlierThisWeek: 'Earlier this week',
  lastWeek: 'Last week',
  earlier: 'Earlier',
}

export function toNotification(item: FeedItemWire, now: Date): NotificationView {
  return {
    id: item.id,
    kind: item.kind,
    icon: ICON[item.kind],
    title: TITLE[item.kind],
    body: bodyOf(item),
    time: relativeTime(item.at, now),
    // The API decides what is unread — it holds the watermark. The page only
    // renders the answer.
    unread: item.unread,
  }
}

function bodyOf(item: FeedItemWire): BodySegment[] {
  const who = item.personName ?? SOMEONE
  const event = item.eventName ?? AN_EVENT
  const amount = item.amountSatang === null ? '' : satangAmount(item.amountSatang)

  switch (item.kind) {
    case 'registration':
      return [{ text: `${who} joined ` }, { text: event, bold: true }]
    case 'payment':
      return [{ text: `${amount} from ${who}` }]
    case 'payout':
      return [{ text: `${amount} was sent to your bank account` }]
    case 'alert':
      return [{ text: `${who}’s payment was declined for ` }, { text: event, bold: true }]
  }
}

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

/**
 * How long ago, as the organizer would say it.
 *
 * The day boundaries are BANGKOK's, not the browser's: an item at 00:30 local
 * is still today, and counting in UTC would file this morning's registration
 * under "Yesterday" for anybody west of Bangkok.
 */
export function relativeTime(instant: string, now: Date): string {
  const at = new Date(instant)
  const elapsed = now.getTime() - at.getTime()
  if (elapsed < MINUTE_MS) return 'Just now'
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)} min ago`

  const day = bangkokDayKey(at)
  if (day === bangkokDayKey(now)) return `${Math.floor(elapsed / HOUR_MS)} hr ago`
  if (day === bangkokDayKey(new Date(now.getTime() - 24 * HOUR_MS))) return 'Yesterday'
  return shortDay(at)
}

/**
 * `Jul 10` — no year, because the feed only looks back thirty days. Local to
 * this feature; `@/lib/format` carries the dated forms the rest of the app uses.
 */
function shortDay(at: Date): string {
  return at.toLocaleDateString('en-US', {
    timeZone: 'Asia/Bangkok',
    month: 'short',
    day: 'numeric',
  })
}
