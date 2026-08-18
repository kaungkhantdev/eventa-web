import { describe, expect, it } from 'vitest'
import { signInLinkFor } from './verifiedSignIn'

describe('signInLinkFor', () => {
  it('sends a confirmed organizer to their workspace sign-in, workspace filled in', () => {
    expect(signInLinkFor({ verified: true, persona: 'admin', orgSlug: 'acme-events' })).toBe(
      '/auth/login?org=acme-events',
    )
  })

  /**
   * The attendee's slug is the platform organization's. Sending it would fill a
   * field that `/auth/login` owns and attendee sign-in refuses outright — the
   * API answers 422 for an attendee login that names a workspace.
   */
  it('sends a confirmed attendee to the portal, carrying no workspace at all', () => {
    expect(signInLinkFor({ verified: true, persona: 'attendee', orgSlug: 'eventa' })).toBe(
      '/portal/login',
    )
  })

  it('encodes a slug rather than pasting it into the query', () => {
    expect(signInLinkFor({ verified: true, persona: 'admin', orgSlug: 'a b&c' })).toBe(
      '/auth/login?org=a%20b%26c',
    )
  })
})
