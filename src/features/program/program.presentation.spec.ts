import { describe, expect, it } from 'vitest'
import { speakerRemovalWarning } from './program.presentation'

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
