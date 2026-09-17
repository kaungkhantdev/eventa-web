/**
 * What `/reports/*` returns (US-RPT-02/05/08/09).
 *
 * The shapes are the API's, verbatim — anything that needs reshaping for the
 * screen is done in `insights.mapper.ts`, so a field rename over there breaks
 * one file rather than three pages.
 */

/** How a tile moved against the previous equal period. */
export interface ChangeWire {
  direction: 'up' | 'down' | 'flat'
  /** Null where there is no honest percentage — a baseline of zero is "new". */
  percent: number | null
  /** Whether the move is GOOD for this figure. Null when there is no verdict. */
  improved: boolean | null
}

/** The window a report covered, echoed back. Both ends are Bangkok days. */
export interface ReportPeriodWire {
  from: string
  to: string
  days: number
  /** The span asked for exceeded the 24-month cap and was cut back to it. */
  trimmed: boolean
}

interface ReportWire<Row, Totals> {
  period: ReportPeriodWire
  rows: Row[]
  /** How many events matched in total — what the paginator counts. */
  matchedEvents: number
  totals: Totals
}

/** An event's identity, carried by every report row. */
interface RowEvent {
  eventId: string
  eventName: string
  startAt: string
}

/* ── registrations (US-RPT-08) ─────────────────────────────────────────── */

export interface SplitWire {
  confirmed: number
  pending: number
  waitlisted: number
  cancelled: number
  rejected: number
  total: number
}

export type RegistrationsReportWire = ReportWire<
  RowEvent & SplitWire,
  SplitWire
> & { changes: Record<keyof SplitWire, ChangeWire> }

/* ── attendance (US-RPT-09) ────────────────────────────────────────────── */

/**
 * Every rate is nullable and the nulls carry meaning: an event that has not
 * started has no attendance, which is not the same as nobody attending.
 */
export interface AttendanceRowWire extends RowEvent {
  registered: number
  checkedIn: number
  noShows: number | null
  attendanceRate: number | null
  onTimeRate: number | null
}

export interface AttendanceTotalsWire {
  checkedIn: number
  noShows: number | null
  attendanceRate: number | null
  onTimeRate: number | null
}

export type AttendanceReportWire = ReportWire<
  AttendanceRowWire,
  AttendanceTotalsWire
> & { changes: Record<keyof AttendanceTotalsWire, ChangeWire> }

/* ── income (US-RPT-05) ────────────────────────────────────────────────── */

/** Integer satang throughout. */
export interface MoneyWire {
  grossSatang: number
  vatSatang: number
  refundsSatang: number
  feesSatang: number
  /** gross − VAT − refunds: the revenue figure, matching the overview. */
  netSatang: number
  /** net − fees: what reaches the bank. */
  settledSatang: number
}

export type IncomeReportWire = ReportWire<RowEvent & MoneyWire, MoneyWire> & {
  changes: Record<keyof MoneyWire, ChangeWire>
}
