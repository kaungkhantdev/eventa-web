import { MASKED, bangkokDate, num, satangAmount } from '@/lib/format'
import type { BadgeTone } from '@/components/ui'
import { eventDetailPath } from '@/features/events/events.presentation'
import type {
  AttendanceRowWire,
  AttendanceTotalsWire,
  ChangeWire,
  EventLifecycle,
  DiscountRowWire,
  DiscountStanding,
  EventPerformanceRowWire,
  IncomeReportWire,
  LedgerOutcome,
  LedgerRowWire,
  OverviewWire,
  MoneyWire,
  RegistrationsReportWire,
  SplitWire,
} from './insights.types'

/**
 * Report rows and tiles, from the wire to what the page renders.
 *
 * Two rules do the work here and both are the API's, kept rather than flattened:
 * a null figure is "there is no such number", never zero, and a change is
 * coloured by whether it is GOOD for that figure rather than by its sign.
 */

/** A report's figures are sums the reader is entitled to, so ฿0 is a real ฿0. */
const money = satangAmount

/**
 * A percentage the API states as a percentage.
 *
 * Not `pct()` from `@/lib/format`, which takes a RATIO and multiplies — these
 * arrive from the API already out of a hundred. `num` keeps a decimal only when
 * there is one, so a rate reads "80%" and "12.5%" rather than "80.0%".
 */
function percent(value: number): string {
  return `${num(value)}%`
}

/** A rate the API may not have — an event that has not started has no rate. */
function rate(value: number | null): string {
  return value === null ? MASKED : percent(value)
}

function count(value: number | null): string {
  return value === null ? MASKED : num(value)
}

/* ── the "vs previous period" chip ─────────────────────────────────────── */

export interface Delta {
  /** The percentage without its sign, or "—" where there is no honest one. */
  text: string
  /** Which arrow to draw; null when nothing moved. */
  direction: 'up' | 'down' | null
  tone: 'good' | 'bad' | 'neutral'
}

/**
 * A change chip.
 *
 * The percentage is shown unsigned because the arrow already says which way it
 * went, and `tone` follows `improved` rather than `direction`: a falling refund
 * rate is a win and must not be painted as a loss. Where the API passes no
 * verdict — VAT, or a period with no baseline — the chip stays neutral instead
 * of guessing one.
 */
export function toDelta(change: ChangeWire): Delta {
  return {
    text: change.percent === null ? MASKED : percent(Math.abs(change.percent)),
    direction: change.direction === 'flat' ? null : change.direction,
    tone: toneOf(change.improved),
  }
}

function toneOf(improved: boolean | null): Delta['tone'] {
  if (improved === null) return 'neutral'
  return improved ? 'good' : 'bad'
}

/* ── registrations (US-RPT-08) ─────────────────────────────────────────── */

export interface RegistrationReportRow {
  id: string
  name: string
  /** The day the event runs, under its name. */
  meta: string
  total: string
  confirmed: string
  pending: string
  waitlisted: string
  cancelled: string
}

export function toRegistrationRow(
  row: RegistrationsReportWire['rows'][number],
): RegistrationReportRow {
  return {
    id: row.eventId,
    name: row.eventName,
    meta: bangkokDate(row.startAt),
    total: num(row.total),
    confirmed: num(row.confirmed),
    pending: num(row.pending),
    waitlisted: num(row.waitlisted),
    cancelled: num(row.cancelled),
  }
}

/** The four headline figures, already formatted, with their chips. */
export interface Tile {
  value: string
  delta: Delta
}

const tile = (value: string, change: ChangeWire): Tile => ({
  value,
  delta: toDelta(change),
})

export function toRegistrationTiles(
  totals: SplitWire,
  changes: RegistrationsReportWire['changes'],
) {
  return {
    total: tile(num(totals.total), changes.total),
    confirmed: tile(num(totals.confirmed), changes.confirmed),
    pending: tile(num(totals.pending), changes.pending),
    cancelled: tile(num(totals.cancelled), changes.cancelled),
  }
}

/* ── attendance (US-RPT-09) ────────────────────────────────────────────── */

export interface AttendanceReportRow {
  id: string
  name: string
  meta: string
  registered: string
  checkedIn: string
  noShows: string
  attendanceRate: string
}

export function toAttendanceRow(row: AttendanceRowWire): AttendanceReportRow {
  return {
    id: row.eventId,
    name: row.eventName,
    meta: bangkokDate(row.startAt),
    registered: num(row.registered),
    checkedIn: num(row.checkedIn),
    noShows: count(row.noShows),
    attendanceRate: rate(row.attendanceRate),
  }
}

export function toAttendanceTiles(
  totals: AttendanceTotalsWire,
  changes: Record<keyof AttendanceTotalsWire, ChangeWire>,
) {
  return {
    checkedIn: tile(num(totals.checkedIn), changes.checkedIn),
    attendanceRate: tile(rate(totals.attendanceRate), changes.attendanceRate),
    noShows: tile(count(totals.noShows), changes.noShows),
    onTimeRate: tile(rate(totals.onTimeRate), changes.onTimeRate),
  }
}

/* ── income (US-RPT-05) ────────────────────────────────────────────────── */

export interface IncomeReportRow {
  id: string
  name: string
  meta: string
  gross: string
  refunds: string
  fees: string
  net: string
}

export function toIncomeRow(
  row: IncomeReportWire['rows'][number],
): IncomeReportRow {
  return {
    id: row.eventId,
    name: row.eventName,
    meta: bangkokDate(row.startAt),
    gross: money(row.grossSatang),
    refunds: money(row.refundsSatang),
    fees: money(row.feesSatang),
    net: money(row.netSatang),
  }
}

export function toIncomeTiles(
  totals: MoneyWire,
  changes: IncomeReportWire['changes'],
) {
  return {
    gross: tile(money(totals.grossSatang), changes.grossSatang),
    refunds: tile(money(totals.refundsSatang), changes.refundsSatang),
    fees: tile(money(totals.feesSatang), changes.feesSatang),
    net: tile(money(totals.netSatang), changes.netSatang),
  }
}

/* ── event performance (US-RPT-04) ─────────────────────────────────────── */

/** How each stage of the lifecycle reads. Cancelled is the kit's fourth tone. */
const LIFECYCLE_BADGE: Record<EventLifecycle, { label: string; tone: BadgeTone }> = {
  upcoming: { label: 'Upcoming', tone: 'blue' },
  live: { label: 'Live', tone: 'green' },
  completed: { label: 'Completed', tone: 'gray' },
  // Not in the static kit, which only ever showed three. A cancelled event
  // badged "Completed" would read as one that simply finished.
  cancelled: { label: 'Cancelled', tone: 'red' },
}

export interface EventPerformanceRow {
  id: string
  name: string
  /** "Jul 18, 2026 · BITEC" — the day, and where, when anyone said. */
  meta: string
  href: string
  registrations: string
  revenue: string
  attendanceRate: string
  status: { label: string; tone: BadgeTone }
}

export function toEventPerformanceRow(
  row: EventPerformanceRowWire,
): EventPerformanceRow {
  return {
    id: row.eventId,
    name: row.eventName,
    meta: [bangkokDate(row.startAt), row.venue].filter(Boolean).join(' · '),
    href: eventDetailPath(row.eventId),
    registrations: num(row.registrations),
    // Null is the reader being told nothing, not the event earning nothing.
    revenue: row.revenueSatang === null ? MASKED : money(row.revenueSatang),
    attendanceRate: rate(row.attendanceRate),
    status: LIFECYCLE_BADGE[row.lifecycle],
  }
}

/* ── discount payback (US-RPT-10) ──────────────────────────────────────── */

/** Matching the kit's own three, plus the one it never showed. */
const STANDING_BADGE: Record<DiscountStanding, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'green' },
  scheduled: { label: 'Scheduled', tone: 'blue' },
  expired: { label: 'Expired', tone: 'gray' },
  // Switched off by hand. The kit had no such badge because its data had no
  // such code; rendering it as "Expired" would blame the calendar.
  disabled: { label: 'Disabled', tone: 'red' },
}

export interface DiscountReportRow {
  id: string
  code: string
  terms: string
  scope: string
  redemptions: string
  discount: string
  influenced: string
  returnRatio: string
  status: { label: string; tone: BadgeTone }
}

export function toDiscountRow(row: DiscountRowWire): DiscountReportRow {
  return {
    id: row.discountId,
    code: row.code,
    // A percentage code's wording is finished by the API; a fixed one's is
    // finished here, because its amount is satang until it reaches the edge.
    terms: row.terms ?? `${money(row.fixedValueSatang ?? 0)} off`,
    scope: row.scope,
    redemptions: num(row.redemptions),
    discount: money(row.discountSatang),
    influenced: money(row.influencedSatang),
    // "×4.0" reads as a multiple; a bare 4 next to money columns reads as ฿4.
    returnRatio: row.returnRatio === null ? MASKED : `×${row.returnRatio.toFixed(1)}`,
    status: STANDING_BADGE[row.standing],
  }
}

/* ── transaction ledger (US-RPT-06) ────────────────────────────────────── */

const OUTCOME_BADGE: Record<LedgerOutcome, { label: string; tone: BadgeTone }> = {
  succeeded: { label: 'Succeeded', tone: 'green' },
  refunded: { label: 'Refunded', tone: 'gray' },
  pending: { label: 'Pending', tone: 'amber' },
  failed: { label: 'Failed', tone: 'red' },
}

export interface TransactionRow {
  id: string
  reference: string
  date: string
  person: string
  event: string
  method: string
  /** Already signed and formatted: "-฿1,250" for a refund. */
  amount: string
  /** True for a refund, so the screen can colour the amount as money leaving. */
  outgoing: boolean
  type: string
  href: string
  status: { label: string; tone: BadgeTone }
}

/**
 * A ledger entry.
 *
 * The sign is applied HERE, not on the wire: the API keeps every amount
 * positive so its sums cannot be poisoned, and a refund reads as "-฿1,250"
 * only once it reaches a screen that can also colour it.
 */
export function toTransactionRow(row: LedgerRowWire): TransactionRow {
  const outgoing = row.kind === 'refund'
  return {
    id: row.id,
    reference: row.reference,
    date: bangkokDate(row.at),
    person: row.personName,
    event: row.eventName,
    method: row.method,
    amount: `${outgoing ? '-' : ''}${money(row.amountSatang)}`,
    outgoing,
    type: outgoing ? 'Refund' : 'Payment',
    href: `/admin/payments?q=${encodeURIComponent(row.reference)}`,
    status: OUTCOME_BADGE[row.outcome],
  }
}

/* ── the overview (US-RPT-01/03) ───────────────────────────────────────── */

/**
 * The kit's brand tint ramp, applied BY POSITION.
 *
 * The mix arrives largest-first, so the biggest slice takes the strongest tint
 * the way the static page did. Not `hashIndex`, which is for lists that have no
 * order of their own — here the order is the point.
 */
const MIX_RAMP = ['#1ba770', '#4cbd96', '#9fe0cd', '#d1d5db']

/** A tile, already formatted, with its chip when there is one to show. */
export interface OverviewTile {
  value: string
  delta?: Delta
}

/**
 * A figure the reader may not be allowed to see.
 *
 * A null KPI is the API withholding it; a null `value` inside one is the figure
 * genuinely not existing. Both read as "—", and neither is ฿0.
 */
function tileOf(
  kpi: { value: number | null; change: ChangeWire } | null,
  format: (value: number) => string,
): OverviewTile {
  if (kpi === null) return { value: MASKED }
  return {
    value: kpi.value === null ? MASKED : format(kpi.value),
    delta: toDelta(kpi.change),
  }
}

export function toOverviewTiles(kpis: OverviewWire['kpis']) {
  return {
    revenue: tileOf(kpis.revenueSatang, money),
    registrations: tileOf(kpis.registrations, num),
    attendance: tileOf(kpis.attendanceRate, percent),
    averageTicket: tileOf(kpis.averageTicketSatang, money),
    refundRate: tileOf(kpis.refundRate, percent),
  }
}

export interface MixSlice {
  name: string
  seats: string
  percent: number
  color: string
}

export function toMixSlices(mix: OverviewWire['ticketMix']): MixSlice[] {
  return mix.map((slice, index) => ({
    name: slice.ticketTypeName,
    seats: num(slice.seats),
    percent: slice.percent,
    color: MIX_RAMP[index % MIX_RAMP.length],
  }))
}

/**
 * The revenue chart's axis labels.
 *
 * Read from the bucket each point opens on, so they say what the granularity
 * means — days inside a month, "Wk n" across a quarter, month names across a
 * year — rather than repeating a date nobody can fit on an axis.
 */
export function toTrendLabels(
  points: { at: string }[],
  granularity: 'day' | 'week' | 'month',
): string[] {
  return points.map((point, index) => {
    const at = new Date(`${point.at}T00:00:00.000Z`)
    if (granularity === 'month') {
      return at.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    }
    if (granularity === 'week') return `Wk ${index + 1}`
    return String(at.getUTCDate())
  })
}

/**
 * Whether a period earned anything at all.
 *
 * Decided on the exact satang total, never on the charted points: those are
 * rounded to whole Baht for the axis, so a period that took ฿0.40 would have
 * every point sitting at zero and be declared empty while the revenue tile
 * beside it read ฿0.40. Nought is a real answer and deserves saying rather
 * than plotting — but only when it is actually nought.
 */
export function earnedSomething(totalSatang: number): boolean {
  return totalSatang > 0
}
