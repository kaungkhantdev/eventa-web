/**
 * What the overview screens read off the wire, and what they render.
 *
 * The wire half mirrors eventa-api's `HomeDto`, `UpcomingEventDto`,
 * `EventListItemDto` and `MeetingEntryDto` — only the fields these two screens
 * actually use, so an unused rename never breaks a build here.
 */

/** A user-facing sentence the API writes in both product languages. */
export interface Bilingual {
  en: string
  th: string
}

/** Which of the two the workspace reads in — `me.organization.locale`. */
export type Language = keyof Bilingual

/* ── wire ─────────────────────────────────────────────────────────────── */

export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed'

/** One registration, as both the home feed and the dashboard table receive it. */
export interface FeedItemWire {
  orderId: string
  attendeeName: string
  eventName: string
  ticketTypeName: string | null
  /** Integer satang. Null when the caller may not see money. */
  totalSatang: number | null
  paymentStatus: PaymentStatus
  registeredAt: string
}

export interface TodayWire {
  /** Registrations taken today, on the Bangkok calendar. */
  count: number
  /** The newest sign-ups — a rolling preview, not scoped to today. */
  recent: FeedItemWire[]
  /** The sentence to show instead of the feed; null while today has activity. */
  emptyMessage: string | null
}

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface AlertWire {
  kind: string
  severity: AlertSeverity
  count: number
  message: Bilingual
  /** The module that owns the fix, without this app's `/admin` mount point. */
  href: string
}

export interface AlertsWire {
  alerts: AlertWire[]
  emptyMessage: Bilingual | null
}

export interface HomeWire {
  greeting: string
  /** Null when the caller may not see attendee personal data. */
  today: TodayWire | null
  alerts: AlertsWire
  generatedAt: string
}

export interface UpcomingEventWire {
  id: string
  name: string
  slug: string
  type: string
  status: string
  startAt: string
  /** Whole days until it starts, on the Bangkok calendar. */
  daysLeft: number
  sold: number
  capacity: number
  fillPercent: number
}

/** The slice of `EventListItemDto` the activity ring needs. */
export interface ActiveEventWire {
  id: string
  name: string
  slug: string
  registrations: number
}

export interface MeetingWire {
  id: string
  title: string
  /** e.g. `Today · 10:00 – 10:30`, already on the Bangkok wall clock. */
  timeLabel: string
  type: string
  role: string | null
  person: string
  mode: string
}

/* ── view models ──────────────────────────────────────────────────────── */

export interface RegistrationRow {
  id: string
  name: string
  initials: string
  /** `Event · Tier`, or just the event when the tier is withheld. */
  detail: string
  time: string
  tint: string
}

export interface AlertRow {
  id: string
  icon: string
  tone: string
  text: string
  to: string
}

export interface UpcomingCard {
  id: string
  slug: string
  title: string
  daysLabel: string
  progress: number
  attendees: string
  initials: string
  look: CardLook
}

/** The kit tinted each upcoming card as a set; they move together. */
export interface CardLook {
  card: string
  ring: string
  avatar: string
  avatarMore: string
  bar: string
}

export interface ShareSlice {
  name: string
  percent: number
  color: string
}

export interface TodayRegistrations {
  count: number
  rows: RegistrationRow[]
  /** Set when nobody has registered today — the panel shows this instead. */
  emptyMessage: string | null
}

export interface MeetingRow {
  id: string
  title: string
  time: string
  who: string
  tint: string
}
