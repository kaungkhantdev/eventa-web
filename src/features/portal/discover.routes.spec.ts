import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { session } from '@/lib/api'
import { discoverRoute } from './discover.routes'
import type { EventCardWire } from './discover.types'

/**
 * The heart on a What's on card, for a signed-in attendee (US-DISC-03).
 *
 * Pinned at the wire, with a fake eventa-api that pages the way the real one
 * does — `GET /me/saved-events` answers 12 per page unless asked for more, and
 * never more than 48 — because the defect this guards was a request that
 * looked complete and was not.
 */

const API_DEFAULT_LIMIT = 12
const API_MAX_LIMIT = 48

const idOf = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

function card(id: string): EventCardWire {
  return {
    id,
    slug: `event-${id}`,
    name: `Event ${id}`,
    type: 'Conference',
    categoryName: 'Conference',
    startAt: '2026-11-18T02:00:00.000Z',
    endAt: null,
    timezone: 'Asia/Bangkok',
    isOnline: false,
    venueName: 'BITEC',
    city: 'Bangkok',
    coverImage: null,
    organizerName: 'Eventa Co.',
    goingCount: 0,
    priceFrom: null,
    badge: null,
    rating: null,
  }
}

function ok(data: unknown, meta?: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, statusCode: status, message: '', data, meta }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function refused(status: number, message: string): Response {
  return new Response(JSON.stringify({ success: false, statusCode: status, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Newest first, as the API orders a shortlist. */
function savedPage(url: URL, saved: readonly string[]): Response {
  const page = Number(url.searchParams.get('page') ?? 1)
  const limit = Math.min(API_MAX_LIMIT, Number(url.searchParams.get('limit') ?? API_DEFAULT_LIMIT))
  const items = saved.slice((page - 1) * limit, page * limit).map(card)
  const totalPages = Math.ceil(saved.length / limit)
  return ok(items, { total: saved.length, page, limit, totalPages })
}

/** A fake eventa-api: the public feed, the strip, and one attendee's saves. */
function api(saved: readonly string[], feed: readonly string[]) {
  const fetch = vi.fn(async (input: string) => {
    const url = new URL(input)
    if (url.pathname.endsWith('/public/discover/categories')) return ok([])
    if (url.pathname.endsWith('/public/discover')) {
      return ok(feed.map(card), { total: feed.length, page: 1, limit: 12, totalPages: 1 })
    }
    if (url.pathname.endsWith('/me/saved-events')) return savedPage(url, saved)
    throw new Error(`unexpected request ${input}`)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

function signedInAttendee() {
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

const loaderArgs = () => ({
  request: new Request('http://localhost/portal/discover'),
  params: {},
})

beforeEach(signedInAttendee)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('discoverRoute.loader — a signed-in attendee’s hearts', () => {
  // "stays saved when I return" and "still shows as saved on another device":
  // both are the loader reading the account's shortlist, so a save that falls
  // off the first page of it reads as never made.
  it('fills the heart of a save older than the newest twelve', async () => {
    const saved = Array.from({ length: 13 }, (_, i) => idOf(i + 1))
    const oldest = saved[12]
    api(saved, [oldest])

    const data = await discoverRoute.loader(loaderArgs())

    expect(data.saved).toContain(oldest)
  })

  it('reads every page of a shortlist longer than the API will send at once', async () => {
    const saved = Array.from({ length: API_MAX_LIMIT + 3 }, (_, i) => idOf(i + 1))
    api(saved, [])

    const data = await discoverRoute.loader(loaderArgs())

    expect(data.saved).toEqual(saved)
  })
})

describe('discoverRoute.action — a heart that cannot be recorded', () => {
  function pressing(save: boolean) {
    const body = new FormData()
    body.set('eventId', idOf(1))
    body.set('save', String(save))
    return {
      request: new Request('http://localhost/portal/discover', { method: 'POST', body }),
      params: {},
    }
  }

  // The criterion names the message, so the API's own sentence ("This event
  // isn't available.") is not what the card shows.
  it('says it couldn’t save right now when the API refuses the save', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => refused(404, "This event isn't available.")),
    )

    expect(await discoverRoute.action(pressing(true))).toEqual({
      ok: false,
      error: "Couldn't save right now.",
    })
  })

  it('says it couldn’t save right now when the API cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    expect(await discoverRoute.action(pressing(true))).toEqual({
      ok: false,
      error: "Couldn't save right now.",
    })
  })

  it('says it couldn’t remove the save right now when an unsave fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => refused(500, 'Something went wrong')),
    )

    expect(await discoverRoute.action(pressing(false))).toEqual({
      ok: false,
      error: "Couldn't remove it from saved right now.",
    })
  })
})
