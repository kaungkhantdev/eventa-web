/**
 * The file formats a report can be exported as (US-RPT-11).
 *
 * The ids are the API's own, because they ARE the path: it serves each report
 * at `/reports/<report>.<format>`. Naming them once here is what keeps the
 * menu, the request and the saved file's extension from drifting apart.
 */

export const EXPORT_FORMATS = [
  { id: 'csv', label: 'CSV' },
  { id: 'xlsx', label: 'Excel' },
  { id: 'pdf', label: 'PDF' },
] as const

export type ExportFormat = (typeof EXPORT_FORMATS)[number]['id']

export interface FileDownload {
  format: ExportFormat
  label: string
  /** The API path to fetch. */
  path: string
  /** What the browser saves it as. */
  filename: string
}

/**
 * Every format of one report, as the Export menu needs it.
 *
 * `basePath` is the route without its extension (`/reports/income`) and `stem`
 * the name the file is saved under (`eventa-income`).
 */
export function fileDownloads(basePath: string, stem: string): FileDownload[] {
  return EXPORT_FORMATS.map(({ id, label }) => ({
    format: id,
    label,
    path: `${basePath}.${id}`,
    filename: `${stem}.${id}`,
  }))
}
