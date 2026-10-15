import { describe, expect, it } from 'vitest'
import { SESSION_REMOVAL_WARNING, speakerRemovalWarning } from './program.presentation'

describe('speakerRemovalWarning', () => {
  // US-PROG-11: the confirmation warns that the speaker comes off all their
  // sessions and that it cannot be undone. "This removes X from the event"
  // said neither.
  it('warns that they come off every session, for good', () => {
    const warning = speakerRemovalWarning('Anong Prasert')

    expect(warning).toContain('Anong Prasert')
    expect(warning).toMatch(/all of their sessions/)
    expect(warning).toMatch(/can’t be undone/)
  })
})

describe('SESSION_REMOVAL_WARNING', () => {
  // US-PROG-04: the confirmation warns that removing it won't notify the
  // attendees who bookmarked it.
  it('says the attendees who bookmarked it are not told, and that it is final', () => {
    expect(SESSION_REMOVAL_WARNING).toMatch(/won’t notify attendees who bookmarked it/)
    expect(SESSION_REMOVAL_WARNING).toMatch(/can’t be undone/)
  })
})
