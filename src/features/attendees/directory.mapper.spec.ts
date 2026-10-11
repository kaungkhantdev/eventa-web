import { describe, expect, it } from 'vitest'
import { toAttendeeRow } from './directory.mapper'
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
  version: 4,
  ...over,
})

describe('toAttendeeRow', () => {
  /**
   * The panel seeds its hidden twins from `contact`, so a version dropped here
   * is a save with nothing to guard it — the organizer would overwrite a row
   * somebody else had already corrected, and be told nothing.
   */
  it('carries the version into the details the panel edits', () => {
    expect(toAttendeeRow(wire({ version: 9 })).contact).toEqual({
      name: 'Anong Pattana',
      email: 'anong.p@example.com',
      phone: '02 555 0107',
      version: 9,
    })
  })

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

  /**
   * The dash belongs to the cell, not to the form behind it (US-REG-08).
   *
   * `phone` is already formatted for the table, so an edit panel seeded from it
   * would put "—" in the box and PATCH that string as somebody's phone number.
   * `contact` is what the row actually stores, untouched.
   */
  it('keeps the stored details apart from the formatted cells', () => {
    expect(toAttendeeRow(wire()).contact).toEqual({
      name: 'Anong Pattana',
      email: 'anong.p@example.com',
      phone: '02 555 0107',
      version: 4,
    })
  })

  it('leaves an unrecorded phone absent for the form, where the cell shows a dash', () => {
    const row = toAttendeeRow(wire({ phone: null }))

    expect(row.phone).toBe('—')
    expect(row.contact.phone).toBeNull()
  })

  it('tints a tagged attendee, and leaves an untagged one plain', () => {
    expect(toAttendeeRow(wire({ tag: 'Speaker' })).tagClass).toBeTruthy()
    expect(toAttendeeRow(wire({ tag: null })).tag).toBeNull()
  })
})
