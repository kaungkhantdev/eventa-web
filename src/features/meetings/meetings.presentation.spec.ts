import { describe, expect, it } from 'vitest'
import { meetingSaveLabel } from './meetings.presentation'

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
