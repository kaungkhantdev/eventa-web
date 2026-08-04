import { Outlet, useLocation } from 'react-router'
import { isAdminPath } from '@/app/navigation'
import { RouteSkeleton } from '@/app/pageSkeletons'
import { usePendingPath } from '@/lib/usePendingPath'

/* Pathless layout wrapped around every route. Its only job is loading state:
   it swaps the whole screen for a skeleton whenever a navigation replaces the
   entire page.

   Admin→admin moves are the exception. There the shell stays mounted and only
   its `<Outlet>` changes, so AdminShell renders that skeleton itself and the
   rail, sub-nav and scroll position never blink. */

export default function RootLayout() {
  const pending = usePendingPath()
  const { pathname } = useLocation()

  const staysInsideShell = pending !== null && isAdminPath(pending) && isAdminPath(pathname)
  if (pending && !staysInsideShell) return <RouteSkeleton path={pending} />

  return <Outlet />
}

/**
 * First paint. The router has matched the URL but the page chunk (and its
 * loader) are still in flight, so there is no previous screen to keep — React
 * Router renders this instead of nothing.
 */
export function RootFallback() {
  const { pathname } = useLocation()
  return <RouteSkeleton path={pathname} />
}
