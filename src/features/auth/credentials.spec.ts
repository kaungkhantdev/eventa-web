import { describe, expect, it } from 'vitest'
import { credentialsOf } from './credentials'

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.append(key, value)
  return data
}

const filled = { email: 'anong@example.com', password: 'correct horse battery staple' }

describe('the body a sign-in sends (US-ACC-04)', () => {
  it('carries the email and password as typed', () => {
    const body = credentialsOf(form(filled), 'admin')
    expect(body.email).toBe('anong@example.com')
    expect(body.password).toBe('correct horse battery staple')
  })

  it('states which persona is signing in', () => {
    expect(credentialsOf(form(filled), 'attendee').persona).toBe('attendee')
  })

  describe('the workspace', () => {
    it('never names one for an attendee, even if the field was filled', () => {
      // The API refuses it: "Attendee sign-in doesn't take a workspace — leave
      // orgSlug out" (422). Attendees have one platform-wide realm, so a
      // workspace is not a value to ignore — it is a contradiction to drop.
      const body = credentialsOf(form({ ...filled, orgSlug: 'acme' }), 'attendee')
      expect(body).not.toHaveProperty('orgSlug')
    })

    it('carries the organizer’s workspace, trimmed', () => {
      const body = credentialsOf(form({ ...filled, orgSlug: '  acme  ' }), 'admin')
      expect(body.orgSlug).toBe('acme')
    })

    it('omits a blank workspace rather than sending an empty string', () => {
      // '' fails the API's @Matches(/^[a-z0-9-]+$/) and would 400 the sign-in
      // before it could report the real problem.
      expect(credentialsOf(form({ ...filled, orgSlug: '   ' }), 'admin')).not.toHaveProperty(
        'orgSlug',
      )
    })
  })

  it('says Remember me is off, rather than leaving it unsaid', () => {
    // An unchecked box is absent from the form data entirely; the API defaults
    // this itself, so the answer is always stated rather than inferred.
    expect(credentialsOf(form(filled), 'admin').rememberMe).toBe(false)
  })

  it('says Remember me is on when it was ticked', () => {
    expect(credentialsOf(form({ ...filled, rememberMe: 'on' }), 'admin').rememberMe).toBe(true)
  })
})
