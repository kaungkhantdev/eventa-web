import { describe, expect, it } from 'vitest'
import { toAttendanceRow, toDoorCounts, toScanFeedback } from './door.mapper'
import type { AttendanceWire, ScanResultWire } from './door.types'

const WIRE: AttendanceWire = {
  ticketId: 't-1',
  holderName: 'Anan Suksawat',
  attendeeEmail: 'anan@example.com',
  ticketLabel: 'General',
  ticketTypeName: 'General admission',
  status: 'expected',
  checkedInAt: null,
  method: null,
}

const row = (patch: Partial<AttendanceWire> = {}) => toAttendanceRow({ ...WIRE, ...patch })

describe('toAttendanceRow', () => {
  it('carries the person through', () => {
    expect(row()).toMatchObject({
      ticketId: 't-1',
      name: 'Anan Suksawat',
      email: 'anan@example.com',
      ticketType: 'General admission',
    })
  })

  it('derives initials for the avatar', () => {
    expect(row().initials).toBe('AS')
  })

  // A ticket can be issued without naming anybody — it is still one seat, and
  // the door still has to show a row for it.
  it('labels an unnamed ticket rather than rendering a blank row', () => {
    expect(row({ holderName: null })).toMatchObject({
      name: 'Unnamed ticket',
      initials: '—',
    })
  })

  it('leaves the address empty when there is none', () => {
    expect(row({ attendeeEmail: null }).email).toBe('')
  })

  describe('arrival', () => {
    it('reads the Bangkok clock', () => {
      expect(row({ status: 'checked_in', checkedInAt: '2026-09-01T07:32:00.000Z' })).toMatchObject({
        checkedIn: true,
        time: '14:32',
      })
    })

    // 20:00 UTC is already tomorrow in Bangkok; the door's clock is Bangkok's.
    it('reads an evening arrival on the local clock, not the browser’s', () => {
      expect(row({ status: 'checked_in', checkedInAt: '2026-09-01T20:00:00.000Z' }).time).toBe(
        '03:00',
      )
    })

    it('shows a dash while somebody is still expected', () => {
      expect(row()).toMatchObject({ checkedIn: false, time: '—' })
    })
  })
})

describe('toDoorCounts', () => {
  it('carries the API’s own figures', () => {
    expect(toDoorCounts({ total: 200, checkedIn: 50, expected: 150 })).toMatchObject({
      total: 200,
      checkedIn: 50,
      expected: 150,
    })
  })

  it('works out the share of the room that has arrived', () => {
    expect(toDoorCounts({ total: 200, checkedIn: 50, expected: 150 }).percent).toBe(25)
    expect(toDoorCounts({ total: 3, checkedIn: 1, expected: 2 }).percent).toBe(33)
  })

  // An event nobody has booked is not 100% checked in, and must not divide by
  // zero on the way to saying so.
  it('is nought percent when nobody is expected', () => {
    expect(toDoorCounts({ total: 0, checkedIn: 0, expected: 0 }).percent).toBe(0)
  })
})

const SCAN: ScanResultWire = {
  outcome: 'admitted',
  ticketId: 't-1',
  holderName: 'Anan Suksawat',
  ticketLabel: 'General',
  checkedInAt: '2026-09-01T07:32:00.000Z',
}

const feedback = (patch: Partial<ScanResultWire> = {}) => toScanFeedback({ ...SCAN, ...patch })

describe('toScanFeedback', () => {
  it('welcomes somebody in', () => {
    expect(feedback()).toMatchObject({ tone: 'ok', title: 'Checked in' })
    expect(feedback().name).toBe('Anan Suksawat')
  })

  // The five outcomes are five different things to do about it, so the door
  // must never collapse them into "no".
  it('says they are already inside, and when they arrived', () => {
    expect(feedback({ outcome: 'already_in' })).toMatchObject({
      tone: 'dupe',
      title: 'Already checked in',
      detail: 'Arrived at 14:32',
    })
  })

  it('says the code is not one of ours', () => {
    expect(feedback({ outcome: 'invalid', holderName: null })).toMatchObject({
      tone: 'invalid',
      title: 'Not a valid ticket',
    })
  })

  it('says the ticket is for a different event', () => {
    expect(feedback({ outcome: 'wrong_event' })).toMatchObject({
      tone: 'wrong',
      title: 'Wrong event',
    })
  })

  it('says entry is denied for a refunded or void ticket', () => {
    expect(feedback({ outcome: 'denied' })).toMatchObject({
      tone: 'void',
      title: 'Entry denied',
    })
  })

  it('names an unknown code rather than leaving the panel blank', () => {
    expect(feedback({ outcome: 'invalid', holderName: null }).name).toBe('Unknown ticket')
  })
})
