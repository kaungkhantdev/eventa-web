import { describe, expect, it } from 'vitest'
import { removalConfirmed, speakerInputOf } from './program.routes'

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.append(key, value)
  return data
}

describe('speakerInputOf', () => {
  // Without it the API has nothing to compare and the last save wins, so a
  // colleague's change made after the panel opened is lost (US-PROG-10).
  it('sends the version the panel was opened on', () => {
    expect(speakerInputOf(form({ name: 'Anong Prasert', version: '4' })).version).toBe(4)
  })

  it('sends no version for a new speaker', () => {
    expect(speakerInputOf(form({ name: 'Anong Prasert' })).version).toBeUndefined()
  })
})

describe('removalConfirmed', () => {
  // Only the confirmation dialog posts this. Anything else asking to remove is
  // passed on unconfirmed, and the API refuses it.
  it('is true only when the form says the organizer confirmed', () => {
    expect(removalConfirmed(form({ confirm: 'true' }))).toBe(true)
    expect(removalConfirmed(form({}))).toBe(false)
    expect(removalConfirmed(form({ confirm: 'yes' }))).toBe(false)
  })
})
