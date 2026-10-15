import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError } from '@/lib/api'
import { ACCOUNT_LINK_INTENT, guestOrderRoute, knownAccount, requestAccountLink } from './guestOrder.routes'

/**
 * The account offer's two calls (US-DISC-15): which offer to make, and the
 * request for the link that only the booking's inbox receives.
 */

const ORDER_ID = '0b9c6a52-3f43-4f7e-9d1e-5a0c1f2b7e11'

afterEach(() => {
  vi.unstubAllGlobals()
})

/**
 * Supplementary: it must never cost the buyer their order page. Falling back
 * to "Create account" is safe because the API refuses a link for an address
 * that already has an account, in a sentence that says to sign in.
 */
describe('knownAccount', () => {
  it('reports what the API said', async () => {
    expect(await knownAccount(Promise.resolve({ accountExists: true }))).toBe(true)
    expect(await knownAccount(Promise.resolve({ accountExists: false }))).toBe(false)
  })

  it('falls back to offering an account when the API refuses the check', async () => {
    expect(await knownAccount(Promise.reject(new ApiError(500, {})))).toBe(false)
  })

  it('falls back to offering an account when the API cannot be reached', async () => {
    expect(await knownAccount(Promise.reject(new NetworkError(new Error('offline'))))).toBe(false)
  })

  it('lets a programming error through', async () => {
    await expect(knownAccount(Promise.reject(new TypeError('boom')))).rejects.toBeInstanceOf(
      TypeError,
    )
  })
})

describe('requestAccountLink', () => {
  it('asks for the link by the order’s id and reports where it went', async () => {
    const send = vi.fn(async () => ({ sentTo: 'anan@example.test' }))

    expect(await requestAccountLink(ORDER_ID, send)).toEqual({ sentTo: 'anan@example.test' })
    expect(send).toHaveBeenCalledWith(ORDER_ID)
  })

  // Shown beside the button the buyer pressed, never on an error screen in
  // place of their tickets — the resource-route rule.
  it('returns the API’s refusal verbatim rather than throwing', async () => {
    const conflict = 'An account already uses this email. Sign in instead.'
    const refusing = vi.fn(async () => {
      throw new ApiError(409, { message: conflict })
    })

    expect(await requestAccountLink(ORDER_ID, refusing)).toEqual({ error: conflict })
  })

  it('reports an unreachable server beside the button too', async () => {
    const offline = vi.fn(async () => {
      throw new NetworkError(null)
    })

    expect(await requestAccountLink(ORDER_ID, offline)).toEqual({
      error: new NetworkError(null).message,
    })
  })

  it('lets a programming error through', async () => {
    const broken = vi.fn(async () => {
      throw new TypeError('boom')
    })

    await expect(requestAccountLink(ORDER_ID, broken)).rejects.toBeInstanceOf(TypeError)
  })
})

/** The page's one action serves both of its forms, told apart by `intent`. */
describe('guestOrderRoute.action', () => {
  function posted(fields: Record<string, string>) {
    const form = new FormData()
    for (const [key, value] of Object.entries(fields)) form.append(key, value)
    return new Request(`http://localhost/my/tickets/orders/${ORDER_ID}`, {
      method: 'POST',
      body: form,
    })
  }

  it('sends the account link for the account offer’s intent', async () => {
    const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      async () =>
        new Response(
          JSON.stringify({ success: true, statusCode: 202, message: '', data: { sentTo: 'anan@example.test' } }),
          { status: 202, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    vi.stubGlobal('fetch', fetch)

    const result = await guestOrderRoute.action({
      params: { orderId: ORDER_ID },
      request: posted({ intent: ACCOUNT_LINK_INTENT }),
    })

    expect(result).toEqual({ sentTo: 'anan@example.test' })
    expect(fetch.mock.calls[0][0]).toMatch(
      new RegExp(`/auth/register/from-booking/${ORDER_ID}/link$`),
    )
  })

  // The payment form has no intent of its own, as before.
  it('still treats a submission without an intent as a payment', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    const result = await guestOrderRoute.action({
      params: { orderId: ORDER_ID },
      request: posted({}),
    })

    expect(result).toEqual({ error: 'Choose a payment method.' })
    expect(fetch).not.toHaveBeenCalled()
  })
})
