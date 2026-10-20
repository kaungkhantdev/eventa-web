import type { FilterPatch } from '@/lib/urlFilters'
import type { ReportPeriodWire } from './insights.types'
import { BOTH_DATES, END_BEFORE_START, MAX_SPAN_MONTHS } from '@/lib/constants/insights.constants'

/**
 * The date range every report sub-page filters by (US-RPT-02).
 *
 * Both days go into the URL together, because the API refuses half a range
 * rather than guessing the other end, and a named `range` is dropped since
 * explicit days win over it anyway. Applying drops the page number too — that
 * is `nextParams`' rule for every filter (AC5).
 */

export type DateRangeResult = { ok: true; patch: FilterPatch } | { ok: false; error: string }

/**
 * The reader's chosen days as a change to the URL, or why they cannot be
 * applied. Refused here, before any navigation, so a backwards window never
 * replaces the result on screen with an error page.
 *
 * `YYYY-MM-DD` strings order the same way as the days they name, so comparing
 * them as strings needs no timezone — they are Bangkok days on both sides.
 */
export function dateRangePatch(from: string, to: string): DateRangeResult {
  if (!from || !to) return { ok: false, error: BOTH_DATES }
  if (to < from) return { ok: false, error: END_BEFORE_START }
  return { ok: true, patch: { from, to, range: null } }
}

/** The note US-RPT-02 AC3 asks for when the API cut a span back to the cap. */
export function trimmedNote(period: ReportPeriodWire): string | null {
  if (!period.trimmed) return null
  return `Trimmed to the most recent ${MAX_SPAN_MONTHS} months — a report covers at most ${MAX_SPAN_MONTHS} months at a time.`
}
