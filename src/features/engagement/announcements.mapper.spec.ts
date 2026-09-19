import { describe, expect, it } from 'vitest'
import { toAnnouncementRow } from './announcements.mapper'
import type { AnnouncementWire } from './announcements.types'

const wire = (over: Partial<AnnouncementWire> = {}): AnnouncementWire => ({
  id: '7',
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  subject: 'Venue change notice',
  body: 'The keynote has moved to Hall B.',
  recipientCount: 1340,
  sentAt: '2026-07-05T03:30:00.000Z',
  ...over,
})

describe('a sent announcement', () => {
  it('reads as what was sent, to whom, and when', () => {
    const row = toAnnouncementRow(wire())
    expect(row.subject).toBe('Venue change notice')
    expect(row.meta).toBe('Tech Summit 2026 · 1,340 attendees · Jul 5, 2026')
  })

  it('dates it in Bangkok, not the reader’s timezone', () => {
    // 20:00 UTC on the 5th is already the 6th in Bangkok — the day the
    // organizer would say they sent it.
    const row = toAnnouncementRow(wire({ sentAt: '2026-07-05T20:00:00.000Z' }))
    expect(row.meta).toContain('Jul 6, 2026')
  })

  it('says one attendee, not 1 attendees', () => {
    const row = toAnnouncementRow(wire({ recipientCount: 1 }))
    expect(row.meta).toContain('1 attendee ·')
  })

  it('still names the send when the event has been deleted', () => {
    // The message reached people. Dropping the row, or leaving a blank where
    // the event was, would erase that.
    const row = toAnnouncementRow(wire({ eventName: null }))
    expect(row.meta).toBe('Deleted event · 1,340 attendees · Jul 5, 2026')
  })

  it('never claims nought attendees were written to as a success', () => {
    // An event with no confirmed attendees still records the send — the
    // organizer pressed send — but the count is the honest nought.
    const row = toAnnouncementRow(wire({ recipientCount: 0 }))
    expect(row.meta).toContain('0 attendees')
  })
})
