import { describe, expect, it } from 'vitest'
import { ASK_FOR_A_NEW_LINK, registerScreenOf } from './portalRegister.mapper'

/**
 * Which screen `/portal/register` shows (US-DISC-15, and US-DISC-08 for the
 * ordinary sign-up it still is when opened directly).
 */

const ANAN = { name: 'Anan Suksawat', email: 'anan@example.test', accountExists: false }
const LINK_REFUSED =
  'This link has expired or is no longer valid. Ask for a new one from your booking confirmation.'

describe('registerScreenOf', () => {
  // Criterion 7: no link, the ordinary sign-up — email empty and editable.
  it('is the ordinary sign-up when opened directly', () => {
    expect(registerScreenOf({ mode: 'direct' })).toEqual({ kind: 'direct' })
  })

  // Criteria 3 and 4: the name and email are the booking's and are shown,
  // fixed; the person is asked only for a password.
  it('shows the booking’s name and email, fixed, for a usable link', () => {
    expect(registerScreenOf({ mode: 'claim', claim: ANAN })).toEqual({
      kind: 'claim',
      name: 'Anan Suksawat',
      email: 'anan@example.test',
      error: null,
    })
  })

  it('shows the last refusal beside the form, in the API’s words', () => {
    const rule = 'Password must be at least 8 characters and include a number and a symbol.'

    expect(
      registerScreenOf({ mode: 'claim', claim: ANAN }, { ok: false, error: rule, recheck: true }),
    ).toMatchObject({ kind: 'claim', error: rule })
  })

  // Criterion 5, and what makes the link single-use: once the address has an
  // account, the link only offers to sign in.
  it('offers only sign-in once the address has an account', () => {
    expect(registerScreenOf({ mode: 'claim', claim: { ...ANAN, accountExists: true } })).toEqual({
      kind: 'exists',
      message:
        'An account already uses anan@example.test. Sign in to see every booking in one place.',
      signInTo: '/portal/login',
    })
  })

  it('refuses a bad link in the API’s words, and says where a new one comes from', () => {
    expect(registerScreenOf({ mode: 'claim-invalid', error: LINK_REFUSED })).toEqual({
      kind: 'invalid',
      error: LINK_REFUSED,
      advice: ASK_FOR_A_NEW_LINK,
      signInTo: '/portal/login',
    })
    expect(ASK_FOR_A_NEW_LINK).toMatch(/^Ask for a new link from your booking confirmation/)
  })
})
