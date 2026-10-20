import { describe, expect, it } from 'vitest'
import {
  MEETING_MODE_LABEL,
  NO_MODE,
  initialMeetingMode,
  makesMeetLink,
  meetingInviteNote,
  meetingModeChoice,
  meetingSaveLabel,
  promisesMeetLink,
  scheduleNote,
} from './meetings.presentation'
import type { MeetingMode } from './meetings.types'

/**
 * Every mode the API accepts, written out rather than taken from the union so
 * a mode added there has to be named here — and so given words — before this
 * file compiles.
 */
const API_MEETING_MODES = ['Video', 'In person', 'Phone'] as const satisfies readonly MeetingMode[]

/**
 * The panel's primary button said "Save meeting" for both jobs. The kit calls
 * the new-meeting one "Schedule meeting", and it is the more useful label:
 * scheduling sends calendar invites to the guests, which is not what "save"
 * suggests. Rescheduling an existing one is genuinely a save, so it keeps that
 * wording — the same distinction the event wizard draws between publishing and
 * saving.
 */
describe('meetingSaveLabel', () => {
  it('offers to schedule a meeting that does not exist yet', () => {
    expect(meetingSaveLabel(false, false)).toBe('Schedule meeting')
  })

  it('offers to save one that already exists', () => {
    expect(meetingSaveLabel(true, false)).toBe('Save changes')
  })

  it('never offers to schedule a meeting that is already scheduled', () => {
    expect(meetingSaveLabel(true, false)).not.toContain('Schedule')
  })

  it('reports the write in progress, whichever job it is', () => {
    expect(meetingSaveLabel(false, true)).toBe('Saving…')
    expect(meetingSaveLabel(true, true)).toBe('Saving…')
  })
})

/**
 * US-MTG-03: the panel opened with Video already chosen and spelled "Video",
 * so an organizer who never touched the box scheduled a video call without
 * knowing — and only found out from the "Video call" badge on the new card.
 */
describe('initialMeetingMode', () => {
  it('chooses nothing for a new meeting', () => {
    expect(initialMeetingMode(null)).toBe(NO_MODE)
  })

  it('keeps the mode a meeting was saved with when it is edited', () => {
    expect(initialMeetingMode({ mode: 'Phone' })).toBe('Phone')
    expect(initialMeetingMode({ mode: 'Video' })).toBe('Video')
  })
})

describe('meetingModeChoice', () => {
  it('offers each mode in the words its badge will use', () => {
    expect(meetingModeChoice('Video')).toBe('Video call (Google Meet)')
    expect(meetingModeChoice('In person')).toBe('In person')
    expect(meetingModeChoice('Phone')).toBe('Phone call')
  })

  // The badge is what the organizer reads afterwards, so the choice they made
  // has to be recognisable in it — "Video" chosen, "Video call" shown was the
  // mismatch that made the badge look like it came from nowhere.
  it.each(API_MEETING_MODES)('starts with the badge label for %s', (mode) => {
    expect(meetingModeChoice(mode).startsWith(MEETING_MODE_LABEL[mode])).toBe(true)
  })
})

describe('makesMeetLink', () => {
  it('promises a Meet link for a video call', () => {
    expect(makesMeetLink('Video')).toBe(true)
  })

  it('promises none for a meeting held in person or by phone', () => {
    expect(makesMeetLink('In person')).toBe(false)
    expect(makesMeetLink('Phone')).toBe(false)
  })

  it('promises none before a mode has been chosen', () => {
    expect(makesMeetLink(NO_MODE)).toBe(false)
  })
})

/**
 * The note above Schedule promised every guest a Google Meet link, whatever the
 * mode — so an organizer who had just chosen In person was told the guest would
 * get a video call. Only a video meeting gets a Meet link (US-MTG-04), and the
 * panel names one only once Video call is chosen (US-MTG-03).
 */
describe('meetingInviteNote', () => {
  it('promises a Meet link with the invite for a video call', () => {
    expect(meetingInviteNote('Video')).toBe(
      'A Google Meet link and Google Calendar invite are emailed to each guest, with a reminder 15 minutes before.',
    )
  })

  it.each(['In person', 'Phone', NO_MODE] as const)(
    'promises only the invite and reminder for %j',
    (mode) => {
      expect(meetingInviteNote(mode)).toBe(
        'A Google Calendar invite is emailed to each guest, with a reminder 15 minutes before.',
      )
    },
  )
})

/*
 * US-MTG-08: with no Google Calendar connected, scheduling saves the meeting
 * and sends nothing — no invite, no Meet link. The panel said both were
 * emailed regardless, so an organizer only learned otherwise from the card.
 */
describe('scheduleNote', () => {
  const NOT_CONNECTED =
    "Google Calendar isn't connected, so this meeting will be saved without an invite or Meet link."

  it.each(['Video', 'In person', 'Phone', NO_MODE] as const)(
    'keeps the invite note while the calendar is connected (%j)',
    (mode) => {
      expect(scheduleNote(mode, true)).toBe(meetingInviteNote(mode))
    },
  )

  it.each(['Video', 'In person', 'Phone', NO_MODE] as const)(
    'says nothing will be sent while it is not (%j)',
    (mode) => {
      expect(scheduleNote(mode, false)).toBe(NOT_CONNECTED)
    },
  )
})

/*
 * The Mode hint under a Video choice — "A Meet link is generated
 * automatically." — is the same promise, and Google makes the link. Without
 * a connected calendar it would sit directly above a note saying no Meet link
 * will be made.
 */
describe('promisesMeetLink', () => {
  it('promises a Meet link for a video call while the calendar is connected', () => {
    expect(promisesMeetLink('Video', true)).toBe(true)
  })

  it('promises none while it is not', () => {
    expect(promisesMeetLink('Video', false)).toBe(false)
  })

  it.each(['In person', 'Phone', NO_MODE] as const)(
    'promises none for %j, connected or not',
    (mode) => {
      expect(promisesMeetLink(mode, true)).toBe(false)
      expect(promisesMeetLink(mode, false)).toBe(false)
    },
  )
})
