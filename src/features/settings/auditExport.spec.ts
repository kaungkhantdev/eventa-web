import { describe, expect, it } from 'vitest'
import { auditExportOf } from './auditExport'

/*
 * US-SET-05: "Given I export the log for a date range, when the download
 * completes, then I get a file for that range and the export itself is
 * recorded as a new audit entry."
 *
 * `GET /audit/export` takes `from` and `to` as instants and compares
 * `occurred_at >= from AND occurred_at <= to`. The organizer picks two days on
 * the Bangkok calendar, so the range has to start at Bangkok midnight on the
 * first and run to the last instant of the second — or a whole evening of
 * entries falls off one end.
 */
describe('a date range, as GET /audit/export takes it', () => {
  it('starts at midnight in Bangkok on the first day', () => {
    const request = auditExportOf('2026-07-01', '2026-07-31')

    expect(request.ok && request.query.from).toBe('2026-06-30T17:00:00.000Z')
  })

  // `to` is inclusive on the API, and a bare `2026-07-31` would be read as
  // that day's first instant — everything after midnight would be missing.
  it('runs to the last instant of the last day in Bangkok', () => {
    const request = auditExportOf('2026-07-01', '2026-07-31')

    expect(request.ok && request.query.to).toBe('2026-07-31T16:59:59.999Z')
  })

  it('covers a single whole day when both dates are the same', () => {
    expect(auditExportOf('2026-07-08', '2026-07-08')).toMatchObject({
      ok: true,
      query: { from: '2026-07-07T17:00:00.000Z', to: '2026-07-08T16:59:59.999Z' },
    })
  })

  it('names the file after the days that were chosen', () => {
    const request = auditExportOf('2026-07-01', '2026-07-31')

    expect(request.ok && request.filename).toBe('audit-2026-07-01-to-2026-07-31.csv')
  })

  it.each([
    ['', '2026-07-31'],
    ['2026-07-01', ''],
    ['not-a-date', '2026-07-31'],
  ])('asks for both dates rather than exporting %j to %j', (from, to) => {
    expect(auditExportOf(from, to)).toEqual({ ok: false, error: 'Choose both dates to export.' })
  })

  it('refuses a range that ends before it starts', () => {
    expect(auditExportOf('2026-07-31', '2026-07-01')).toEqual({
      ok: false,
      error: 'The start date is after the end date.',
    })
  })
})
