import { MASKED, bahtCompact, bangkokTime, initials, num, satang } from '@/lib/format'
import {
  DELTA_ICON,
  DELTA_TONE,
  PAYMENT_STATUS,
  TIER_COLORS,
  URGENCY,
} from './overview.presentation'
import type {
  ChangeWire,
  Delta,
  FeedItemWire,
  KpisWire,
  KpiWire,
  RecentRow,
  RevenueChart,
  RevenuePointWire,
  RevenueRange,
  RevenueTrendWire,
  SellingFastRow,
  SellingFastWire,
  StatCard,
  TierRow,
  TierSliceWire,
} from './overview.types'

/** The rules behind the analytics dashboard (US-DASH-08..12). */

const SATANG_PER_BAHT = 100
const PER_THOUSAND = 1000

/**
 * The five headline cards (US-DASH-08).
 *
 * Revenue is dropped from the row entirely — not blanked — when the caller has
 * no finance access: the API sends `null` precisely so the figure is never
 * disclosed, and an empty tile labelled "Ticket revenue" still tells a reader
 * the number exists and is being kept from them.
 */
export function toStatCards(kpis: KpisWire): StatCard[] {
  const cards: (StatCard | null)[] = [
    card('registrations', 'hgi-user-add-01', 'Total registrations', kpis.registrations, num),
    kpis.revenueSatang &&
      card('revenue', 'hgi-ticket-01', 'Ticket revenue', kpis.revenueSatang, asBaht),
    card('events', 'hgi-calendar-03', 'Upcoming events', kpis.upcomingEvents, num),
    card('check-in', 'hgi-checkmark-badge-01', 'Check-in rate', kpis.checkInRate, asPercent),
    card('capacity', 'hgi-chair-01', 'Capacity filled', kpis.capacityFilled, asPercent),
  ]
  return cards.filter((c): c is StatCard => c !== null)
}

function card(
  id: string,
  icon: string,
  label: string,
  kpi: KpiWire,
  format: (value: number) => string,
): StatCard {
  return {
    id,
    icon,
    label,
    value: kpi.value === null ? MASKED : format(kpi.value),
    delta: toDelta(kpi.change),
  }
}

const asBaht = (amount: number) => bahtCompact(Math.round(amount / SATANG_PER_BAHT))
const asPercent = (value: number) => `${value}%`

/**
 * A count, or the empty state. Shared with the donut's centre so US-DASH-10's
 * "the total equals the registrations KPI" holds by construction rather than
 * by two call sites agreeing to format the same number the same way.
 */
export function countLabel(value: number | null): string {
  return value === null ? MASKED : num(value)
}

/**
 * How a figure moved.
 *
 * Colour follows `improved`, not `direction` — a check-in rate falling is a
 * worsening even though the number went down, and US-DASH-08 asks for the
 * warning colour on exactly that case. With no baseline there is no movement
 * to describe, so the chip shows a dash and no arrow rather than claiming 0%.
 */
export function toDelta(change: ChangeWire): Delta {
  if (change.percent === null || change.improved === null) {
    return { text: MASKED, icon: null, tone: DELTA_TONE.flat }
  }
  return {
    text: `${change.percent}%`,
    icon: change.direction === 'down' ? DELTA_ICON.down : DELTA_ICON.up,
    tone: change.improved ? DELTA_TONE.improved : DELTA_TONE.worsened,
  }
}

/**
 * The revenue trend (US-DASH-09).
 *
 * Plotted in thousands of baht because the axis is drawn with a `k` suffix —
 * satang would put seven digits on every gridline. The conversion happens once,
 * here, and never on a formatted string.
 */
export function toRevenueChart(trend: RevenueTrendWire): RevenueChart {
  const values = trend.points.map(asThousandBaht)
  return {
    total: asBaht(trend.totalSatang),
    delta: toDelta(trend.change),
    labels: trend.points.map((p) => pointLabel(p, trend.range)),
    values,
    max: chartMax(values),
  }
}

/** Satang → thousands of baht, to two decimals: 2,800,000 → 28. */
function asThousandBaht(point: RevenuePointWire): number {
  const baht = point.netSatang / SATANG_PER_BAHT
  return Math.round((baht / PER_THOUSAND) * 100) / 100
}

const LABEL_FORMAT: Record<RevenueRange, Intl.DateTimeFormatOptions> = {
  week: { weekday: 'short' },
  month: { day: 'numeric' },
  year: { month: 'short' },
}

/** The Bangkok calendar decides which day or month a point belongs to. */
function pointLabel(point: RevenuePointWire, range: RevenueRange): string {
  return new Date(point.at).toLocaleDateString('en-US', {
    timeZone: 'Asia/Bangkok',
    ...LABEL_FORMAT[range],
  })
}

/** Space above the tallest point, so the peak is not drawn on the ceiling. */
const HEADROOM = 1.15

/**
 * A top-of-axis a person would draw a gridline on — 60, not 59.8.
 *
 * Never zero: an axis of 0 makes every point sit on the baseline, which reads
 * as a broken chart rather than as a quiet month.
 */
export function chartMax(values: readonly number[]): number {
  const peak = Math.max(0, ...values)
  if (peak === 0) return 1
  const target = peak * HEADROOM
  const step = 10 ** Math.floor(Math.log10(target))
  return Math.ceil(target / step) * step
}

/** The ticket-type mix (US-DASH-10). The API has already ordered it. */
export function toTierRows(mix: readonly TierSliceWire[]): TierRow[] {
  return mix.map((tier, i) => ({
    name: tier.ticketTypeName,
    count: tier.count,
    percent: tier.percent,
    color: TIER_COLORS[i % TIER_COLORS.length],
  }))
}

/**
 * How many seats one booking can take — `maxPerOrder` on the API.
 *
 * At or below it, a single order can clear the tier, which is what makes a low
 * count urgent rather than merely low (US-DASH-11).
 */
const ONE_BOOKING = 8
const LAST_FEW = 3

export function toSellingFastRow(tier: SellingFastWire): SellingFastRow {
  return {
    id: tier.ticketTypeId,
    name: tier.ticketTypeName,
    event: tier.eventName,
    left: `${num(tier.remaining)} left`,
    ...urgencyOf(tier.remaining),
  }
}

function urgencyOf(remaining: number) {
  if (remaining <= LAST_FEW) return URGENCY.critical
  if (remaining <= ONE_BOOKING) return URGENCY.warning
  return URGENCY.normal
}

/** A row of the recent-registrations table (US-DASH-12). */
export function toRecentRow(wire: FeedItemWire): RecentRow {
  const status = PAYMENT_STATUS[wire.paymentStatus]
  return {
    id: wire.orderId,
    initials: initials(wire.attendeeName),
    name: wire.attendeeName,
    event: wire.eventName,
    // `satang` is the one place the null/zero rule lives: a withheld amount is
    // a dash, a free ticket says Free, and neither is ever ฿0.
    amount: satang(wire.totalSatang),
    status: status.label,
    statusTone: status.tone,
    time: bangkokTime(wire.registeredAt),
  }
}
