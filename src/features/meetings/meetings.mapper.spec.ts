import { describe, expect, it } from 'vitest'
import type { CalendarConnectionStatus } from '@/features/settings/calendarConnection.api'
import { connectLinkLabel } from '@/features/settings/calendarConnection.mapper'
import {
  ASK_ADMIN_NOTE,
  pendingKeyOf,
  shouldPollSync,
  syncActionOf,
  toMeetingCard,
} from './meetings.mapper'
import { meetingModeChoice } from './meetings.presentation'
import type { MeetingStatus, MeetingWire, SyncStatus } from './meetings.types'

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

/**
 * Every value the API can put on `syncStatus`, copied verbatim from the
 * `meeting_sync_status` pgEnum in `eventa-api/src/db/schema/enums.ts`, which
 * `MeetingDto` republishes as `@ApiProperty({ enum: ... })` and the meetings
 * service returns unmapped.
 *
 * They are written out as literals rather than derived from this repo's own
 * `SyncStatus` union, because that union is the thing that drifted: a list
 * taken from it would only ever test itself. `satisfies` ties the two
 * together, so a value the API gains has to be added to the union before this
 * file compiles.
 */
const API_SYNC_STATUSES = [
  'pending',
  'synced',
  'failed',
  'not_connected',
] as const satisfies readonly SyncStatus[]

/**
 * The same list for `meeting_status`, from the same pgEnum file. There are
 * deliberately only two: whether a meeting has happened is derived from its
 * date, so the API has no `completed` to send.
 *
 * A type rather than a const, unlike the sync list above, because there is no
 * lookup keyed by `MeetingWire.status` — only the one `cancelled` check, which
 * has its own case below. Written as a const it would have no runtime use at
 * all, and inventing an assertion to give it one would be the very thing this
 * file is cleaning up.
 */
type ApiMeetingStatus = 'scheduled' | 'cancelled'

/**
 * `true` only when a union and the API's own list hold exactly the same
 * values.
 *
 * The `satisfies` above catches half of the drift — a union missing a value
 * the API can send. This catches the other half, a union member the API can
 * never send, which type-checks clean in both repos while inviting somebody to
 * write a branch that can never run. The failure lands in `tsc`, not in the
 * assertion below: the annotation resolves to `never`, so the `= true` stops
 * compiling.
 */
type SameValues<Union, Api> = [Union] extends [Api]
  ? [Api] extends [Union]
    ? true
    : never
  : never

const SYNC_STATUS_MATCHES_API: SameValues<SyncStatus, (typeof API_SYNC_STATUSES)[number]> = true

const MEETING_STATUS_MATCHES_API: SameValues<MeetingStatus, ApiMeetingStatus> =
  true

/** What the card shows for a meeting whose invite is on its way or already there. */
const NOTHING_TO_REPORT = null

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
    expect(toMeetingCard(wire({ mode: 'Phone' })).modeLabel).toBe('Phone call')
  })

  // US-MTG-03: the badge repeats the words the organizer picked in the panel,
  // so a new card never shows a mode that seems to have come from nowhere.
  it.each([
    ['Video', 'Video call'],
    ['In person', 'In person'],
    ['Phone', 'Phone call'],
  ] as const)('badges %s as "%s", the words the panel offered', (mode, label) => {
    expect(toMeetingCard(wire({ mode })).modeLabel).toBe(label)
    expect(meetingModeChoice(mode)).toContain(label)
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
    expect(toMeetingCard(wire({ syncStatus: 'not_connected' })).syncNote).toContain(
      'No calendar is connected',
    )
    expect(toMeetingCard(wire({ syncStatus: 'synced' })).syncNote).toBe(NOTHING_TO_REPORT)
  })

  // A status whose copy was never written looks correct on screen: the mapper
  // ends in `?? null`, the card renders nothing, and that is indistinguishable
  // from a meeting with genuinely nothing to report — which is why such a gap
  // can sit there for months.
  //
  // So this asserts the exact sentence rather than merely "not undefined".
  // Against `?? null`, a not-undefined check passes for a status with no row
  // at all and proves nothing: renaming `not_connected` back to the old
  // `not_applicable` would leave it green. Naming the copy here means the
  // table below has to match the one in the mapper, member for member.
  const EXPECTED_NOTE: Record<
    (typeof API_SYNC_STATUSES)[number],
    string | null
  > = {
    pending: 'The calendar invite has not been sent yet.',
    failed: "The calendar invite couldn't be sent.",
    synced: null,
    not_connected: 'No calendar is connected, so no invite was sent.',
  }

  it.each(API_SYNC_STATUSES)('says the right thing for %s', (syncStatus) => {
    expect(toMeetingCard(wire({ syncStatus })).syncNote).toBe(
      EXPECTED_NOTE[syncStatus],
    )
  })

  // The card promises `syncNote: string | null`. A value this build has never
  // heard of must keep that promise rather than smuggle an `undefined`
  // through it — and because every value the API can send is covered above,
  // nothing real reaches this.
  it('says nothing about a sync status it does not recognise', () => {
    // @ts-expect-error — deliberately off-contract. No value the API can send
    // is unknown to the mapper, so there is no typed way to reach the fallback.
    const card = toMeetingCard(wire({ syncStatus: 'rescheduled' }))

    expect(card.syncNote).toBe(NOTHING_TO_REPORT)
  })

  // Both unions are pinned to the API's lists by `SameValues`, and that pin is
  // enforced by `tsc -b` — which this repo's definition of done requires — NOT
  // by the assertion below. vitest transpiles without type-checking, so these
  // consts are `true` at runtime whatever the types say: restoring `completed`
  // to `MeetingStatus` leaves this suite green and fails the type-check alone.
  // The assertion is here only so deleting the pins breaks something visible.
  it('still declares the pins that tsc checks', () => {
    expect(SYNC_STATUS_MATCHES_API).toBe(true)
    expect(MEETING_STATUS_MATCHES_API).toBe(true)
  })

  // US-MTG-06: a cancelled meeting is marked Cancelled. The reason is
  // optional, so the mark cannot ride on it — without one the card would read
  // as a scheduled meeting that had lost its Edit button.
  it('marks a cancelled meeting as cancelled, with or without a reason', () => {
    const called = { status: 'cancelled', canJoin: false, canEdit: false } as const

    expect(toMeetingCard(wire({ ...called, cancellationReason: null })).cancelled).toBe(true)
    expect(toMeetingCard(wire({ ...called, cancellationReason: 'Venue closed' })).cancelled).toBe(
      true,
    )
    expect(toMeetingCard(wire()).cancelled).toBe(false)
  })

  it('carries an edit draft with the times a form can use', () => {
    const draft = toMeetingCard(wire()).edit

    expect(draft.startTime).toBe('10:00')
    expect(draft.endTime).toBe('10:30')
    expect(draft.version).toBe(1)
  })
})

/*
 * US-MTG-06: a cancelled meeting's invite is withdrawn, not sent. "The
 * calendar invite has not been sent yet" under a Cancelled badge asks the
 * organizer to send an invite for a meeting that is not happening — so a
 * cancelled card says nothing unless the withdrawal itself failed.
 */
describe('the sync note on a cancelled meeting', () => {
  const cancelled = (syncStatus: SyncStatus) =>
    toMeetingCard(
      wire({ status: 'cancelled', canJoin: false, canEdit: false, syncStatus }),
    )

  it("says the cancellation couldn't reach the guest's calendar when that failed", () => {
    expect(cancelled('failed').syncNote).toBe(
      "The cancellation couldn't be sent to the guest's calendar.",
    )
  })

  it.each(['pending', 'synced', 'not_connected'] as const)(
    'says nothing when the withdrawal is %s',
    (syncStatus) => {
      expect(cancelled(syncStatus).syncNote).toBe(NOTHING_TO_REPORT)
    },
  )

  it('carries the sync status, so the card can offer the right next step', () => {
    expect(cancelled('failed').syncStatus).toBe('failed')
    expect(toMeetingCard(wire({ syncStatus: 'pending' })).syncStatus).toBe('pending')
  })
})

/*
 * US-MTG-04 AC3/AC4 and US-MTG-08: a card whose invite has not gone out says
 * what would send it. "Send it now" only helps while a calendar is connected;
 * without one, the step is connecting it — which only an Admin can take, so
 * everyone else is told who to ask.
 */
describe('syncActionOf', () => {
  const card = (syncStatus: SyncStatus) => toMeetingCard(wire({ syncStatus }))
  const ADMIN = true
  const VIEWER = false
  const CALENDAR_STATUSES = [
    'not_configured',
    'disconnected',
    'connected',
    'expired',
  ] as const satisfies readonly CalendarConnectionStatus[]

  it.each(CALENDAR_STATUSES)('offers nothing for a synced meeting (calendar %s)', (calendar) => {
    expect(syncActionOf(card('synced'), calendar, ADMIN)).toBeNull()
    expect(syncActionOf(card('synced'), calendar, VIEWER)).toBeNull()
  })

  it.each(CALENDAR_STATUSES)(
    'offers to send a pending or failed invite again (calendar %s)',
    (calendar) => {
      for (const canManage of [ADMIN, VIEWER]) {
        expect(syncActionOf(card('pending'), calendar, canManage)).toBe('retry')
        expect(syncActionOf(card('failed'), calendar, canManage)).toBe('retry')
      }
    },
  )

  // Saved while disconnected, and the calendar has since been connected.
  it('offers to send it now once the calendar is connected', () => {
    expect(syncActionOf(card('not_connected'), 'connected', ADMIN)).toBe('retry')
    expect(syncActionOf(card('not_connected'), 'connected', VIEWER)).toBe('retry')
  })

  it.each(['disconnected', 'not_configured', 'expired'] as const)(
    'sends an Admin to connect the calendar while it is %s',
    (calendar) => {
      expect(syncActionOf(card('not_connected'), calendar, ADMIN)).toBe('connect')
    },
  )

  it.each(['disconnected', 'not_configured', 'expired'] as const)(
    'tells anyone else to ask an Admin while it is %s',
    (calendar) => {
      expect(syncActionOf(card('not_connected'), calendar, VIEWER)).toBe('ask_admin')
    },
  )

  it('offers to retry a cancellation that failed to reach the calendar', () => {
    const failed = toMeetingCard(wire({ status: 'cancelled', syncStatus: 'failed' }))

    expect(syncActionOf(failed, 'connected', VIEWER)).toBe('retry')
  })

  it('offers nothing on a cancelled card with no note', () => {
    const pending = toMeetingCard(wire({ status: 'cancelled', syncStatus: 'pending' }))

    expect(syncActionOf(pending, 'connected', ADMIN)).toBeNull()
  })

  // The card's link reads the same as the Meetings header's.
  it('labels the connect link "Reconnect" once Google stopped accepting the connection', () => {
    expect(connectLinkLabel('expired')).toBe('Reconnect Google Calendar')
    expect(connectLinkLabel('disconnected')).toBe('Connect Google Calendar')
    expect(connectLinkLabel('not_configured')).toBe('Connect Google Calendar')
  })

  it('names who can connect it, for everyone else', () => {
    expect(ASK_ADMIN_NOTE).toBe('Ask an Admin to connect Google Calendar.')
  })
})

/*
 * US-MTG-04 AC1: a new meeting's invite goes out within seconds, from the
 * worker. The list re-reads itself while an invite is on its way, so the card
 * turns synced — with its Meet link — without a reload.
 */
describe('pendingKeyOf and shouldPollSync', () => {
  const card = (id: string, syncStatus: SyncStatus, status: MeetingStatus = 'scheduled') =>
    toMeetingCard(wire({ id, syncStatus, status }))

  it('names the meetings whose invite is on its way, in a stable order', () => {
    const cards = [card('m-3', 'pending'), card('m-1', 'pending'), card('m-2', 'synced')]

    expect(pendingKeyOf(cards)).toBe('m-1,m-3')
    expect(shouldPollSync(cards)).toBe(true)
  })

  // The key is what resets the poll budget, so the same set of meetings in a
  // different order must not read as a new one.
  it('is the same key whatever order the page lists them in', () => {
    const a = [card('m-1', 'pending'), card('m-2', 'pending')]
    const b = [card('m-2', 'pending'), card('m-1', 'pending')]

    expect(pendingKeyOf(a)).toBe(pendingKeyOf(b))
  })

  it.each(['synced', 'failed', 'not_connected'] as const)(
    'does not wait on a meeting whose sync is settled (%s)',
    (syncStatus) => {
      expect(pendingKeyOf([card('m-1', syncStatus)])).toBe('')
      expect(shouldPollSync([card('m-1', syncStatus)])).toBe(false)
    },
  )

  // A cancelled card shows no "not sent yet" note, so there is nothing on
  // screen for a poll to change.
  it('does not wait on a cancelled meeting', () => {
    expect(pendingKeyOf([card('m-1', 'pending', 'cancelled')])).toBe('')
  })

  it('does not wait on an empty page', () => {
    expect(shouldPollSync([])).toBe(false)
  })
})
