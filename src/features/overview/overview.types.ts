/**
 * What the overview screens read off the wire, and what they render.
 *
 * The wire half mirrors eventa-api's `HomeDto`, `UpcomingEventDto`,
 * `EventListItemDto` and `MeetingEntryDto` — only the fields these two screens
 * actually use, so an unused rename never breaks a build here.
 */

/* The meeting DTO is declared once, by the feature that owns meetings. */
export type { MeetingWire } from '@/features/meetings/meetings.types'

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

/** How a figure moved against the comparable previous period. */
export interface ChangeWire {
  direction: 'up' | 'down' | 'flat'
  /** Null when there is no baseline to compare against. */
  percent: number | null
  /** Null when flat — "better" has no meaning without a movement. */
  improved: boolean | null
}

export interface KpiWire {
  /** Null is the empty state, never a misleading zero. */
  value: number | null
  change: ChangeWire
}

export interface KpisWire {
  registrations: KpiWire
  /** Null without finance access — the card is not shown at all. */
  revenueSatang: KpiWire | null
  upcomingEvents: KpiWire
  checkInRate: KpiWire
  capacityFilled: KpiWire
}

export type RevenueRange = 'week' | 'month' | 'year'

export interface RevenuePointWire {
  at: string
  /** Integer satang, net of VAT and refunds. */
  netSatang: number
}

export interface RevenueTrendWire {
  range: RevenueRange
  totalSatang: number
  change: ChangeWire
  points: RevenuePointWire[]
}

export interface TierSliceWire {
  ticketTypeName: string
  count: number
  percent: number
}

export interface SellingFastWire {
  ticketTypeId: string
  ticketTypeName: string
  eventId: string
  eventName: string
  remaining: number
  total: number
}

export interface AnalyticsWire {
  kpis: KpisWire
  /** Absent entirely without finance access. */
  revenue: RevenueTrendWire | null
  recent: FeedItemWire[]
  tierMix: TierSliceWire[]
  sellingFast: SellingFastWire[]
  generatedAt: string
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

/** An arrow and a colour for a movement — or neither, when there is none. */
export interface Delta {
  text: string
  icon: string | null
  tone: string
}

export interface StatCard {
  id: string
  icon: string
  label: string
  value: string
  delta: Delta
}

export interface RevenueChart {
  total: string
  delta: Delta
  labels: string[]
  values: number[]
  max: number
}

export interface TierRow {
  name: string
  count: number
  percent: number
  color: string
}

export interface SellingFastRow {
  id: string
  name: string
  event: string
  left: string
  tone: string
  iconTint: string
}

export interface RecentRow {
  id: string
  initials: string
  name: string
  event: string
  amount: string
  status: string
  statusTone: string
  time: string
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

/**
 * How far the workspace has been set up, as the API reports it (US-DASH-01).
 *
 * Every field is nullable and null means WITHHELD or unknown — never "not
 * done". See `stepStatesOf`, which is where that distinction is honoured.
 */
export interface SetupWire {
  organizationConfigured: boolean | null
  paymentsConnected: boolean | null
  eventCreated: boolean | null
  ticketTypeAdded: boolean | null
  eventPublished: boolean | null
}
