import { describe, expect, it } from 'vitest'
import { EXPORT_FORMATS, fileDownloads } from './exportFormats'

/**
 * The formats the Export control offers (US-RPT-11).
 *
 * The story asks for CSV, Excel or PDF. The ids are the API's own, because
 * they are the path extension it serves — `/reports/income.xlsx`.
 */

describe('the formats on offer', () => {
  it('offers CSV, Excel and PDF, in that order', () => {
    expect(EXPORT_FORMATS.map((format) => format.id)).toEqual(['csv', 'xlsx', 'pdf'])
    expect(EXPORT_FORMATS.map((format) => format.label)).toEqual(['CSV', 'Excel', 'PDF'])
  })
})

describe('the download each one points at', () => {
  it('asks the API for the report as that format', () => {
    expect(fileDownloads('/reports/income', 'eventa-income').map((d) => d.path)).toEqual([
      '/reports/income.csv',
      '/reports/income.xlsx',
      '/reports/income.pdf',
    ])
  })

  it('saves the file under the report’s name, with the matching extension', () => {
    expect(fileDownloads('/reports/income', 'eventa-income').map((d) => d.filename)).toEqual([
      'eventa-income.csv',
      'eventa-income.xlsx',
      'eventa-income.pdf',
    ])
  })

  it('carries the label the menu shows', () => {
    const [csv] = fileDownloads('/reports/income', 'eventa-income')
    expect(csv).toEqual({
      format: 'csv',
      label: 'CSV',
      path: '/reports/income.csv',
      filename: 'eventa-income.csv',
    })
  })
})
