/**
 * The smoothing over a route change.
 *
 * Navigating is three renders, not one: the page being left, the destination's
 * skeleton, then the destination itself. Each was a hard cut. Giving the
 * content area a key that changes on each of them lets a CSS entry animation
 * replay, so both halves fade instead of snapping.
 *
 * A key rather than a transition because there is nothing to transition
 * between — the old subtree is gone by the time the new one renders. Remounting
 * costs nothing here: the page component is mounting either way, since it was
 * not on screen while its skeleton was.
 */

/** The class that fades content in; defined in `styles/components.css`. */
export const ROUTE_FRAME = 'route-frame'

/**
 * Identifies what the content area is currently showing.
 *
 * `pending` is `usePendingPath()`, which is null unless a navigation to a
 * DIFFERENT path is in flight — so a filter, sort or page change leaves this
 * key untouched and the table does not flash on every keystroke.
 */
export function routeFrameKey(pending: string | null, pathname: string): string {
  // Prefixed rather than used bare: without it the skeleton for /admin/tickets
  // and the landed /admin/tickets would share a key, and the swap between them
  // — the more noticeable half — would stay a hard cut.
  return pending ? `pending:${pending}` : pathname
}

/** One key for every admin path, so the shell is never remounted. */
const ADMIN_FRAME = 'admin'

/**
 * The same, for the ROOT layout — which has a constraint the content area does
 * not: it must never remount the admin shell.
 *
 * The shell stays mounted across admin→admin moves on purpose. That is what
 * keeps the rail, the sub-nav and the scroll position from blinking, and the
 * shell runs its own fade inside itself. Keying this layer on the path would
 * tear all of that down and rebuild it on every navigation — the exact thing
 * the split between the two layouts exists to avoid. So every admin path shares
 * one key here, and only whole-screen swaps get a new one.
 *
 * `wholeScreenPending` is the destination of a navigation that replaces the
 * entire screen — null while a move stays inside the shell.
 */
export function rootFrameKey(
  wholeScreenPending: string | null,
  pathname: string,
  insideShell: boolean,
): string {
  if (wholeScreenPending) return `pending:${wholeScreenPending}`
  return insideShell ? ADMIN_FRAME : pathname
}
