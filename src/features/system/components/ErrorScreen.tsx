import { Icon } from '@/components/ui'
import type { ErrorKind, ErrorView } from '../errorView'

/**
 * A page that could not load, shown where the page would have been.
 *
 * The layout is the static kit's 404 (404.html), reused so a failure looks
 * like part of the product rather than a crash — but it does not claim the
 * whole screen: rendered inside the admin shell's outlet it sits under the
 * rail and sub-nav, which stay usable so the person can go somewhere else.
 */

/** Icons kept to slugs already proven in this app — a wrong one renders tofu. */
const ICON: Record<ErrorKind, string> = {
  forbidden: 'hgi-square-lock-02',
  missing: 'hgi-compass-01',
  offline: 'hgi-alert-02',
  failed: 'hgi-alert-01',
}

export function ErrorScreen({
  view,
  onRetry,
  children,
}: {
  view: ErrorView
  onRetry: () => void
  /** Where to go instead — the caller knows which home this person has. */
  children?: React.ReactNode
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Icon name={ICON[view.kind]} size={40} />
          </span>
        </div>

        <h1 className="mt-6 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">
          {view.title}
        </h1>

        {/* The API's own sentence. Absent when the cause was one of our own
            bugs, whose message describes our source rather than their problem. */}
        {view.detail && (
          <p
            role="alert"
            className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-muted"
          >
            {view.detail}
          </p>
        )}

        <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          {view.canRetry && (
            <button type="button" onClick={onRetry} className="btn btn-primary w-full sm:w-auto">
              <Icon name="hgi-refresh" />
              Try again
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
