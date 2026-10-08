import { describe, expect, it } from 'vitest'
import { announcementIntentOf, rescheduleInputOf, sendInputOf } from './announcements.routes'

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.append(key, value)
  return data
}

describe('announcementIntentOf', () => {
  it('sends unless asked for something else', () => {
    expect(announcementIntentOf(form({}))).toBe('send')
  })

  it('reads a cancel and a reschedule', () => {
    expect(announcementIntentOf(form({ intent: 'cancel' }))).toBe('cancel')
    expect(announcementIntentOf(form({ intent: 'reschedule' }))).toBe('reschedule')
  })

  it('never turns an intent it has not heard of into something destructive', () => {
    expect(announcementIntentOf(form({ intent: 'delete' }))).toBe('send')
  })
})

describe('sendInputOf', () => {
  const base = { eventId: 'e-1', subject: ' Doors at 6 ', message: ' Hall B ' }

  it('trims what the organizer typed', () => {
    expect(sendInputOf(form(base))).toEqual({
      eventId: 'e-1',
      input: { subject: 'Doors at 6', message: 'Hall B' },
    })
  })

  it('sends now when "Send now" is chosen, whatever the date field holds', () => {
    const { input } = sendInputOf(form({ ...base, mode: 'now', sendAt: '2026-08-05T10:00' }))
    expect(input.sendAt).toBeUndefined()
  })

  // The field is picked on the Bangkok clock and the API stores UTC.
  it('schedules it for the Bangkok time picked, as a UTC instant', () => {
    const { input } = sendInputOf(form({ ...base, mode: 'schedule', sendAt: '2026-08-05T10:00' }))
    expect(input.sendAt).toBe('2026-08-05T03:00:00.000Z')
  })

  // An empty field is not "now": leaving it out lets the API say what is
  // missing instead of sending immediately.
  it('sends an empty scheduled time as an empty one, not as now', () => {
    const { input } = sendInputOf(form({ ...base, mode: 'schedule', sendAt: '' }))
    expect(input.sendAt).toBe('')
  })
})

describe('rescheduleInputOf', () => {
  it('reads the announcement and its new Bangkok time as UTC', () => {
    expect(rescheduleInputOf(form({ id: '7', sendAt: '2026-08-06T15:00' }))).toEqual({
      id: '7',
      sendAt: '2026-08-06T08:00:00.000Z',
    })
  })
})
