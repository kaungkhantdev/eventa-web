import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './ApiError'
import { api } from './client'
import { session } from './session'

/**
 * What a 401 is allowed to do to the stored session.
 *
 * Renewing an aged-out access token is invisible by design, and nothing above
 * `@/lib/api` is supposed to know refresh tokens exist. The one visible
 * consequence is destructive: when the refresh cannot save the session either,
 * `send` clears all three storage keys. That is right for a page whose loader
 * guard turns the 401 into a redirect to sign-in — keeping a token nothing can
 * renew would only loop against the next 401 — and wrong for a read whose
 * caller has already decided it can live without the answer.
 *
 * The public checkout page is the second case, and the reason this file exists:
 * its profile pre-fill absorbs the 401 so a stale token cannot take down a page
 * a guest can still buy from, but absorbing it did not undo the sign-out that
 * produced it. Merely opening the page ended an attendee's session.
 *
 * Both halves are pinned here. The first is the one that must not move.
 */

const ACCESS = 'stale.access.token'
const REFRESH = 'stale.refresh.token'
const RENEWED = 'renewed.access.token'
const ME = { name: 'Mali Chaiwong' }

/**
 * `./session`'s own storage key, named here because it does not export one and
 * this file is the one caller with a reason to reach past it: `session.start`
 * cannot express a session that has an access token and no refresh token, and
 * that is a state a real browser reaches whenever the longer-lived token is the
 * one that goes first.
 */
const REFRESH_TOKEN_KEY = 'eventa.refreshToken'

/** `localStorage` as `./session` uses it, outliving a "reload" the same way. */
function fakeStorage() {
  const raw = new Map<string, string>()
  return {
    raw,
    getItem: (key: string) => raw.get(key) ?? null,
    setItem: (key: string, value: string) => void raw.set(key, value),
    removeItem: (key: string) => void raw.delete(key),
  }
}

let storage: ReturnType<typeof fakeStorage>

beforeEach(() => {
  storage = fakeStorage()
  vi.stubGlobal('window', { localStorage: storage })
  session.start({ accessToken: ACCESS, refreshToken: REFRESH, persona: 'admin' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function envelope(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const expired = () =>
  envelope(401, {
    success: false,
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message: 'Your session has expired. Please sign in again.',
  })

const ok = (data: unknown) =>
  envelope(200, { success: true, statusCode: 200, message: '', data })

/**
 * An API holding a token this session cannot present, whose refresh endpoint
 * answers as told — the one sequence this file is about.
 *
 * The read answers on the renewed token and 401s on the stale one, so a replay
 * is a real replay rather than the stub being asked twice.
 */
function apiWhereRefresh(outcome: 'works' | 'fails') {
  const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async (url) => {
      if (url.includes('/auth/refresh')) {
        return outcome === 'works' ? ok({ accessToken: RENEWED }) : expired()
      }
      return session.accessToken() === RENEWED ? ok(ME) : expired()
    },
  )
  vi.stubGlobal('fetch', fetch)
  return fetch
}

describe('a read whose page depends on the answer', () => {
  it('renews the access token and replays, when the refresh works', async () => {
    const fetch = apiWhereRefresh('works')

    await expect(api.get('/auth/me')).resolves.toEqual(ME)

    // Read, refresh, replay — and nothing above this layer was told.
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(session.accessToken()).toBe(RENEWED)
    expect(session.persona()).toBe('admin')
  })

  /**
   * The behaviour the fix must not change. An expired session on an admin page
   * still ends, so `requirePersona` redirects to sign-in on the next visit
   * instead of letting a dead token through to another 401.
   */
  it('ends the stored session when the refresh cannot save it', async () => {
    apiWhereRefresh('fails')

    await expect(api.get('/auth/me')).rejects.toBeInstanceOf(ApiError)

    expect(session.isSignedIn()).toBe(false)
    expect(session.refreshToken()).toBeNull()
    expect(session.persona()).toBeNull()
    // All three keys, not just the access token: a leftover persona label is
    // what the guard reads, and it would pass a session that cannot fetch.
    expect([...storage.raw.keys()]).toEqual([])
  })
})

describe('a 401 with nothing to refresh', () => {
  /**
   * The precondition that bounded the checkout defect, pinned so it stays a
   * bound: a guest, or anyone whose refresh token is gone, never reaches the
   * branch at all. Worth a test because it is the reason the live blast radius
   * was "signed-in attendees with a stale token" rather than everybody.
   */
  it('is a plain failure — there is no session to save or to end', async () => {
    const fetch = apiWhereRefresh('fails')
    storage.raw.delete(REFRESH_TOKEN_KEY)

    await expect(api.get('/auth/me')).rejects.toBeInstanceOf(ApiError)

    // One request: no refresh attempted, so no failed refresh to act on.
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(session.accessToken()).toBe(ACCESS)
    expect(session.persona()).toBe('admin')
  })
})

describe('a best-effort read, whose caller can live without the answer', () => {
  it('leaves the stored session exactly as it was when the refresh fails', async () => {
    apiWhereRefresh('fails')

    await expect(
      api.get('/me/profile', { bestEffort: true }),
    ).rejects.toBeInstanceOf(ApiError)

    expect(session.accessToken()).toBe(ACCESS)
    expect(session.refreshToken()).toBe(REFRESH)
    expect(session.persona()).toBe('admin')
  })

  it('still fails loudly — opting out of the sign-out is not swallowing', async () => {
    apiWhereRefresh('fails')

    // The caller decides what an absent answer means; `@/lib/api` never
    // decides for it by resolving with nothing.
    await expect(api.get('/me/profile', { bestEffort: true })).rejects.toThrow(
      /session has expired/,
    )
  })

  it('still refreshes and replays — a session that can be saved is saved', async () => {
    const fetch = apiWhereRefresh('works')

    await expect(api.get('/me/profile', { bestEffort: true })).resolves.toEqual(ME)

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(session.accessToken()).toBe(RENEWED)
  })

  it('does not hold open a session another read needs ended', async () => {
    // The refresh is single-flight, so both of these share one failure. The
    // opt-out is the caller's own and must not cover the page beside it.
    apiWhereRefresh('fails')

    const settled = await Promise.allSettled([
      api.get('/me/profile', { bestEffort: true }),
      api.get('/auth/me'),
    ])

    expect(settled.map((outcome) => outcome.status)).toEqual(['rejected', 'rejected'])
    expect(session.isSignedIn()).toBe(false)
  })

  it('reaches a list the same way, so a supplementary panel can opt out too', async () => {
    apiWhereRefresh('fails')

    await expect(
      api.list('/me/registrations', { bestEffort: true }),
    ).rejects.toBeInstanceOf(ApiError)

    expect(session.isSignedIn()).toBe(true)
  })
})
