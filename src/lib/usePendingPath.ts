import { useLocation, useNavigation } from 'react-router'

/**
 * The path React Router is navigating *to* while a navigation is in flight,
 * or `null` when the router is idle.
 *
 * A route stays "loading" for as long as its code-split chunk is being fetched
 * and its loader is running, which is exactly the window a skeleton should fill.
 * Layouts use this to swap their `<Outlet>` for a placeholder instead of leaving
 * the previous page on screen.
 *
 * Staying on the same path is deliberately not reported. A list page re-runs its
 * loader whenever a filter, a sort or a page number changes in the URL, and
 * replacing the whole screen with a skeleton on every keystroke would be worse
 * than leaving the table there: the page is already correct apart from its rows,
 * and it marks its own pending state instead — see `useIsFiltering`.
 */
export function usePendingPath(): string | null {
  const navigation = useNavigation()
  const location = useLocation()
  const pending = navigation.location?.pathname ?? null
  return pending === location.pathname ? null : pending
}

/**
 * Whether the page on screen is waiting for a fresher version of its own data —
 * a filter or a page change, as opposed to a move to somewhere else.
 */
export function useIsFiltering(): boolean {
  const navigation = useNavigation()
  const location = useLocation()
  return navigation.state === 'loading' && navigation.location?.pathname === location.pathname
}
