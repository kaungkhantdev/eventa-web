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
export interface RowEvent {
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

/* ── event performance (US-RPT-04) ─────────────────────────────────────── */

/**
 * Where an event is in its life.
 *
 * Worked out by the API from the clock — `events.status` is not maintained past
 * publication, so it is deliberately NOT what this reports.
 */
export type EventLifecycle = 'upcoming' | 'live' | 'completed' | 'cancelled'

export interface EventPerformanceRowWire extends RowEvent {
  /** The venue, or "Online". Null where an in-person event named none. */
  venue: string | null
  city: string | null
  lifecycle: EventLifecycle
  /** Confirmed seats — what the ranking is by. */
  registrations: number
  /** Net of VAT and refunds, all time. Null when the reader may not see money. */
  revenueSatang: number | null
  /** Null for an event that has not started, and for one that issued nothing. */
  attendanceRate: number | null
}

export interface EventsReportWire {
  period: ReportPeriodWire
  rows: EventPerformanceRowWire[]
  matchedEvents: number
}

/* ── discount payback (US-RPT-10) ──────────────────────────────────────── */

export type DiscountStanding = 'active' | 'scheduled' | 'expired' | 'disabled'

export interface DiscountRowWire {
  discountId: string
  code: string
  standing: DiscountStanding
  /** A percentage code's terms, e.g. "25% off". Null for a fixed one. */
  terms: string | null
  /** What a FIXED code takes off, integer satang. Null for a percentage one. */
  fixedValueSatang: number | null
  scope: string
  redemptions: number
  discountSatang: number
  /** Order value the code drove — deliberately NOT the income report's net. */
  influencedSatang: number
  /** Null for a code nobody has used, and for one that cost nothing. */
  returnRatio: number | null
}

export interface DiscountsReportWire {
  period: ReportPeriodWire
  rows: DiscountRowWire[]
  matchedCodes: number
  totals: {
    activeCodes: number
    redemptions: number
    discountSatang: number
    influencedSatang: number
    returnRatio: number | null
  }
}

/* ── transaction ledger (US-RPT-06) ────────────────────────────────────── */

export type LedgerKind = 'payment' | 'refund'
export type LedgerOutcome = 'succeeded' | 'pending' | 'refunded' | 'failed'

export interface LedgerRowWire {
  id: string
  kind: LedgerKind
  /** A payment's txn; a refund's is derived from its parent's. */
  reference: string
  at: string
  personName: string
  eventId: string
  eventName: string
  /** As the schema knows it — `Card`, never a brand. */
  method: string
  /** Always positive; the minus sign belongs to the screen. */
  amountSatang: number
  outcome: LedgerOutcome
  paymentId: string
}

export interface TransactionsReportWire {
  period: ReportPeriodWire
  rows: LedgerRowWire[]
  matchedEntries: number
  totals: {
    entries: number
    payments: number
    failed: number
    refunds: number
    collectedSatang: number
    refundedSatang: number
    successRate: number | null
  }
}
