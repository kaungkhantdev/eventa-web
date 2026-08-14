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

  return (
    <ErrorScreen view={view} onRetry={() => revalidator.revalidate()}>
      <Link to={home} className="btn btn-soft w-full sm:w-auto">
        <Icon name="hgi-home-01" />
        Back to home
      </Link>
    </ErrorScreen>
  )
}
