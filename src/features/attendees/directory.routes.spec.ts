import { describe, expect, it } from 'vitest'
import { activityQueryOf, profileIdOf } from './directory.routes'

const url = (query: string) => new URLSearchParams(query)

describe('whose profile the URL has open', () => {
  it('is nobody when the parameter is absent', () => {
    expect(profileIdOf(url('segment=vip'))).toBeNull()
  })

  it('reads the attendee the row opened', () => {
    expect(profileIdOf(url('profile=42'))).toBe(42)
  })

  /**
   * `subjectId` is validated `@IsInt() @Min(1)` behind a `forbidNonWhitelisted`
   * pipe, so a hand-typed parameter the API would refuse must never become a
   * request: a 400 under the panel would be reported as a failed timeline when
   * nothing is wrong with the attendee's history.
   */
  it.each(['profile=0', 'profile=-3', 'profile=1.5', 'profile=abc', 'profile='])(
    'refuses %s here rather than letting the API 400 it',
    (query) => {
      expect(profileIdOf(url(query))).toBeNull()
    },
  )
})

describe('one attendee’s history, as a request to GET /audit', () => {
  // The DTO refuses half a subject ("Send subjectType and subjectId together"),
  // so the pair is built in one place and cannot be sent apart.
  it('sends both halves of the subject, and caps what the panel shows', () => {
    expect(activityQueryOf(42)).toEqual({
      subjectType: 'attendee',
      subjectId: 42,
      limit: 20,
    })
  })
})
