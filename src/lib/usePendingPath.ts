import { useNavigation } from 'react-router'

/**
 * The path React Router is navigating *to* while a navigation is in flight,
 * or `null` when the router is idle.
 *
 * A route stays "loading" for as long as its code-split chunk is being fetched
 * and its loader is running, which is exactly the window a skeleton should fill.
 * Layouts use this to swap their `<Outlet>` for a placeholder instead of leaving
 * the previous page on screen.
 */
export function usePendingPath(): string | null {
  const navigation = useNavigation()
  return navigation.location?.pathname ?? null
}
