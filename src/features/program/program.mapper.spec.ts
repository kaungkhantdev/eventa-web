import { describe, expect, it } from 'vitest'
import { HOUR_HEIGHT, agendaDaysOf, toAgendaBlock, toSpeakerCard } from './program.mapper'
import type { SessionWire, SpeakerWire } from './program.types'

const speaker = (over: Partial<SpeakerWire> = {}): SpeakerWire => ({
  id: 's-1',
  eventId: 'e-1',
  name: 'Anong Prasert',
  role: 'CTO · Nimble Works',
  email: 'anong@nimble.co',
  phone: '02 555 0107',
  talkTitle: '',
  tag: '',
  initials: 'AP',
  tone: 'green',
  rating: '4.9',
  sessionCount: 2,
  bio: null,
  photoUrl: null,
  website: null,
  version: 1,
  ...over,
})

describe('toSpeakerCard', () => {
  it('reads as who they are and how to reach them', () => {
    const card = toSpeakerCard(speaker())

    expect(card).toMatchObject({
      name: 'Anong Prasert',
      role: 'CTO · Nimble Works',
      initials: 'AP',
      sessionCount: 2,
      rating: '4.9',
    })
  })

  // Nobody has rated them yet. That is not a rating of zero, and "0.0" beside
  // a speaker's name is a claim the product cannot support.
  it('shows a dash rather than a zero when there are no ratings', () => {
    expect(toSpeakerCard(speaker({ rating: '' })).rating).toBe('—')
    expect(toSpeakerCard(speaker({ rating: null })).rating).toBe('—')
  })

  it('tints the avatar from the tone the API assigned', () => {
    expect(toSpeakerCard(speaker({ tone: 'purple' })).avatar).toContain('purple')
  })

  // A speaker added through the form comes back with no initials and no tone —
  // the API only fills them in when the organizer supplies them. Left as-is
  // that is a blank, colourless circle where every other speaker has a face.
  it('derives the initials when the API has none', () => {
    expect(toSpeakerCard(speaker({ initials: null })).initials).toBe('AP')
  })

  it('still gives them a colour, and the same one every visit', () => {
    const card = toSpeakerCard(speaker({ tone: null }))

    expect(card.avatar).toBeTruthy()
    expect(card.avatar).toBe(toSpeakerCard(speaker({ tone: null })).avatar)
  })
})

const session = (over: Partial<SessionWire> = {}): SessionWire => ({
  id: 'ss-1',
  eventId: 'e-1',
  day: 1,
  startTime: '09:30:00',
  endTime: '10:30:00',
  title: 'Opening keynote',
  type: 'Keynote',
  room: 'Hall A',
  color: 'green',
  description: '',
  sortOrder: 0,
  speakers: [{ id: 's-1', name: 'Anong Prasert' }],
  version: 1,
  ...over,
})

describe('toAgendaBlock', () => {
  // Postgres returns a `time` column as HH:MM:SS. It is a wall clock with no
  // zone of its own, so it is trimmed — never converted, which would move a
  // 09:00 session by the reader's distance from Bangkok.
  it('shows the span on the clock, seconds trimmed', () => {
    expect(toAgendaBlock(session()).time).toBe('09:30 – 10:30')
  })

  it('names who is presenting', () => {
    expect(toAgendaBlock(session()).who).toBe('Anong Prasert')
  })

  it('joins a panel of speakers', () => {
    const block = toAgendaBlock(
      session({
        speakers: [
          { id: 's-1', name: 'Anong Prasert' },
          { id: 's-2', name: 'James Whitfield' },
        ],
      }),
    )

    expect(block.who).toBe('Anong Prasert, James Whitfield')
  })

  // A break has no speaker but still occupies the room and the hour.
  it('falls back to the room when nobody is presenting', () => {
    expect(toAgendaBlock(session({ speakers: [], type: 'Break' })).who).toBe('Hall A')
  })

  it('places the block against the calendar’s 09:00 top', () => {
    const block = toAgendaBlock(session({ startTime: '10:00:00', endTime: '11:30:00' }))

    expect(block.top).toBe(HOUR_HEIGHT)
    expect(block.height).toBe(HOUR_HEIGHT * 1.5)
  })

  it('keeps a session that starts before the calendar does on the grid', () => {
    const block = toAgendaBlock(session({ startTime: '08:00:00', endTime: '09:30:00' }))

    expect(block.top).toBe(0)
    expect(block.height).toBeGreaterThan(0)
  })
})

describe('agendaDaysOf', () => {
  it('numbers the days from the event’s own start', () => {
    const days = agendaDaysOf('2026-08-16T02:00:00.000Z', '2026-08-18T10:00:00.000Z')

    expect(days.map((d) => d.index)).toEqual([1, 2, 3])
    expect(days[0]).toMatchObject({ weekday: 'Sun', dayOfMonth: '16', isFirst: true })
  })

  // A one-day event still has a day 1 — the strip is never empty.
  it('gives a single-day event one column', () => {
    expect(agendaDaysOf('2026-08-16T02:00:00.000Z', null)).toHaveLength(1)
  })

  // The dates are the organizer's, in Bangkok: 17:00 UTC is already tomorrow
  // there, and counting in UTC would label the strip a day early.
  it('counts days on the Bangkok calendar', () => {
    const days = agendaDaysOf('2026-08-15T17:00:00.000Z', '2026-08-15T20:00:00.000Z')

    expect(days).toHaveLength(1)
    expect(days[0].dayOfMonth).toBe('16')
  })
})
