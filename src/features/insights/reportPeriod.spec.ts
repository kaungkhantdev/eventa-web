import { describe, expect, it } from 'vitest'
import { nextParams } from '@/lib/urlFilters'
import { dateRangePatch, trimmedNote } from './reportPeriod'

/*
 * The date range every report sub-page filters by (US-RPT-02).
 *
 * The API refuses a backwards window with the story's own sentence, but by
 * then the reader has navigated to a URL that cannot be shown. So the control
 * refuses first, with the same sentence, and leaves the result on screen as it
 * was (AC2).
 */

describe('applying a start and an end date', () => {
  it('writes both days to the URL together', () => {
    expect(dateRangePatch('2026-07-01', '2026-07-31')).toEqual({
      ok: true,
      patch: { from: '2026-07-01', to: '2026-07-31', range: null },
    })
  })

  it('accepts a single day, start and end the same', () => {
    expect(dateRangePatch('2026-07-01', '2026-07-01').ok).toBe(true)
  })

  it('refuses an end earlier than the start, in the story’s words', () => {
    expect(dateRangePatch('2026-07-31', '2026-07-01')).toEqual({
      ok: false,
      error: 'End date must be on or after the start date',
    })
  })

  it.each([
    ['', '2026-07-31'],
    ['2026-07-01', ''],
  ])('refuses half a range (%j to %j), which the API would refuse too', (from, to) => {
    expect(dateRangePatch(from, to)).toEqual({
      ok: false,
      error: 'Choose both a start and an end date',
    })
  })

  it('returns the reader to the first page (AC5)', () => {
    const result = dateRangePatch('2026-07-01', '2026-07-31')
    if (!result.ok) throw new Error('expected a patch')
    const next = nextParams(new URLSearchParams('page=4&q=gala&range=30d'), result.patch)
    expect(next.get('page')).toBeNull()
    expect(next.get('q')).toBe('gala')
    expect(next.get('range')).toBeNull()
    expect(next.get('from')).toBe('2026-07-01')
    expect(next.get('to')).toBe('2026-07-31')
  })
})

describe('a span the API trimmed (AC3)', () => {
  const period = { from: '2024-10-15', to: '2026-10-15', days: 731, trimmed: true }

  it('says so, and why', () => {
    expect(trimmedNote(period)).toBe(
      'Trimmed to the most recent 24 months — a report covers at most 24 months at a time.',
    )
  })

  it('says nothing when the span was within the limit', () => {
    expect(trimmedNote({ ...period, days: 30, trimmed: false })).toBeNull()
  })
})
