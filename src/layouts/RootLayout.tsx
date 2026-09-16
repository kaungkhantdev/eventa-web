import { Outlet, useLocation } from 'react-router'
import { isAdminPath } from '@/app/navigation'
import { RouteSkeleton } from '@/app/pageSkeletons'
import { usePendingPath } from '@/lib/usePendingPath'
import { ROUTE_FRAME, rootFrameKey } from '@/lib/routeTransition'
import { cn } from '@/lib/cn'

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
  const wholeScreenPending = pending && !staysInsideShell ? pending : null

  /* `h-full`, and not optional: this div now sits between `#root` and the
     shell, and the height chain that lets `main` scroll internally is passed
     down explicitly at every step (see the `#root` rule in index.css). Drop it
     and the rail's bottom items fall off the screen.

     The key deliberately does NOT follow the path while the shell is up — see
     `rootFrameKey`. Remounting here would rebuild the shell on every admin
     navigation, which is what this split exists to prevent. */
  return (
    <div
      key={rootFrameKey(wholeScreenPending, pathname, isAdminPath(pathname))}
      className={cn(ROUTE_FRAME, 'h-full')}
    >
      {wholeScreenPending ? <RouteSkeleton path={wholeScreenPending} /> : <Outlet />}
    </div>
  )
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
