import { describe, expect, it } from 'vitest'
import { homeFor, personaOfSearch, personaOfSession, signInPathFor } from './personas'

describe('two personas, never one login', () => {
  it('sends each persona to its own sign-in page', () => {
    expect(signInPathFor('admin')).toBe('/auth/login')
    expect(signInPathFor('attendee')).toBe('/portal/login')
  })

  it('lands each persona on its own home', () => {
    expect(homeFor('admin')).toBe('/admin/dashboard')
    expect(homeFor('attendee')).toBe('/portal/my-events')
  })
})

describe('which persona a URL is asking about', () => {
  it('defaults to the organizer when nothing is said', () => {
    expect(personaOfSearch(new URLSearchParams(''))).toBe('admin')
  })

  it('honours ?persona=attendee', () => {
    expect(personaOfSearch(new URLSearchParams('persona=attendee'))).toBe('attendee')
  })

  it('falls back rather than trusting a hand-typed persona', () => {
    expect(personaOfSearch(new URLSearchParams('persona=root'))).toBe('admin')
  })
})

describe('which persona owns a session', () => {
  it('reads it from what the SERVER said, not from the form', () => {
    // The form is the caller's claim; `user.persona` is the API's answer. Only
    // the latter may label a session, or a page could mislabel its own token.
    expect(personaOfSession({ persona: 'attendee' })).toBe('attendee')
    expect(personaOfSession({ persona: 'admin' })).toBe('admin')
  })

  it('labels nothing when no session was established', () => {
    // The two-factor branch answers without a user: the password was right but
    // no session exists yet, so there is nothing to label.
    expect(personaOfSession(undefined)).toBeNull()
  })

  it('refuses a persona it does not know', () => {
    expect(personaOfSession({ persona: 'superuser' })).toBeNull()
  })
})
