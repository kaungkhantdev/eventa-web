import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError } from '@/lib/api'
import { previewPanel } from './notifications.routes'
import type { NotificationFeedWire } from './notifications.types'

/**
 * The notification bell's loader, and what it may throw.
 *
 * Only the bell's fetcher calls it, and React Router decides where a fetcher's
 * thrown error renders: the boundary of the page that rendered the bell on the
 * first load, and the ROOT boundary when the bell is revalidated after any
 * action — this route is never among the page's matches. Either would replace a
 * working screen over a dropdown nobody opened. So everything comes back as a
 * panel the bell can show, except an ended session, which must still reach
 * `pageData` to become the sign-in redirect.
 */

const NOW = new Date('2026-07-16T11:00:00.000Z')
const EMPTY: NotificationFeedWire = { counts: { all: 0, unread: 0 }, groups: [], readAt: null }
const failing = (cause: unknown) => () => Promise.reject(cause)
const errorOf = async (feed: () => Promise<NotificationFeedWire>) => {
  const result = await previewPanel(feed, NOW)
  return result.ok ? null : result.error
}

describe('previewPanel', () => {
  it('maps a feed that loaded', async () => {
    expect(await previewPanel(() => Promise.resolve(EMPTY), NOW)).toEqual({
      ok: true,
      data: { unread: 0, items: [] },
    })
  })

  it('keeps the API’s own sentence when the API refuses', async () => {
    const refused = new ApiError(503, { message: 'Notifications are paused until 14:00.' })
    expect(await errorOf(failing(refused))).toBe('Notifications are paused until 14:00.')
  })

  it('says to check the connection when the API cannot be reached', async () => {
    expect(await errorOf(failing(new NetworkError(new TypeError('Failed to fetch'))))).toMatch(
      /connection/,
    )
  })

  // `fetch` resolved, then the body read failed: a bare TypeError, not a
  // NetworkError, because the client only wraps the request itself.
  it('absorbs a connection dropped mid-response', async () => {
    expect(await errorOf(failing(new TypeError('network error')))).toBe(
      'We couldn’t load your notifications.',
    )
  })

  it('absorbs a response body that is not JSON', async () => {
    expect(await errorOf(failing(new SyntaxError('Unexpected token <')))).toBe(
      'We couldn’t load your notifications.',
    )
  })

  it('absorbs a bug in mapping without putting its message on screen', async () => {
    const broken = () => Promise.resolve(null as unknown as NotificationFeedWire)
    expect(await errorOf(broken)).toBe('We couldn’t load your notifications.')
  })

  it('lets an ended session through, so the sign-in redirect still happens', async () => {
    await expect(previewPanel(failing(new ApiError(401, {})), NOW)).rejects.toBeInstanceOf(
      ApiError,
    )
  })
})
