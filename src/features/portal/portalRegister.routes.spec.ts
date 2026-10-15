import { redirect } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { BookingClaim } from '@/features/auth/api'
import { PASSWORDS_DIFFER, type BookingClaimInput } from '@/features/auth/signUpInput'
import type { LoginResult } from '@/features/auth/types'
import { ApiError, NetworkError } from '@/lib/api'
import {
  INCOMPLETE_CLAIM_LINK,
  loadPortalRegister,
  shouldRecheckClaim,
  submitBookingClaim,
} from './portalRegister.routes'

/**
 * The attendee sign-up, opened directly or from the link emailed to a
 * booking's address (US-DISC-15).
 *
 * The link is the proof that the booking's inbox belongs to whoever is
 * holding it, so it is checked when it is opened — without spending it — and
 * only a password is asked for. Opened without one, the page is the ordinary
 * sign-up, confirmed by email before it can be used (criterion 7).
 */

const CLAIM = 'claim.header.payload'
const LINK_REFUSED =
  'This link has expired or is no longer valid. Ask for a new one from your booking confirmation.'
const ACCOUNT_EXISTS = 'An account already uses this email. Sign in instead.'
const ANAN: BookingClaim = {
  name: 'Anan Suksawat',
  email: 'anan@example.test',
  accountExists: false,
}

const opened = (search: string) => new Request(`http://localhost/portal/register${search}`)

function submitted(fields: Record<string, string>, search = `?claim=${CLAIM}`) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return new Request(`http://localhost/portal/register${search}`, { method: 'POST', body: form })
}

const inspecting = (answer: BookingClaim) =>
  vi.fn<(token: string) => Promise<BookingClaim>>(async () => answer)

const refusing = (cause: Error) =>
  vi.fn<(token: string) => Promise<BookingClaim>>(async () => {
    throw cause
  })

const letThrough = () => vi.fn(async () => null)

describe('loadPortalRegister', () => {
  // Criterion 7, unchanged: no link, the ordinary sign-up — and a signed-in
  // attendee is still sent home rather than offered a second account.
  it('opens the ordinary sign-up when there is no claim link, behind the guest guard', async () => {
    const inspect = inspecting(ANAN)
    const guard = letThrough()

    expect(await loadPortalRegister(opened(''), inspect, guard)).toEqual({ mode: 'direct' })
    expect(guard).toHaveBeenCalled()
    expect(inspect).not.toHaveBeenCalled()
  })

  it('lets the guest guard send a signed-in attendee home', async () => {
    const home = redirect('/portal/my-events')
    const guard = vi.fn(async () => {
      throw home
    })

    await expect(loadPortalRegister(opened(''), inspecting(ANAN), guard)).rejects.toBe(home)
  })

  // The emailed link must work on whatever device it is opened on, the same
  // as a reset link — so the guest guard does not stand in front of it.
  it('checks the claim link without spending it, and shows whose it is', async () => {
    const inspect = inspecting(ANAN)
    const guard = letThrough()

    expect(await loadPortalRegister(opened(`?claim=${CLAIM}`), inspect, guard)).toEqual({
      mode: 'claim',
      claim: ANAN,
    })
    expect(inspect).toHaveBeenCalledWith(CLAIM)
    expect(guard).not.toHaveBeenCalled()
  })

  it('calls a link with an empty claim incomplete, without asking the API', async () => {
    const inspect = inspecting(ANAN)

    for (const search of ['?claim=', '?claim=%20']) {
      expect(await loadPortalRegister(opened(search), inspect, letThrough())).toEqual({
        mode: 'claim-invalid',
        error: INCOMPLETE_CLAIM_LINK,
      })
    }
    expect(inspect).not.toHaveBeenCalled()
  })

  // Expired, used, forged, or another kind of token altogether: the API's one
  // sentence, written for the person holding the link.
  it('refuses a link the API will not vouch for, in the API’s own words', async () => {
    expect(
      await loadPortalRegister(
        opened(`?claim=${CLAIM}`),
        refusing(new ApiError(400, { message: LINK_REFUSED })),
        letThrough(),
      ),
    ).toEqual({ mode: 'claim-invalid', error: LINK_REFUSED })
  })

  // An outage says nothing about the link; the error screen offers a retry.
  it('lets a failure that is not about the link reach the error screen', async () => {
    await expect(
      loadPortalRegister(opened(`?claim=${CLAIM}`), refusing(new ApiError(500, {})), letThrough()),
    ).rejects.toBeInstanceOf(ApiError)
    await expect(
      loadPortalRegister(opened(`?claim=${CLAIM}`), refusing(new NetworkError(null)), letThrough()),
    ).rejects.toBeInstanceOf(NetworkError)
  })
})

describe('submitBookingClaim', () => {
  const SIGNED_IN: LoginResult = {
    twoFactorRequired: false,
    accessToken: 'access',
    refreshToken: 'refresh',
    user: {} as never,
  }
  const claiming = () =>
    vi.fn<(input: BookingClaimInput) => Promise<LoginResult>>(async () => SIGNED_IN)
  const refusedBy = (cause: Error) =>
    vi.fn<(input: BookingClaimInput) => Promise<LoginResult>>(async () => {
      throw cause
    })
  const FILLED = { password: 'sw0rdfish!1', confirmPassword: 'sw0rdfish!1', acceptTerms: 'on' }

  // "I am asked only for a password — my name comes from the booking — and I
  // am signed in immediately and land on My Events."
  it('claims with the link’s token and lands on My Events, guest saves handed over first', async () => {
    const claim = claiming()
    const steps: string[] = []
    claim.mockImplementation(async () => {
      steps.push('claim')
      return SIGNED_IN
    })
    const afterSignIn = vi.fn(async () => void steps.push('saves'))

    const result = await submitBookingClaim(submitted(FILLED), claim, afterSignIn)

    expect(claim).toHaveBeenCalledWith({ token: CLAIM, password: 'sw0rdfish!1', acceptTerms: true })
    expect(steps).toEqual(['claim', 'saves'])
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).headers.get('Location')).toBe('/portal/my-events')
  })

  // As sign-in and sign-up do: Back returns to wherever they came from, not to
  // a claim form for an account that now exists.
  it('replaces the claim page in history rather than stacking My Events on it', async () => {
    const result = await submitBookingClaim(submitted(FILLED), claiming(), vi.fn(async () => undefined))

    expect((result as Response).headers.get('X-Remix-Replace')).toBe('true')
  })

  // The address is the one the link was sent to; a name or email in the form
  // is never sent, and the API's whitelist would refuse it if it were.
  it('never sends a name or an email, whatever the form holds', async () => {
    const claim = claiming()

    await submitBookingClaim(
      submitted({ ...FILLED, name: 'Somebody Else', email: 'else@example.test' }),
      claim,
      vi.fn(async () => undefined),
    )

    expect(claim.mock.calls[0][0]).toEqual({
      token: CLAIM,
      password: 'sw0rdfish!1',
      acceptTerms: true,
    })
  })

  // A typo guard, not a security rule: the API is never sent the secret twice.
  // The words are the ordinary sign-up's own, from the one place both read.
  it('stops at a confirmation that does not match, without calling the API', async () => {
    const claim = claiming()

    expect(
      await submitBookingClaim(
        submitted({ ...FILLED, confirmPassword: 'sw0rdfihs!1' }),
        claim,
        vi.fn(async () => undefined),
      ),
    ).toEqual({ ok: false, error: PASSWORDS_DIFFER, recheck: false })
    expect(claim).not.toHaveBeenCalled()
  })

  it('does not call the API without a token', async () => {
    const claim = claiming()

    expect(
      await submitBookingClaim(submitted(FILLED, ''), claim, vi.fn(async () => undefined)),
    ).toEqual({ ok: false, error: INCOMPLETE_CLAIM_LINK, recheck: false })
    expect(claim).not.toHaveBeenCalled()
  })

  // Already claimed — in another tab, or a second press. The page checks the
  // link again, which is what turns the form into "Sign in instead".
  it('returns an existing account’s refusal verbatim, and asks for the link to be re-checked', async () => {
    const afterSignIn = vi.fn(async () => undefined)

    expect(
      await submitBookingClaim(
        submitted(FILLED),
        refusedBy(new ApiError(409, { message: ACCOUNT_EXISTS })),
        afterSignIn,
      ),
    ).toEqual({ ok: false, error: ACCOUNT_EXISTS, recheck: true })
    expect(afterSignIn).not.toHaveBeenCalled()
  })

  // The password rule, the terms, or a link that expired while the form was
  // open: any of those could be the link, so it is checked again.
  it('returns a validation refusal verbatim, and asks for the link to be re-checked', async () => {
    const rule = 'Password must be at least 8 characters and include a number and a symbol.'

    expect(
      await submitBookingClaim(
        submitted(FILLED),
        refusedBy(new ApiError(400, { message: 'Validation failed.', errors: [{ field: 'password', message: rule }] })),
        vi.fn(async () => undefined),
      ),
    ).toEqual({ ok: false, error: rule, recheck: true })
  })

  // An outage says nothing about the link, and re-checking during it would
  // fail too — replacing the form, and what was typed, with the error screen.
  it('reports an unreachable server beside the form, without a re-check', async () => {
    expect(
      await submitBookingClaim(
        submitted(FILLED),
        refusedBy(new NetworkError(null)),
        vi.fn(async () => undefined),
      ),
    ).toEqual({ ok: false, error: new NetworkError(null).message, recheck: false })
  })

  it('lets a programming error through', async () => {
    await expect(
      submitBookingClaim(submitted(FILLED), refusedBy(new TypeError('boom')), vi.fn(async () => undefined)),
    ).rejects.toBeInstanceOf(TypeError)
  })
})

describe('shouldRecheckClaim', () => {
  it('re-checks the link after a refusal that could be about it', () => {
    expect(
      shouldRecheckClaim({
        actionResult: { ok: false, error: ACCOUNT_EXISTS, recheck: true },
        defaultShouldRevalidate: true,
      }),
    ).toBe(true)
  })

  it('does not re-check after a refusal that says nothing about the link', () => {
    expect(
      shouldRecheckClaim({
        actionResult: { ok: false, error: PASSWORDS_DIFFER, recheck: false },
        defaultShouldRevalidate: true,
      }),
    ).toBe(false)
  })

  it('leaves anything that is not a claim to the router', () => {
    expect(shouldRecheckClaim({ actionResult: undefined, defaultShouldRevalidate: true })).toBe(true)
    expect(shouldRecheckClaim({ actionResult: undefined, defaultShouldRevalidate: false })).toBe(false)
  })
})
