/**
 * The door (US-REG-11/12/13), as the API sends it and as the two screens
 * render it — the queue and the scanner station read one endpoint.
 */

/** `GET /events/:eventId/check-ins` — one person on the roll. */
export interface AttendanceWire {
  ticketId: string
  holderName: string | null
  /** The attendee's address, or the buyer's when the ticket names nobody. */
  attendeeEmail: string | null
  ticketLabel: string | null
  ticketTypeName: string
  status: 'checked_in' | 'expected'
  checkedInAt: string | null
  method: string | null
}

/** The room, counted across the whole event rather than the page on screen. */
export interface AttendanceCountsWire {
  total: number
  checkedIn: number
  expected: number
  /** Inside, and arrived before the event started. */
  onSite: number
  /** Inside, but walked in after it had started. */
  late: number
}

/** `POST .../scan` and `POST ...` — what the door saw. */
export interface ScanResultWire {
  /**
   * The API's `scan_outcome` enum, verbatim: it is a database enum and
   * `openapi.json` publishes its values, so these names are the API's to
   * choose and this union follows them exactly. Renaming one here is not a
   * cosmetic choice — it silently unhooks the outcome from `OUTCOMES`.
   */
  outcome: 'admitted' | 'already_checked_in' | 'invalid' | 'wrong_event' | 'cancelled'
  ticketId: string | null
  holderName: string | null
  ticketLabel: string | null
  checkedInAt: string | null
}

/* ── what the screens render ──────────────────────────────────────────── */

export interface AttendanceRow {
  ticketId: string
  name: string
  initials: string
  email: string
  ticketType: string
  checkedIn: boolean
  /** `14:32` on the Bangkok clock, or `—` while they are still expected. */
  time: string
}

export interface DoorCounts {
  checkedIn: number
  expected: number
  total: number
  /** Whole percent, for the progress strip. `0` when nobody is expected. */
  percent: number
  /** Inside and on time — the stats card's "On-site". */
  onSite: number
  /** Inside but after the start — the stats card's "Late". */
  late: number
}

/** What the station shows after reading a code. */
export interface ScanFeedback {
  /** Drives the colour and icon — five outcomes, five things to say. */
  tone: 'ok' | 'dupe' | 'invalid' | 'wrong' | 'void'
  title: string
  name: string
  detail: string
}
