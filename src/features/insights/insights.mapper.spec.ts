import { describe, expect, it } from 'vitest'
import {
  toAttendanceRow,
  toDelta,
  toIncomeRow,
  toRegistrationRow,
} from './insights.mapper'
import type { AttendanceRowWire, ChangeWire } from './insights.types'

/**
 * The reports' view models.
 *
 * Everything here is a rule the API states and the screen has to render without
 * losing it: a change with no honest percentage, a rate that does not exist yet,
 * and money that is integer satang until the moment it is read.
 */

const change = (over: Partial<ChangeWire> = {}): ChangeWire => ({
  direction: 'up',
  percent: 12.5,
  improved: true,
  ...over,
})

const EVENT = {
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  startAt: '2026-07-18T02:00:00.000Z',
}

describe('toDelta', () => {
  it('reads a percentage without its sign — the arrow carries that', () => {
    expect(toDelta(change({ direction: 'down', percent: -8.2 })).text).toBe('8.2%')
  })

  it('points the arrow the way the figure moved', () => {
    expect(toDelta(change()).direction).toBe('up')
    expect(toDelta(change({ direction: 'down' })).direction).toBe('down')
  })

  it('colours by what is GOOD for the figure, not by the sign', () => {
    // A falling refund rate is an improvement, and must not render as a loss.
    const falling = toDelta(change({ direction: 'down', improved: true }))
    expect(falling.tone).toBe('good')
  })

  it('colours an unfavourable move as a warning', () => {
    expect(toDelta(change({ improved: false })).tone).toBe('bad')
  })

  it('stays neutral where the API passes no verdict', () => {
    // VAT moved, but it was the Revenue Department's money either way.
    expect(toDelta(change({ improved: null })).tone).toBe('neutral')
  })

  it('shows a dash rather than a percentage off a baseline of nothing', () => {
    // 0 → 5 is "new", not "+500%".
    const fromNothing = toDelta(change({ percent: null }))
    expect(fromNothing.text).toBe('—')
    expect(fromNothing.direction).toBe('up')
  })

  it('draws no arrow at all when nothing moved', () => {
    const flat = toDelta(change({ direction: 'flat', percent: 0, improved: null }))
    expect(flat.direction).toBeNull()
    expect(flat.tone).toBe('neutral')
    expect(flat.text).toBe('0%')
  })

  it('shows a dash for a flat change with no baseline to speak of', () => {
    expect(
      toDelta(change({ direction: 'flat', percent: null, improved: null })).text,
    ).toBe('—')
  })
})

describe('toRegistrationRow', () => {
  const row = toRegistrationRow({
    ...EVENT,
    confirmed: 400,
    pending: 12,
    waitlisted: 8,
    cancelled: 5,
    rejected: 2,
    total: 427,
  })

  it('carries the event and the day it runs', () => {
    expect(row.name).toBe('Tech Summit 2026')
    expect(row.meta).toBe('Jul 18, 2026')
  })

  it('keeps every state the API reported', () => {
    expect(row.total).toBe('427')
    expect(row.confirmed).toBe('400')
    expect(row.cancelled).toBe('5')
  })

  it('keys the row on the event, not its name', () => {
    // Two events may share a name; they never share an id.
    expect(row.id).toBe('e-1')
  })
})

describe('toAttendanceRow', () => {
  const row = (over: Partial<AttendanceRowWire> = {}) =>
    toAttendanceRow({
      ...EVENT,
      registered: 400,
      checkedIn: 320,
      noShows: 80,
      attendanceRate: 80,
      onTimeRate: 75,
      ...over,
    })

  it('reads a rate as a percentage', () => {
    expect(row().attendanceRate).toBe('80%')
  })

  it('shows a dash for an event that has not started', () => {
    // Not 0% — nobody could have been checked in yet, and a zero would read as
    // an event nobody turned up to.
    const upcoming = row({ noShows: null, attendanceRate: null })
    expect(upcoming.attendanceRate).toBe('—')
    expect(upcoming.noShows).toBe('—')
  })

  it('shows 0% for a finished event nobody attended', () => {
    // This one really is zero, and saying so is the point of the report.
    expect(row({ attendanceRate: 0 }).attendanceRate).toBe('0%')
  })
})

describe('toIncomeRow', () => {
  const row = toIncomeRow({
    ...EVENT,
    grossSatang: 107_000,
    vatSatang: 7_000,
    refundsSatang: 10_000,
    feesSatang: 3_000,
    netSatang: 90_000,
    settledSatang: 87_000,
  })

  it('reads satang as Baht', () => {
    expect(row.gross).toBe('฿1,070')
    expect(row.net).toBe('฿900')
  })

  it('reads a free event as ฿0 rather than describing it', () => {
    // "Free" belongs on a ticket, not in a column of sums that must add up.
    const empty = toIncomeRow({
      ...EVENT,
      grossSatang: 0,
      vatSatang: 0,
      refundsSatang: 0,
      feesSatang: 0,
      netSatang: 0,
      settledSatang: 0,
    })
    expect(empty.gross).toBe('฿0')
  })
})
