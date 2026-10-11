import { describe, expect, it } from 'vitest'
import { toTimeline } from './activity.mapper'
import type { AuditEntryWire } from './activity.types'

/** An audit row as `GET /audit?subjectType=attendee&subjectId=42` answers. */
const entry = (over: Partial<AuditEntryWire> = {}): AuditEntryWire => ({
  id: 9001,
  type: 'attendee',
  title: 'Updated contact details',
  meta: 'attendee #42 · changed: email, phone',
  actorName: 'Somchai Tanakit',
  ipAddress: '203.0.113.9',
  occurredAt: '2026-07-15T03:24:00.000Z',
  ...over,
})

describe('an audit entry, as a line on the activity timeline', () => {
  it("says what the API said, on Bangkok's clock", () => {
    const [line] = toTimeline([entry({ actorName: null })])

    expect(line).toEqual({
      id: 9001,
      title: 'Updated contact details',
      when: 'Jul 15, 2026 · 10:24',
      isLatest: true,
    })
  })

  // 17:30Z is already tomorrow in Bangkok. Read on the reader's own clock, an
  // evening correction would be filed on the wrong calendar day.
  it('reads the instant as Bangkok, not as the browser happens to sit', () => {
    const [line] = toTimeline([entry({ occurredAt: '2026-07-15T17:30:00.000Z' })])

    expect(line?.when).toContain('Jul 16, 2026 · 00:30')
  })

  it('names who made the change, so repeated corrections are not one line four times', () => {
    const [line] = toTimeline([entry({ occurredAt: '2026-06-28T07:02:00.000Z' })])

    expect(line?.when).toBe('Jun 28, 2026 · 14:02 · Somchai Tanakit')
  })

  it('leaves no stray separator when nobody is recorded against it', () => {
    const [line] = toTimeline([entry({ actorName: null })])

    expect(line?.when).toBe('Jul 15, 2026 · 10:24')
  })

  /**
   * `meta` is a free-text prefix a writer in another repo composes
   * (`attendee #42 · changed: email, phone`) and nothing in the database
   * enforces. Parsing it here would put that format in two codebases, and the
   * subject marker is machine bookkeeping rather than something to read.
   */
  it('never re-derives the entry from the subject prefix in `meta`', () => {
    const [line] = toTimeline([entry()])

    expect(JSON.stringify(line)).not.toContain('attendee #42')
    expect(JSON.stringify(line)).not.toContain('changed:')
  })
})

describe('the timeline as a whole', () => {
  it('marks only the newest line, which the API sends first', () => {
    const lines = toTimeline([
      entry({ id: 3, occurredAt: '2026-07-15T03:24:00.000Z' }),
      entry({ id: 2, occurredAt: '2026-06-28T07:02:00.000Z' }),
      entry({ id: 1, occurredAt: '2026-03-03T01:00:00.000Z' }),
    ])

    expect(lines.map((line) => line.isLatest)).toEqual([true, false, false])
  })

  it('keeps the order the API sent rather than re-sorting a page of it', () => {
    const lines = toTimeline([entry({ id: 3 }), entry({ id: 2 }), entry({ id: 1 })])

    expect(lines.map((line) => line.id)).toEqual([3, 2, 1])
  })

  // The panel says so instead; it never draws the kit's sample rows.
  it('answers with nothing for an attendee who has no recorded history', () => {
    expect(toTimeline([])).toEqual([])
  })
})
