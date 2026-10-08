import { describe, expect, it } from 'vitest'
import { toAnnouncementRow } from './announcements.mapper'
import type { AnnouncementWire } from './announcements.types'

const wire = (over: Partial<AnnouncementWire> = {}): AnnouncementWire => ({
  id: '7',
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  subject: 'Venue change notice',
  body: 'The keynote has moved to Hall B.',
  status: 'sent',
  scheduledFor: null,
  sentAt: '2026-07-05T03:30:00.000Z',
  cancelledAt: null,
  recipientCount: 1340,
  ...over,
})

/** 10:00 on Aug 5 in Bangkok (TC-MSG-11). */
const DUE = '2026-08-05T03:00:00.000Z'

const scheduled = (over: Partial<AnnouncementWire> = {}) =>
  wire({ status: 'scheduled', scheduledFor: DUE, sentAt: null, recipientCount: null, ...over })

describe('a sent announcement', () => {
  it('reads as what was sent, to whom, and when', () => {
    const row = toAnnouncementRow(wire())
    expect(row.subject).toBe('Venue change notice')
    expect(row.meta).toBe('Tech Summit 2026 · 1,340 attendees · Jul 5, 2026')
  })

  it('wears the kit’s green Sent badge', () => {
    expect(toAnnouncementRow(wire()).badge).toEqual({
      tone: 'green',
      icon: 'hgi-tick-02',
      label: 'Sent',
    })
  })

  it('can no longer be changed', () => {
    expect(toAnnouncementRow(wire()).canChange).toBe(false)
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

describe('a scheduled announcement (US-MSG-04)', () => {
  it('says when it will go, on the Bangkok clock', () => {
    expect(toAnnouncementRow(scheduled()).meta).toBe(
      'Tech Summit 2026 · Scheduled for Aug 5, 2026 · 10:00',
    )
  })

  it('uses the Bangkok day across UTC midnight', () => {
    // 20:00 UTC on the 5th is 03:00 on the 6th in Bangkok.
    const row = toAnnouncementRow(scheduled({ scheduledFor: '2026-08-05T20:00:00.000Z' }))
    expect(row.meta).toBe('Tech Summit 2026 · Scheduled for Aug 6, 2026 · 03:00')
  })

  it('wears the kit’s blue Scheduled badge', () => {
    expect(toAnnouncementRow(scheduled()).badge).toEqual({
      tone: 'blue',
      icon: 'hgi-time-schedule',
      label: 'Scheduled',
    })
  })

  it('can still be cancelled or moved', () => {
    expect(toAnnouncementRow(scheduled()).canChange).toBe(true)
  })

  it('never claims it reached nobody before anyone was counted', () => {
    // Null is "not counted yet". Rendering it as 0 attendees would state a
    // fact nobody has established.
    const row = toAnnouncementRow(scheduled())
    expect(row.meta).not.toMatch(/attendee/)
  })

  it('offers its time back as the reschedule field’s value, in Bangkok', () => {
    expect(toAnnouncementRow(scheduled()).sendAtInput).toBe('2026-08-05T10:00')
  })

  it('names its time for a confirmation', () => {
    expect(toAnnouncementRow(scheduled()).when).toBe('Aug 5, 2026 · 10:00')
  })
})

describe('a cancelled announcement (US-MSG-05)', () => {
  const cancelled = () =>
    scheduled({ status: 'cancelled', cancelledAt: '2026-08-01T02:00:00.000Z' })

  it('stays in the history, saying it was called off and when it would have gone', () => {
    expect(toAnnouncementRow(cancelled()).meta).toBe(
      'Tech Summit 2026 · Cancelled · was due Aug 5, 2026 · 10:00',
    )
  })

  it('no longer shows as scheduled', () => {
    expect(toAnnouncementRow(cancelled()).badge).toEqual({
      tone: 'gray',
      icon: 'hgi-cancel-circle',
      label: 'Cancelled',
    })
  })

  it('can no longer be changed', () => {
    expect(toAnnouncementRow(cancelled()).canChange).toBe(false)
    expect(toAnnouncementRow(cancelled()).sendAtInput).toBeNull()
  })
})
