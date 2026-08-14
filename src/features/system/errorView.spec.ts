import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError } from '@/lib/api'
import { errorViewOf } from './errorView'

const apiError = (status: number, message?: string) =>
  new ApiError(status, message ? { message } : {})

describe('what to tell someone when a page fails to load', () => {
  describe('a refusal is not a crash', () => {
    it('says a 403 is about permission, not breakage', () => {
      const view = errorViewOf(apiError(403, 'Organizer console access requires an admin account.'))
      expect(view.kind).toBe('forbidden')
      expect(view.title).toBe('You don’t have access to this')
    })

    it('shows the API’s own reason for the refusal, verbatim', () => {
      // The server knows WHY — "requires an admin account" is more use than
      // "forbidden", and it was written for the person reading it.
      const view = errorViewOf(apiError(403, 'Organizer console access requires an admin account.'))
      expect(view.detail).toBe('Organizer console access requires an admin account.')
    })

    it('does not offer a retry, because trying again cannot help', () => {
      expect(errorViewOf(apiError(403)).canRetry).toBe(false)
    })
  })

  describe('something that is not there', () => {
    it('says a 404 is missing rather than broken', () => {
      const view = errorViewOf(apiError(404, "That isn't available."))
      expect(view.kind).toBe('missing')
      expect(view.title).toBe('Not found')
      expect(view.canRetry).toBe(false)
    })
  })

  describe('the network never reached the API', () => {
    it('says so, and offers to try again', () => {
      const view = errorViewOf(new NetworkError(new TypeError('fetch failed')))
      expect(view.kind).toBe('offline')
      expect(view.canRetry).toBe(true)
    })

    it('tells them what they can do about it', () => {
      // Our own sentence, not the API's — there was no API. "Check your
      // connection" is the only actionable thing on that screen.
      expect(errorViewOf(new NetworkError(null)).detail).toMatch(/check your connection/i)
    })

    it('does not surface the underlying fetch failure', () => {
      // `TypeError: Failed to fetch` is a browser internal; it names nothing
      // the reader can act on.
      const view = errorViewOf(new NetworkError(new TypeError('Failed to fetch')))
      expect(view.detail).not.toContain('Failed to fetch')
    })

    it('does not blame the person’s account for a connection problem', () => {
      expect(errorViewOf(new NetworkError(null)).kind).not.toBe('forbidden')
    })
  })

  describe('the server broke', () => {
    it('offers a retry on a 500, because it might have been transient', () => {
      const view = errorViewOf(apiError(500))
      expect(view.kind).toBe('failed')
      expect(view.canRetry).toBe(true)
    })

    it('shows the API’s sentence when it wrote one', () => {
      expect(errorViewOf(apiError(409, 'Cancel it instead to refund attendees.')).detail).toBe(
        'Cancel it instead to refund attendees.',
      )
    })

    it('prefers the field messages to a rejected DTO’s useless summary', () => {
      // The API's top-level message for a rejected DTO is "Validation failed.",
      // which tells nobody anything; the field messages say what to change.
      const rejected = new ApiError(422, {
        message: 'Validation failed.',
        errors: [{ field: 'startAt', message: 'Start date must be in the future.' }],
      })
      expect(errorViewOf(rejected).detail).toBe('Start date must be in the future.')
    })
  })

  describe('a bug in our own code', () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'items')")

    it('never puts the JavaScript error in front of the person', () => {
      // A TypeError's message names internals — a variable, a property, a
      // module path. It tells the reader nothing and describes our source.
      const view = errorViewOf(bug)
      expect(view.detail).toBeNull()
      expect(JSON.stringify(view)).not.toContain('Cannot read properties')
    })

    it('never carries a stack trace', () => {
      const serialised = JSON.stringify(errorViewOf(bug))
      expect(serialised).not.toContain('stack')
      expect(serialised).not.toContain('.ts:')
    })

    it('still says something honest, and offers a retry', () => {
      const view = errorViewOf(bug)
      expect(view.kind).toBe('failed')
      expect(view.title).toBe('Something went wrong')
      expect(view.canRetry).toBe(true)
    })
  })

  describe('anything at all', () => {
    it.each([
      ['a string', 'boom'],
      ['null', null],
      ['undefined', undefined],
      ['an object', { message: 'nope' }],
    ])('survives %s being thrown', (_label, thrown) => {
      const view = errorViewOf(thrown)
      expect(view.title).toBe('Something went wrong')
      expect(view.detail).toBeNull()
    })
  })

})
