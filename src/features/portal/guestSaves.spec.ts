import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { session } from '@/lib/api'
import { discoverApi } from './discover.api'
import { adoptGuestSaves } from './guestSaves'
import { createSavedEvents, type KeyValueStore, type SavedEvents } from './savedEvents'

/**
 * A guest's hearts, handed to the account they sign in to (US-DISC-03 "my
 * in-session saves are merged into my account", US-DISC-08 "those saves are
 * attached to my account").
 *
 * Pinned at the wire: `POST /me/saved-events/merge` existed and nothing in this
 * app ever called it, so a guest's shortlist was silently left behind.
 */

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'

function memoryStore(): KeyValueStore {
  const entries = new Map<string, string>()
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, value),
    removeItem: (key) => void entries.delete(key),
  }
}

function answering(response: () => Response | Promise<Response>) {
  const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () =>
    response(),
  )
  vi.stubGlobal('fetch', fetch)
  return fetch
}

const merged = (count: number) =>
  new Response(
    JSON.stringify({ success: true, statusCode: 200, message: '', data: { merged: count } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )

let guest: SavedEvents

beforeEach(() => {
  // The just-started session, as sign-in leaves it.
  const browser = memoryStore()
  vi.stubGlobal('window', { localStorage: browser })
  session.start({ accessToken: 'access', refreshToken: 'refresh', persona: 'attendee' })
  guest = createSavedEvents(memoryStore())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('adoptGuestSaves', () => {
  it('posts the guest’s saves to the account and then forgets them locally', async () => {
    guest.add(A)
    guest.add(B)
    const fetch = answering(() => merged(2))

    await adoptGuestSaves(guest, discoverApi.merge)

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toMatch(/\/me\/saved-events\/merge$/)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ eventIds: [A, B] })
    expect(guest.ids()).toEqual([])
  })

  it('asks for nothing when the guest saved nothing', async () => {
    const fetch = answering(() => merged(0))

    await adoptGuestSaves(guest, discoverApi.merge)

    expect(fetch).not.toHaveBeenCalled()
  })

  // Signing in has already worked; a shortlist that could not be handed over
  // must not undo that, and is kept so the next sign-in can try again.
  it('keeps the saves, and lets sign-in finish, when the merge fails', async () => {
    guest.add(A)
    answering(() => {
      throw new TypeError('Failed to fetch')
    })

    await expect(adoptGuestSaves(guest, discoverApi.merge)).resolves.toBeUndefined()
    expect(guest.ids()).toEqual([A])
  })
})
