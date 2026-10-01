import { afterEach, describe, expect, it, vi } from 'vitest'
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
