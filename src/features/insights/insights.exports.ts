import { fileDownloads, type FileDownload } from '@/lib/exportFormats'

/**
 * Every report's Export menu (US-RPT-11).
 *
 * One entry per report, built from the report's own key, so the API path and
 * the saved file's name are derived rather than retyped on six pages.
 */

const REPORTS = [
  'registrations',
  'attendance',
  'events',
  'income',
  'discounts',
  'transactions',
] as const

type Report = (typeof REPORTS)[number]

export const REPORT_DOWNLOADS = Object.fromEntries(
  REPORTS.map((report) => [report, fileDownloads(`/reports/${report}`, `eventa-${report}`)]),
) as Record<Report, FileDownload[]>
