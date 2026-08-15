import { describe, expect, it } from 'vitest'
import { toMeetingCard } from './meetings.mapper'
import type { MeetingWire } from './meetings.types'

const wire = (over: Partial<MeetingWire> = {}): MeetingWire => ({
  id: 'm-1',
  title: 'Seating plan approval',
  date: '2026-08-15',
  startTime: '10:00:00',
  endTime: '10:30:00',
  startsAt: '2026-08-15T03:00:00.000Z',
  timeLabel: 'Today · 10:00 – 10:30',
  bucket: 'today',
  isToday: true,
  type: 'Venue',
  mode: 'Video',
  status: 'scheduled',
  person: 'Sophia Reynolds',
  role: 'Venue Coordinator',
  guestEmail: 'sophia@qsncc.co.th',
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  place: 'https://meet.google.com/abc-defg-hij',
  link: 'https://meet.google.com/abc-defg-hij',
  notes: null,
  syncStatus: 'synced',
  canJoin: true,
  canEdit: true,
  cancellationReason: null,
  version: 1,
  ...over,
})

describe('toMeetingCard', () => {
  it('reads as what, when, and with whom', () => {
    const card = toMeetingCard(wire())

    expect(card.title).toBe('Seating plan approval')
    expect(card.when).toBe('Today · 10:00 – 10:30')
    expect(card.who).toBe('Venue Coordinator · Sophia Reynolds')
  })

  it('falls back to the meeting type when the counterpart has no stated role', () => {
    expect(toMeetingCard(wire({ role: null })).who).toBe('Venue · Sophia Reynolds')
  })

  // A meeting with no event covers all of them — that is a real answer, not a
  // missing one, so it is spelled out rather than left blank.
  it('names a general meeting as covering every event', () => {
    expect(toMeetingCard(wire({ eventId: null, eventName: null })).event).toBe('All events')
  })

  it('styles the type and the mode', () => {
    expect(toMeetingCard(wire({ type: 'Sponsor' })).typeStyle.icon).toBe('hgi-briefcase-01')
    expect(toMeetingCard(wire({ mode: 'Phone' })).modeLabel).toBe('Phone')
  })

  // Whether a join button appears is the API's call: it knows the meeting is
  // video, not past, not cancelled, and that the link is ready.
  it('leaves joining to the API rather than guessing from the mode', () => {
    expect(toMeetingCard(wire({ mode: 'Video', canJoin: false })).canJoin).toBe(false)
  })

  // An invite that never went out is the difference between a meeting somebody
  // knows about and one only the organizer can see.
  it('says so when the calendar invite has not gone out', () => {
    expect(toMeetingCard(wire({ syncStatus: 'pending' })).syncNote).toContain('not been sent')
    expect(toMeetingCard(wire({ syncStatus: 'failed' })).syncNote).toContain("couldn't")
    expect(toMeetingCard(wire({ syncStatus: 'synced' })).syncNote).toBeNull()
  })

  it('carries an edit draft with the times a form can use', () => {
    const draft = toMeetingCard(wire()).edit

    expect(draft.startTime).toBe('10:00')
    expect(draft.endTime).toBe('10:30')
    expect(draft.version).toBe(1)
  })
})
