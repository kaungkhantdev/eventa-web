import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError, meProfileApi, session, type ProfileWire } from '@/lib/api'
import { INCOMPLETE_CONFIRM_LINK, loadEmailConfirmation } from './confirmEmail.routes'

/**
 * The page at the end of the email-change link (US-SET-01 "a confirmation link
 * is sent to the new address so I can prove it's mine", US-DISC-11 "I'm sent a
 * verification link while my old email keeps working until confirmed").
 *
 * The API has always built that link as `${PUBLIC_WEB_URL}/confirm-email?token=…`
 * and this app had no such route, so the link opened Not Found and a changed
 * address could never be confirmed.
 */

const TOKEN = 'header.payload.signature'
const INVALID_LINK = 'This confirmation link is invalid or has already been used.'
const CONFIRMED = { email: 'somchai.new@acme.test', pendingEmail: null } as ProfileWire

const opened = (search: string) => new Request(`http://localhost/confirm-email${search}`)

const confirming = () => vi.fn<(token: string) => Promise<ProfileWire>>(async () => CONFIRMED)

const refusing = (cause: Error) =>
  vi.fn<(token: string) => Promise<ProfileWire>>(async () => {
    throw cause
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadEmailConfirmation', () => {
  it('confirms the new address with the token from the link', async () => {
    const confirm = confirming()

    const data = await loadEmailConfirmation(opened(`?token=${TOKEN}`), confirm, null)

    expect(confirm).toHaveBeenCalledWith(TOKEN)
    expect(data).toEqual({ ok: true, email: CONFIRMED.email, next: null })
  })

  // Usually the person is still signed in on this device; they go back to it.
  it('offers the way back to the signed-in area of whoever is signed in', async () => {
    expect(await loadEmailConfirmation(opened(`?token=${TOKEN}`), confirming(), 'admin')).toEqual({
      ok: true,
      email: CONFIRMED.email,
      next: '/admin/home',
    })
    expect(
      await loadEmailConfirmation(opened(`?token=${TOKEN}`), confirming(), 'attendee'),
    ).toEqual({ ok: true, email: CONFIRMED.email, next: '/portal/my-events' })
  })

  it('calls a link with no token incomplete, without asking the API', async () => {
    const confirm = confirming()

    expect(await loadEmailConfirmation(opened(''), confirm, null)).toEqual({
      ok: false,
      error: INCOMPLETE_CONFIRM_LINK,
    })
    expect(confirm).not.toHaveBeenCalled()
  })

  // Expired, already used, or never valid: the API says so in words written
  // for the person holding the link, and they are shown as they are.
  it('refuses an invalid or used link in the API’s own words', async () => {
    const data = await loadEmailConfirmation(
      opened(`?token=${TOKEN}`),
      refusing(new ApiError(422, { message: INVALID_LINK })),
      null,
    )

    expect(data).toEqual({ ok: false, error: INVALID_LINK })
  })

  it('says so when the API cannot be reached, rather than crashing', async () => {
    const data = await loadEmailConfirmation(
      opened(`?token=${TOKEN}`),
      refusing(new NetworkError(new Error('offline'))),
      null,
    )

    expect(data.ok).toBe(false)
  })

  it('lets a programming error through to the error boundary', async () => {
    await expect(
      loadEmailConfirmation(opened(`?token=${TOKEN}`), refusing(new TypeError('boom')), null),
    ).rejects.toBeInstanceOf(TypeError)
  })
})

describe('meProfileApi.confirmEmail', () => {
  // Public on the API: the link may be opened on a device with no session, or
  // with somebody else's, so the call must not depend on — or carry — a token.
  it('posts the link’s token in the body, signed out', async () => {
    const entries = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => void entries.set(key, value),
        removeItem: (key: string) => void entries.delete(key),
      },
    })
    session.start({ accessToken: 'access', refreshToken: 'refresh', persona: 'admin' })
    const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      async () =>
        new Response(
          JSON.stringify({ success: true, statusCode: 200, message: '', data: CONFIRMED }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    vi.stubGlobal('fetch', fetch)

    await expect(meProfileApi.confirmEmail(TOKEN)).resolves.toEqual(CONFIRMED)

    const [url, init] = fetch.mock.calls[0]
    expect(url).toMatch(/\/me\/profile\/email\/confirm$/)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ token: TOKEN })
    expect(new Headers(init?.headers).has('Authorization')).toBe(false)
  })
})
