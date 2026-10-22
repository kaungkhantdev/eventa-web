import { afterEach, describe, expect, it, vi } from 'vitest'
import { programApi } from './program.api'

/**
 * Removing from the programme, pinned at the wire.
 *
 * The API refuses a removal that does not carry `confirm=true`, because the
 * warning it stands for — the attendees who bookmarked a session are not told,
 * a speaker comes off every session — has to have been shown and accepted
 * first. So `confirm` is sent only when the organizer confirmed; a call that
 * skipped the dialog is refused by the server rather than waved through.
 */

/** Answer every request with an empty success envelope. */
function answering() {
  const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async () =>
      new Response(JSON.stringify({ success: true, statusCode: 200, message: '', data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  vi.stubGlobal('fetch', fetch)
  return fetch
}

/** Where the one request went, and how. */
function sentBy(fetch: ReturnType<typeof answering>) {
  expect(fetch).toHaveBeenCalledTimes(1)
  const [url, init] = fetch.mock.calls[0]
  return { url: new URL(url), method: init?.method }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('programApi.removeSpeaker', () => {
  it('sends the organizer’s confirmation, which the API requires (US-PROG-11)', async () => {
    const fetch = answering()

    await programApi.removeSpeaker('e-1', 's-1', true)

    const sent = sentBy(fetch)
    expect(sent.method).toBe('DELETE')
    expect(sent.url.pathname).toMatch(/\/events\/e-1\/speakers\/s-1$/)
    expect(sent.url.searchParams.get('confirm')).toBe('true')
  })

  it('claims no confirmation the organizer did not give', async () => {
    const fetch = answering()

    await programApi.removeSpeaker('e-1', 's-1', false)

    expect(sentBy(fetch).url.searchParams.has('confirm')).toBe(false)
  })
})

describe('programApi.removeSession', () => {
  it('sends the organizer’s confirmation, which the API requires (US-PROG-04)', async () => {
    const fetch = answering()

    await programApi.removeSession('e-1', 'ss-1', true)

    const sent = sentBy(fetch)
    expect(sent.method).toBe('DELETE')
    expect(sent.url.pathname).toMatch(/\/events\/e-1\/sessions\/ss-1$/)
    expect(sent.url.searchParams.get('confirm')).toBe('true')
  })

  // It used to append confirm=true to every call, so the API's guard never
  // applied and nothing stood between one click and the removal.
  it('claims no confirmation the organizer did not give', async () => {
    const fetch = answering()

    await programApi.removeSession('e-1', 'ss-1', false)

    expect(sentBy(fetch).url.searchParams.has('confirm')).toBe(false)
  })
})
