import { bangkokInstant } from '@/lib/format'

/**
 * Exporting the audit log for a date range (US-SET-05, NFR-SUP-02).
 *
 * `GET /audit/export` answers with a CSV of the range and records the export
 * as a new audit entry itself, so the console only has to ask for the right
 * range and save what comes back.
 */

/** The API route. Behind the bearer token, so fetched through `useDownload`. */
export const AUDIT_EXPORT_PATH = '/audit/export'

/** Bangkok keeps UTC+7 all year, so a day there is always exactly this long. */
const DAY_MS = 24 * 60 * 60 * 1000

export type AuditExportRequest =
  | { ok: true; query: { from: string; to: string }; filename: string }
  | { ok: false; error: string }

/**
 * Two days picked on the Bangkok calendar → the instants the API filters on.
 *
 * The API compares `occurred_at <= to`, so `to` is the last millisecond of the
 * chosen day rather than its first: a bare date would drop everything that
 * happened on it after midnight.
 */
export function auditExportOf(from: string, to: string): AuditExportRequest {
  const start = bangkokInstant(from)
  const lastDay = bangkokInstant(to)
  if (!start || !lastDay) return { ok: false, error: 'Choose both dates to export.' }
  if (Date.parse(start) > Date.parse(lastDay)) {
    return { ok: false, error: 'The start date is after the end date.' }
  }
  const end = new Date(Date.parse(lastDay) + DAY_MS - 1).toISOString()
  return { ok: true, query: { from: start, to: end }, filename: `audit-${from}-to-${to}.csv` }
}
