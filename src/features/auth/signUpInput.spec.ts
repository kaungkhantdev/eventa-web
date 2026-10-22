import { describe, expect, it } from 'vitest'
import { bookingClaimInputOf, signUpInputOf } from './signUpInput'

function form(fields: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.append(key, value)
  return data
}

const FILLED = {
  name: 'Jordan Lee',
  email: 'jordan@acme.co.th',
  organizationName: 'Acme Events',
}

describe('signUpInputOf', () => {
  it('carries the person and the workspace they named', () => {
    expect(signUpInputOf(form(FILLED), 'admin', 'sw0rdfish')).toMatchObject({
      name: 'Jordan Lee',
      email: 'jordan@acme.co.th',
      organizationName: 'Acme Events',
      password: 'sw0rdfish',
      persona: 'admin',
    })
  })

  /**
   * An attendee has no workspace — the API refuses one with a 422 rather than
   * ignoring it, so the field is dropped here, at the one place both sign-up
   * pages go through, instead of being trusted not to be filled in.
   */
  it('never sends a workspace for an attendee, even if one is in the form', () => {
    const input = signUpInputOf(form(FILLED), 'attendee', 'sw0rdfish')
    expect(input).not.toHaveProperty('organizationName')
    expect(input.persona).toBe('attendee')
  })

  // Absent, not empty: the API's fallback names the workspace after the person
  // ("Jordan Lee's Workspace"), and an empty string would defeat it while
  // still passing @IsString().
  it('omits the workspace entirely rather than sending a blank one', () => {
    expect(signUpInputOf(form({ ...FILLED, organizationName: '   ' }), 'admin', 'x')).not.toHaveProperty(
      'organizationName',
    )
  })

  it('trims the workspace name so a stray space is not slugified', () => {
    expect(
      signUpInputOf(form({ ...FILLED, organizationName: '  Acme Events  ' }), 'admin', 'x')
        .organizationName,
    ).toBe('Acme Events')
  })

  // Consent is passed through, never asserted on somebody's behalf: an
  // unticked box is absent from the form data entirely.
  it('reports the terms box as ticked only when it was', () => {
    expect(signUpInputOf(form(FILLED), 'admin', 'x').acceptTerms).toBe(false)
    expect(
      signUpInputOf(form({ ...FILLED, acceptTerms: 'on' }), 'admin', 'x').acceptTerms,
    ).toBe(true)
  })
})

/**
 * Choosing a password from the emailed claim link (US-DISC-15): "I am asked
 * only for a password — my name comes from the booking". The address is the
 * one the link was sent to, so whatever else the form holds stays behind.
 */
describe('bookingClaimInputOf', () => {
  const CLAIM = 'claim.header.payload'

  it('sends the token, the password and the terms, and nothing else', () => {
    expect(
      bookingClaimInputOf(
        form({
          name: 'Somebody Else',
          email: 'else@example.test',
          password: 'sw0rdfish!1',
          confirmPassword: 'sw0rdfish!1',
          acceptTerms: 'on',
        }),
        CLAIM,
      ),
    ).toEqual({ token: CLAIM, password: 'sw0rdfish!1', acceptTerms: true })
  })

  it('passes an unticked terms box through as false, for the API to refuse', () => {
    expect(bookingClaimInputOf(form({ password: 'sw0rdfish!1' }), CLAIM).acceptTerms).toBe(false)
  })
})
