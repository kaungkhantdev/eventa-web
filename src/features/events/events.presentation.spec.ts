import { describe, expect, it } from 'vitest'
import { cancelReasonGiven, copyLabel, eventDetailPath, offersCancel } from './events.presentation'

/**
 * A copy button that cannot fail out loud is worse than one that cannot copy:
 * the organizer pastes an empty clipboard into an email and never learns why.
 */
describe('copyLabel', () => {
  it('offers to copy before anything has happened', () => {
    expect(copyLabel('idle')).toBe('Copy')
  })

  it('confirms only a copy the clipboard actually took', () => {
    expect(copyLabel('copied')).toBe('Copied')
  })

  it('says what to do instead when the clipboard refused', () => {
    expect(copyLabel('failed')).toBe('Select and copy')
    expect(copyLabel('failed')).not.toBe('Copied')
  })
})

describe('eventDetailPath', () => {
  it('points at the event workspace', () => {
    expect(eventDetailPath('evt-1')).toBe('/admin/event-detail?id=evt-1')
  })

  it('escapes the id, so it cannot add a second query parameter', () => {
    expect(eventDetailPath('a&b=c')).toBe('/admin/event-detail?id=a%26b%3Dc')
  })
})

/**
 * US-EVT-08: deleting an event that holds registrations, payments or a public
 * page is refused and the organizer is offered Cancel instead — which refunds
 * and tells the attendees, where a delete would destroy their records.
 */
describe('offersCancel', () => {
  it('offers Cancel when the API refuses a delete and says to cancel instead', () => {
    expect(
      offersCancel(
        "This event has registrations and can't be deleted. Cancel it instead to refund and notify attendees.",
      ),
    ).toBe(true)
    expect(
      offersCancel(
        'A published event cannot be deleted. Cancel it instead to refund and notify attendees.',
      ),
    ).toBe(true)
  })

  // A stale view is not a reason to cancel somebody's event.
  it('does not offer it for any other refusal', () => {
    expect(offersCancel('This event changed elsewhere. Reload and try again.')).toBe(false)
    expect(offersCancel(null)).toBe(false)
  })
})

describe('cancelReasonGiven', () => {
  // "I must enter a reason and confirm" — the attendees are told it.
  it('needs a reason with something in it', () => {
    expect(cancelReasonGiven('Venue became unavailable')).toBe(true)
    expect(cancelReasonGiven('')).toBe(false)
    expect(cancelReasonGiven('   ')).toBe(false)
  })
})
