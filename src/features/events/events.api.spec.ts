import { afterEach, describe, expect, it, vi } from 'vitest'
import { eventsApi } from './events.api'

/**
 * Cancelling an event (US-EVT-08), pinned at the wire: `CancelEventDto` takes
 * the reason and the version on screen, and its whitelist refuses anything else.
 */

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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('eventsApi.cancel', () => {
  it('posts the reason and the version to the event’s cancel endpoint', async () => {
    const fetch = answering({ id: 'ev-1', status: 'cancelled' })

    await eventsApi.cancel('ev-1', { reason: 'Venue became unavailable', version: 5 })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0]
    expect(new URL(url).pathname).toMatch(/\/events\/ev-1\/cancel$/)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({
      reason: 'Venue became unavailable',
      version: 5,
    })
  })
})

describe('eventsApi.updatePage', () => {
  // US-PAGE-10: the address and colour live on the page endpoint, which
  // answers 409 when the address is already in use.
  it('patches the event’s page with only what it is given', async () => {
    const fetch = answering({ slug: 'bkk-summit', template: 'aurora', accentColor: '#2563EB', published: false })

    await eventsApi.updatePage('ev-1', { slug: 'bkk-summit' })

    const [url, init] = fetch.mock.calls[0]
    expect(new URL(url).pathname).toMatch(/\/events\/ev-1\/page$/)
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(String(init?.body))).toEqual({ slug: 'bkk-summit' })
  })
})
