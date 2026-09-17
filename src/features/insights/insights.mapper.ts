import { MASKED, bangkokDate, num, satangAmount } from '@/lib/format'
import type {
  AttendanceRowWire,
  AttendanceTotalsWire,
  ChangeWire,
  IncomeReportWire,
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
