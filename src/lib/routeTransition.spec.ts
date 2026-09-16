import { describe, expect, it } from 'vitest'
import { rootFrameKey, routeFrameKey } from './routeTransition'

/**
 * The route fade replays whenever this key changes, so the key has to change
 * exactly when the content area shows something NEW — and not one time more.
 *
 * The case that matters is the one that looks like a route change but is not:
 * a list page re-runs its loader on every filter, sort and page change, and
 * fading the table on each keystroke would be worse than the abrupt swap this
 * replaces. `usePendingPath` already reports null for those, and this keeps the
 * key stable through them.
 */
describe('routeFrameKey', () => {
  it('changes when the route changes', () => {
    expect(routeFrameKey(null, '/admin/events')).not.toBe(routeFrameKey(null, '/admin/tickets'))
  })

  it('gives the skeleton and the page that follows it different keys', () => {
    // Both halves of a navigation fade: the old page giving way to the
    // skeleton, and the skeleton giving way to the real thing. Sharing a key
    // would leave the second — the more noticeable one — as a hard cut.
    const whileLoading = routeFrameKey('/admin/tickets', '/admin/events')
    const onceLanded = routeFrameKey(null, '/admin/tickets')
    expect(whileLoading).not.toBe(onceLanded)
  })

  it('holds still while only the query string changes', () => {
    // `usePendingPath` reports null for a same-path navigation, which is what
    // a filter or a page number is.
    const before = routeFrameKey(null, '/admin/registrations')
    const afterFiltering = routeFrameKey(null, '/admin/registrations')
    expect(afterFiltering).toBe(before)
  })

  it('holds still across a re-render that changes nothing', () => {
    expect(routeFrameKey('/admin/tickets', '/admin/events')).toBe(
      routeFrameKey('/admin/tickets', '/admin/events'),
    )
  })

  it('distinguishes two navigations to different destinations', () => {
    expect(routeFrameKey('/admin/tickets', '/admin/events')).not.toBe(
      routeFrameKey('/admin/invoices', '/admin/events'),
    )
  })
})

/**
 * The root layout's constraint is the opposite one: it must hold STILL while
 * the admin shell is on screen. Remounting there would tear down the rail, the
 * sub-nav and the scroll position on every navigation — which is the whole
 * reason admin→admin moves are handled by the shell rather than here.
 */
describe('rootFrameKey', () => {
  it('holds one key across every admin page, so the shell survives', () => {
    const onEvents = rootFrameKey(null, '/admin/events', true)
    const onTickets = rootFrameKey(null, '/admin/tickets', true)
    expect(onTickets).toBe(onEvents)
  })

  it('holds still while a move stays inside the shell', () => {
    // A navigation the shell handles reports no whole-screen pending path, so
    // nothing here changes for the whole of it.
    expect(rootFrameKey(null, '/admin/events', true)).toBe(
      rootFrameKey(null, '/admin/tickets', true),
    )
  })

  it('changes between two public routes', () => {
    expect(rootFrameKey(null, '/portal/discover', false)).not.toBe(
      rootFrameKey(null, '/portal/my-events', false),
    )
  })

  it('changes when a whole-screen swap is in flight', () => {
    const crossingIn = rootFrameKey('/admin/events', '/portal/discover', false)
    expect(crossingIn).not.toBe(rootFrameKey(null, '/portal/discover', false))
    expect(crossingIn).not.toBe(rootFrameKey(null, '/admin/events', true))
  })

  it('separates a public route from the shell it is replaced by', () => {
    expect(rootFrameKey(null, '/portal/discover', false)).not.toBe(
      rootFrameKey(null, '/admin/events', true),
    )
  })
})
