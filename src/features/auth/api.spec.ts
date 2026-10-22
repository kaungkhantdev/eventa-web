import { afterEach, describe, expect, it, vi } from 'vitest'
import { session } from '@/lib/api'
import { authApi } from './api'

/**
 * The two calls behind the emailed reset link (US-ACC-04), pinned at the wire.
 *
 * These are the only auth calls worth asserting at this level: the body shape
 * is eventa-api's `ResetPasswordDto`, and getting a field name wrong is not a
 * type error here — `resetPassword` once sent `password`, which the API's
 * whitelist refuses, so no reset could ever have succeeded.
 */

const TOKEN = 'header.payload.signature'

/** Answer every request with a success envelope carrying `data`. */
function answering(data: unknown) {
  const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async () =>
      new Response(JSON.stringify({ success: true, statusCode: 200, message: '', data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  vi.stubGlobal('fetch', fetch)
  return fetch
}

/** What the one request carried: where it went, and its JSON body. */
function sentBy(fetch: ReturnType<typeof answering>) {
  expect(fetch).toHaveBeenCalledTimes(1)
  const [url, init] = fetch.mock.calls[0]
  return { url, method: init?.method, body: JSON.parse(String(init?.body)) as unknown }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('authApi.resetPassword', () => {
  it('sends the new password under the name the API requires', async () => {
    const fetch = answering({ message: 'Your password has been reset. Please sign in.' })

    await authApi.resetPassword(TOKEN, 'n3wPassword')

    const sent = sentBy(fetch)
    expect(sent.url).toMatch(/\/auth\/reset-password$/)
    expect(sent.method).toBe('POST')
    expect(sent.body).toEqual({ token: TOKEN, newPassword: 'n3wPassword' })
  })

  // The API words the confirmation for the person reading it; the page shows
  // it as it is rather than writing its own.
  it('hands back the API’s own confirmation', async () => {
    answering({ message: 'Your password has been reset. Please sign in.' })

    await expect(authApi.resetPassword(TOKEN, 'n3wPassword')).resolves.toEqual({
      message: 'Your password has been reset. Please sign in.',
    })
  })
})

describe('authApi.checkResetLink', () => {
  // A body, never a query string: a reset token in a URL is a token in the
  // API's access log.
  it('asks about the link in the request body, never the URL', async () => {
    const fetch = answering({ persona: 'admin', workspaceName: 'Acme Events' })

    await authApi.checkResetLink(TOKEN)

    const sent = sentBy(fetch)
    expect(sent.url).toMatch(/\/auth\/reset-password\/check$/)
    expect(sent.url).not.toContain(TOKEN)
    expect(sent.method).toBe('POST')
    expect(sent.body).toEqual({ token: TOKEN })
  })

  it('returns whose link it is, as the API answered', async () => {
    answering({ persona: 'attendee', workspaceName: null })

    await expect(authApi.checkResetLink(TOKEN)).resolves.toEqual({
      persona: 'attendee',
      workspaceName: null,
    })
  })
})

/**
 * Sign out is best-effort at the wire and certain in this browser (US-ACC-10).
 *
 * Both callers navigate to sign-in after `logout` resolves, so a rejection here
 * left the person on the page they asked to leave — signed out locally, but
 * still looking at it. A network failure and a refused refresh token are the
 * everyday causes.
 */
describe('authApi.logout', () => {
  function signedIn() {
    const entries = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => void entries.set(key, value),
        removeItem: (key: string) => void entries.delete(key),
      },
    })
    session.start({ accessToken: 'access', refreshToken: 'refresh', persona: 'attendee' })
  }

  it('resolves and ends the session when the request cannot be sent', async () => {
    signedIn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    await expect(authApi.logout()).resolves.toBeUndefined()
    expect(session.isSignedIn()).toBe(false)
  })

  it('resolves and ends the session when the API refuses it', async () => {
    signedIn()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ success: false, statusCode: 500, message: 'Something went wrong' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    )

    await expect(authApi.logout()).resolves.toBeUndefined()
    expect(session.isSignedIn()).toBe(false)
  })
})

/**
 * Keeping a booking's tickets in an account (US-DISC-15), pinned at the wire.
 *
 * The order's id opens nothing but the question "does this address have an
 * account?" and the request for a link — the link goes to the booking's inbox,
 * and only the token inside it can create the account. That token travels in
 * request bodies, never a URL: a URL is what the API's access log records.
 */
describe('booking account claim', () => {
  const ORDER_ID = '0b9c6a52-3f43-4f7e-9d1e-5a0c1f2b7e11'
  const CLAIM = 'claim.header.payload'
  const ATTENDEE = {
    id: 'att-1',
    name: 'Anan Suksawat',
    email: 'anan@example.test',
    persona: 'attendee',
  }

  function signedOut() {
    const entries = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => void entries.set(key, value),
        removeItem: (key: string) => void entries.delete(key),
      },
    })
  }

  describe('authApi.bookingAccount', () => {
    it('asks whether the booking’s address already has an account, by the order’s id', async () => {
      const fetch = answering({ accountExists: true })

      await expect(authApi.bookingAccount(ORDER_ID)).resolves.toEqual({ accountExists: true })

      const [url, init] = fetch.mock.calls[0]
      expect(url).toMatch(new RegExp(`/auth/register/from-booking/${ORDER_ID}$`))
      expect(init?.method).toBe('GET')
    })
  })

  describe('authApi.requestBookingClaimLink', () => {
    // Nothing but the order: the API reads the address off it, so the page
    // cannot point the link at an inbox of its choosing.
    it('asks for the link by the order’s id, sending no body at all', async () => {
      const fetch = answering({ sentTo: 'anan@example.test' })

      await expect(authApi.requestBookingClaimLink(ORDER_ID)).resolves.toEqual({
        sentTo: 'anan@example.test',
      })

      const [url, init] = fetch.mock.calls[0]
      expect(url).toMatch(new RegExp(`/auth/register/from-booking/${ORDER_ID}/link$`))
      expect(init?.method).toBe('POST')
      expect(init?.body).toBeUndefined()
    })
  })

  describe('authApi.inspectBookingClaim', () => {
    it('asks about the link in the request body, never the URL', async () => {
      const fetch = answering({ name: 'Anan Suksawat', email: 'anan@example.test', accountExists: false })

      await expect(authApi.inspectBookingClaim(CLAIM)).resolves.toEqual({
        name: 'Anan Suksawat',
        email: 'anan@example.test',
        accountExists: false,
      })

      const sent = sentBy(fetch)
      expect(sent.url).toMatch(/\/auth\/register\/from-booking\/claim\/inspect$/)
      expect(sent.url).not.toContain(CLAIM)
      expect(sent.method).toBe('POST')
      expect(sent.body).toEqual({ token: CLAIM })
    })
  })

  describe('authApi.claimBookingAccount', () => {
    const SIGNED_IN = {
      twoFactorRequired: false,
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 900,
      user: ATTENDEE,
    }

    // The email comes only from the token and the name only from the order;
    // the API's whitelist refuses either from a client.
    it('sends the token, the password and the terms — no name, no email', async () => {
      signedOut()
      const fetch = answering(SIGNED_IN)

      await authApi.claimBookingAccount({ token: CLAIM, password: 'sw0rdfish!1', acceptTerms: true })

      const sent = sentBy(fetch)
      expect(sent.url).toMatch(/\/auth\/register\/from-booking\/claim$/)
      expect(sent.url).not.toContain(CLAIM)
      expect(sent.method).toBe('POST')
      expect(sent.body).toEqual({ token: CLAIM, password: 'sw0rdfish!1', acceptTerms: true })
    })

    // The same session start a sign-in makes — one place a session begins.
    it('starts the attendee session the API opened', async () => {
      signedOut()
      answering(SIGNED_IN)

      await authApi.claimBookingAccount({ token: CLAIM, password: 'sw0rdfish!1', acceptTerms: true })

      expect(session.accessToken()).toBe('access')
      expect(session.refreshToken()).toBe('refresh')
      expect(session.persona()).toBe('attendee')
    })
  })
})
