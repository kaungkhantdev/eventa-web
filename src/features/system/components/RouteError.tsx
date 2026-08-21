import { Link, useLocation, useRevalidator, useRouteError } from 'react-router'
import { Icon } from '@/components/ui'
import { isAdminPath } from '@/app/navigation'
import { errorViewOf } from '../errorView'
import { ErrorScreen } from './ErrorScreen'

/**
 * The route `errorElement`: what renders when a loader or a page throws.
 *
 * Every page in this app writes only the happy path — a loader that returns has
 * succeeded, because `@/lib/api` throws on every non-2xx. That contract only
 * holds if something renders the unhappy path, and this is it. Without it React
 * Router falls back to its own developer screen, which prints a JavaScript
 * stack trace naming our source files at whoever is using the product.
 */
export function RouteError() {
  const error = useRouteError()
  const revalidator = useRevalidator()
  const { pathname } = useLocation()

  const view = errorViewOf(error)
  const home = isAdminPath(pathname) ? '/admin/home' : '/portal/discover'

  /**
   * Revalidating re-runs the loaders, which is the cure for a request that
   * failed. It is NOT the cure for a page whose code never downloaded: React
   * Router caches the rejected `lazy()` promise and never evicts it, so every
   * retry replays the same failure. That one needs the document loaded again.
   */
  const retry = () => {
    if (view.retry === 'reload') window.location.reload()
    else revalidator.revalidate()
  }

  return (
    <ErrorScreen view={view} onRetry={retry} busy={revalidator.state !== 'idle'}>
      <Link to={home} className="btn btn-soft w-full sm:w-auto">
        <Icon name="hgi-home-01" />
        Back to home
      </Link>
    </ErrorScreen>
  )
}
