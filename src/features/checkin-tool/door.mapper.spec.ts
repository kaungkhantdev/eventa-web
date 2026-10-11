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
    expect(toDoorCounts({ total: 200, checkedIn: 50, expected: 150, onSite: 42, late: 8 })).toMatchObject({
      total: 200,
      checkedIn: 50,
      expected: 150,
    })
  })

  // The kit's stats card reads "On-site N · Late N · Remaining N". Late is the
  // API's, counted across the whole event — never derived from the page on
  // screen, which shows eight arrivals out of a thousand.
  it('carries the on-site and late split the stats card shows', () => {
    expect(toDoorCounts({ total: 200, checkedIn: 50, expected: 150, onSite: 42, late: 8 })).toMatchObject({
      onSite: 42,
      late: 8,
    })
  })

  it('works out the share of the room that has arrived', () => {
    expect(toDoorCounts({ total: 200, checkedIn: 50, expected: 150, onSite: 42, late: 8 }).percent).toBe(25)
    expect(toDoorCounts({ total: 3, checkedIn: 1, expected: 2, onSite: 1, late: 0 }).percent).toBe(33)
  })

  // An event nobody has booked is not 100% checked in, and must not divide by
  // zero on the way to saying so.
  it('is nought percent when nobody is expected', () => {
    expect(toDoorCounts({ total: 0, checkedIn: 0, expected: 0, onSite: 0, late: 0 }).percent).toBe(0)
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

/**
 * Every value the API can put on the wire, copied verbatim from the
 * `scan_outcome` pgEnum (`eventa-api/src/db/schema/enums.ts`) that
 * `ScanResultDto` publishes through `openapi.json` and the check-in service
 * returns unmapped.
 *
 * They are written out as literals rather than derived from this repo's own
 * union because the union is the thing that drifted: a list taken from it
 * would only ever test itself, which is why two refusals reached the door as
 * "could not read that" while both repos type-checked clean. `satisfies` ties
 * the two together, so a future API value has to be added to the union before
 * this file compiles.
 */
const API_SCAN_OUTCOMES = [
  'admitted',
  'already_checked_in',
  'invalid',
  'wrong_event',
  'cancelled',
] as const satisfies readonly ScanResultWire['outcome'][]

/** The mapper's last-resort copy, which no API outcome may ever reach. */
const UNRECOGNISED_TITLE = 'Could not read that'

describe('toScanFeedback', () => {
  it('welcomes somebody in', () => {
    expect(feedback()).toMatchObject({ tone: 'ok', title: 'Checked in' })
    expect(feedback().name).toBe('Anan Suksawat')
  })

  // The fallback tells the door to "admit them by name" — the opposite of what
  // a used or refunded ticket calls for. So every outcome the API can actually
  // send has to find its own row, and the fallback is left for the genuinely
  // unknown.
  it.each(API_SCAN_OUTCOMES)('has an answer of its own for %s', (outcome) => {
    expect(feedback({ outcome }).title).not.toBe(UNRECOGNISED_TITLE)
  })

  // The five outcomes are five different things to do about it, so the door
  // must never collapse them into "no".
  it('says they are already inside, and when they arrived', () => {
    expect(feedback({ outcome: 'already_checked_in' })).toMatchObject({
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
    expect(feedback({ outcome: 'cancelled' })).toMatchObject({
      tone: 'void',
      title: 'Entry denied',
    })
  })

  it('names an unknown code rather than leaving the panel blank', () => {
    expect(feedback({ outcome: 'invalid', holderName: null }).name).toBe('Unknown ticket')
  })

  // A sixth outcome the API grows is a value this union cannot describe yet,
  // which is the whole point of the fallback — and the only way to write that
  // down in a typed test is to assert past the type.
  it('still degrades safely for an outcome it has never heard of', () => {
    const unheardOf = 'beamed_aboard' as unknown as ScanResultWire['outcome']
    expect(feedback({ outcome: unheardOf })).toMatchObject({
      tone: 'invalid',
      title: UNRECOGNISED_TITLE,
    })
  })
})
