import { describe, expect, it } from 'vitest'
import { copyLabel, eventDetailPath } from './events.presentation'

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
