import { describe, expect, it } from 'vitest'
import { toAttendeeRow } from './directory.mapper'
import { emailsOf } from './directory.routes'
import type { AttendeeWire } from './directory.types'

const wire = (over: Partial<AttendeeWire> = {}): AttendeeWire => ({
  id: 3425,
  name: 'Anong Pattana',
  email: 'anong.p@example.com',
  phone: '02 555 0107',
  company: null,
  tag: 'VIP',
  firstSeenAt: '2026-07-01T02:00:00.000Z',
  lastActivityAt: '2026-07-08T17:30:00.000Z',
  eventCount: 3,
  ticketCount: 5,
  checkedInCount: 2,
  ...over,
})

describe('toAttendeeRow', () => {
  it('reads as a person, with their initials for the avatar', () => {
    const row = toAttendeeRow(wire())

    expect(row).toMatchObject({
      name: 'Anong Pattana',
      email: 'anong.p@example.com',
      initials: 'AP',
      tickets: 5,
    })
  })

  it('counts events in words, singular and plural', () => {
    expect(toAttendeeRow(wire({ eventCount: 1 })).events).toBe('1 event')
    expect(toAttendeeRow(wire({ eventCount: 3 })).events).toBe('3 events')
  })

  // A blank cell reads as something failing to render; a dash says there is
  // nothing recorded, which is the truth.
  it('marks an absent phone rather than leaving the cell empty', () => {
    expect(toAttendeeRow(wire({ phone: null })).phone).toBe('—')
  })

  // 17:30 UTC on Jul 8 is already Jul 9 in Bangkok — the organizer's calendar
  // is the one on screen.
  it('dates the last activity on the Bangkok calendar', () => {
    expect(toAttendeeRow(wire()).lastActivity).toBe('Jul 9, 2026')
  })

  it('tints a tagged attendee, and leaves an untagged one plain', () => {
    expect(toAttendeeRow(wire({ tag: 'Speaker' })).tagClass).toBeTruthy()
    expect(toAttendeeRow(wire({ tag: null })).tag).toBeNull()
  })
})

describe('emailsOf', () => {
  it('takes addresses however they were pasted in', () => {
    expect(emailsOf('a@x.co, b@x.co\nc@x.co; d@x.co')).toEqual([
      'a@x.co',
      'b@x.co',
      'c@x.co',
      'd@x.co',
    ])
  })

  // Two invitations to the same event is how a workspace's mail gets marked
  // as spam — and case is not a difference between two people.
  it('sends each person one invitation', () => {
    expect(emailsOf('a@x.co\nA@X.CO')).toEqual(['a@x.co'])
  })

  it('ignores anything that is not an address', () => {
    expect(emailsOf('please invite: a@x.co and friends')).toEqual(['a@x.co'])
  })
})
