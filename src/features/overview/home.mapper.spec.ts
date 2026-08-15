import { describe, expect, it } from 'vitest'
import {
  toAlertRow,
  toMeetingRow,
  toRegistrationRow,
  toShareSlices,
  toTodayRegistrations,
  toUpcomingCard,
} from './home.mapper'
import type { AlertWire, FeedItemWire, MeetingWire, UpcomingEventWire } from './overview.types'

const feedItem = (over: Partial<FeedItemWire> = {}): FeedItemWire => ({
  orderId: '7c89f81b',
  attendeeName: 'Anong Pattana',
  eventName: 'Tech Summit 2026',
  ticketTypeName: 'VIP',
  totalSatang: 186900,
  paymentStatus: 'paid',
  // 03:24 UTC is 10:24 in Bangkok — the row must read the Bangkok clock.
  registeredAt: '2026-08-14T03:24:00.000Z',
  ...over,
})

describe('toRegistrationRow', () => {
  it('reads as attendee, what they booked, and when — on the Bangkok clock', () => {
    const row = toRegistrationRow(feedItem())

    expect(row.name).toBe('Anong Pattana')
    expect(row.initials).toBe('AP')
    expect(row.detail).toBe('Tech Summit 2026 · VIP')
    expect(row.time).toBe('10:24')
  })

  it('names only the event when the tier is withheld', () => {
    expect(toRegistrationRow(feedItem({ ticketTypeName: null })).detail).toBe('Tech Summit 2026')
  })

  it('gives the same person the same avatar tint on every visit', () => {
    expect(toRegistrationRow(feedItem()).tint).toBe(toRegistrationRow(feedItem()).tint)
  })
})

describe('toTodayRegistrations', () => {
  // The badge counts today; the feed is the newest sign-ups whenever they
  // happened. A quiet morning after a busy night therefore has rows to show and
  // still has to say nobody has registered *today*, which is what the API's
  // own emptyMessage decides — the count and the feed answer different
  // questions, and reading the feed's length would contradict the badge.
  it('shows the empty sentence when today is quiet, however busy yesterday was', () => {
    const panel = toTodayRegistrations({
      count: 0,
      recent: [feedItem()],
      emptyMessage: 'No registrations yet today.',
    })

    expect(panel.count).toBe(0)
    expect(panel.emptyMessage).toBe('No registrations yet today.')
  })

  it('shows the feed once today has activity', () => {
    const panel = toTodayRegistrations({ count: 3, recent: [feedItem()], emptyMessage: null })

    expect(panel.emptyMessage).toBeNull()
    expect(panel.rows).toHaveLength(1)
  })
})

const alert = (over: Partial<AlertWire> = {}): AlertWire => ({
  kind: 'pending_approvals',
  severity: 'warning',
  count: 152,
  message: { en: '152 registrations waiting.', th: 'มีการลงทะเบียน 152 รายการ' },
  href: '/registrations?status=pending',
  ...over,
})

describe('toAlertRow', () => {
  it('speaks the language the workspace reads in', () => {
    expect(toAlertRow(alert(), 'en').text).toBe('152 registrations waiting.')
    expect(toAlertRow(alert(), 'th').text).toBe('มีการลงทะเบียน 152 รายการ')
  })

  // The API names the module that owns the fix; this app mounts those under
  // /admin. Sending the raw href would land on a 404 instead of the queue.
  it('points at the console route that resolves it, query intact', () => {
    expect(toAlertRow(alert(), 'en').to).toBe('/admin/registrations?status=pending')
  })

  it('does not double up when the API already says /admin', () => {
    expect(toAlertRow(alert({ href: '/admin/tickets' }), 'en').to).toBe('/admin/tickets')
  })

  it('marks the most serious ones so they read as urgent', () => {
    expect(toAlertRow(alert({ severity: 'critical' }), 'en').tone).toContain('red')
    expect(toAlertRow(alert({ severity: 'info' }), 'en').icon).toBe('hgi-checkmark-circle-02')
  })
})

const upcoming = (over: Partial<UpcomingEventWire> = {}): UpcomingEventWire => ({
  id: '82077f15',
  name: 'Marathon for Mangroves',
  slug: 'marathon-for-mangroves',
  type: 'Sports & Wellness',
  status: 'upcoming',
  startAt: '2026-08-15T23:30:00.000Z',
  daysLeft: 2,
  sold: 640,
  capacity: 800,
  fillPercent: 80,
  ...over,
})

describe('toUpcomingCard', () => {
  it('counts down in whole days', () => {
    expect(toUpcomingCard(upcoming({ daysLeft: 12 })).daysLabel).toBe('12 days left')
    expect(toUpcomingCard(upcoming({ daysLeft: 1 })).daysLabel).toBe('1 day left')
  })

  it('says Today on the day it starts, and never counts backwards', () => {
    expect(toUpcomingCard(upcoming({ daysLeft: 0 })).daysLabel).toBe('Today')
    expect(toUpcomingCard(upcoming({ daysLeft: -1 })).daysLabel).toBe('Today')
  })

  it('shows how full it is and how many are coming', () => {
    const card = toUpcomingCard(upcoming())

    expect(card.progress).toBe(80)
    expect(card.attendees).toBe('+640')
  })
})

describe('toShareSlices', () => {
  const events = [
    { id: '1', name: 'Tech Summit', slug: 'tech-summit', registrations: 50 },
    { id: '2', name: 'Jazz Night', slug: 'jazz-night', registrations: 30 },
    { id: '3', name: 'Yoga Retreat', slug: 'yoga-retreat', registrations: 20 },
  ]

  it('splits the ring by each event’s share of sign-ups', () => {
    expect(toShareSlices(events).map((s) => s.percent)).toEqual([50, 30, 20])
  })

  // Rounding three-way splits leaves a point on the floor; the ring is a whole,
  // so the largest slice absorbs it rather than the total reading 99%.
  it('always adds up to a whole ring', () => {
    const thirds = toShareSlices([
      { ...events[0], registrations: 1 },
      { ...events[1], registrations: 1 },
      { ...events[2], registrations: 1 },
    ])

    expect(thirds.reduce((sum, s) => sum + s.percent, 0)).toBe(100)
  })

  it('draws nothing when nobody has registered yet, rather than a fake even split', () => {
    const idle = toShareSlices(events.map((e) => ({ ...e, registrations: 0 })))

    expect(idle.map((s) => s.percent)).toEqual([0, 0, 0])
    expect(idle.map((s) => s.name)).toEqual(['Tech Summit', 'Jazz Night', 'Yoga Retreat'])
  })

  it('keys each event to its own colour', () => {
    const colors = toShareSlices(events).map((s) => s.color)

    expect(new Set(colors).size).toBe(3)
  })
})

const meeting = (over: Partial<MeetingWire> = {}): MeetingWire => ({
  id: 'm1',
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
  eventId: null,
  eventName: null,
  place: null,
  link: null,
  notes: null,
  syncStatus: 'synced',
  canJoin: false,
  canEdit: true,
  cancellationReason: null,
  version: 1,
  ...over,
})

describe('toMeetingRow', () => {
  // The panel is already headed "Today's Meetings"; repeating it in every row
  // costs the space the time needs.
  it('shows the time span without repeating the day', () => {
    expect(toMeetingRow(meeting()).time).toBe('10:00 – 10:30')
  })

  it('says who it is with, and in what capacity', () => {
    expect(toMeetingRow(meeting()).who).toBe('Venue Coordinator · Sophia Reynolds')
  })

  it('falls back to the meeting type when the counterpart has no stated role', () => {
    expect(toMeetingRow(meeting({ role: null })).who).toBe('Venue · Sophia Reynolds')
  })
})
