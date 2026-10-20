import { describe, expect, it } from 'vitest'
import { meetingInputOf } from './meetings.routes'

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.append(key, value)
  return data
}

describe('meetingInputOf', () => {
  it('sends the mode the organizer chose', () => {
    expect(meetingInputOf(form({ mode: 'Phone' })).mode).toBe('Phone')
    expect(meetingInputOf(form({ mode: 'In person' })).mode).toBe('In person')
  })

  // US-MTG-03: the organizer must choose. A mode that never arrived used to
  // become Video here, which scheduled a video call nobody asked for; sent as
  // it came, the API refuses it and says why.
  it('never turns a missing choice into a video call', () => {
    expect(meetingInputOf(form({ mode: '' })).mode).toBe('')
    expect(meetingInputOf(form({})).mode).toBe('')
  })
})
