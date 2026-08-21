import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError } from './ApiError'
import { messageOf } from './messageOf'

describe('what to show the person when a request fails', () => {
  it('prefers the API’s field errors over the generic summary', () => {
    // "Validation failed." tells them nothing. The field messages say what to fix.
    const error = new ApiError(400, {
      message: 'Validation failed.',
      errors: [{ field: 'password', message: 'Password must contain a number.' }],
    })
    expect(messageOf(error)).toBe('Password must contain a number.')
  })

  it('joins several field errors into one readable line', () => {
    const error = new ApiError(400, {
      message: 'Validation failed.',
      errors: [
        { field: 'email', message: 'Enter a valid email.' },
        { field: 'password', message: 'Password is too short.' },
      ],
    })
    expect(messageOf(error)).toBe('Enter a valid email. Password is too short.')
  })

  it('uses the API’s own sentence when there are no field errors', () => {
    // A 409 is written for the person reading it — show it verbatim.
    const error = new ApiError(409, {
      message: 'Money has been captured — cancel and refund it instead.',
    })
    expect(messageOf(error)).toMatch(/cancel and refund/)
  })

  it('explains a network failure in plain language', () => {
    expect(messageOf(new NetworkError(new Error('boom')))).toMatch(/couldn't reach/i)
  })

  it('never leaks a raw non-Error value', () => {
    expect(messageOf('kaboom')).toBe('Something went wrong. Please try again.')
    expect(messageOf(null)).toBe('Something went wrong. Please try again.')
  })

  it('falls back for an Error with no message', () => {
    expect(messageOf(new Error(''))).toBe('Something went wrong. Please try again.')
  })
})
