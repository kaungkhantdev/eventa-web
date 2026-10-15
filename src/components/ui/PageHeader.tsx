import { useEffect, type ReactNode } from 'react'
import { Link, useFetcher, useNavigate, useOutletContext, useRouteLoaderData } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { ADMIN_ROUTE_ID } from '@/app/loaders'
import type { Panel } from '@/app/panels'
import { authApi } from '@/features/auth/api'
import { displayRole } from '@/features/auth/permissions'
import type { Me } from '@/features/auth/types'
import { NotificationBody } from '@/features/engagement/components/NotificationBody'
import type {
  NotificationPreview,
  NotificationView,
} from '@/features/engagement/notifications.mapper'
import { NOTIFICATION_TINT } from '@/features/engagement/notifications.presentation'
import { useTheme } from '@/lib/useTheme'
import { UserAvatar } from './Avatar'
import { Dropdown } from './Dropdown'
import { Icon } from './Icon'

/* The header row every admin page opens with: a mobile menu button, the title
   and subtitle, then right-aligned actions. */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  const ctx = useOutletContext<AdminOutletContext | null>()

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => ctx?.openDrawer()}
          title="Open menu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
        >
          <Icon name="hgi-menu-01" size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 hidden truncate text-[12px] text-muted sm:block">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  )
}

/* ---------- Notification bell + dropdown ---------- */

/** The bell's resource route, and the feed it previews (US-MSG-03). */
const PREVIEW_HREF = '/admin/notifications/preview'
const FEED_HREF = '/admin/notifications'

type Preview = Panel<NotificationPreview>

/**
 * Notification bell: the feed's unread count, and a dropdown of its newest rows.
 * Markup ported from the kit's header dropdown (`notifItem` in shell.js).
 *
 * Loaded when the bell mounts, which is once per admin page because each page
 * renders its own header, and revalidated by React Router after any action on
 * the page — that is what clears the count after "Mark all read". It is NOT
 * refreshed when only the query string changes on the same page (a tab or a
 * filter), so it can trail that page until the next navigation or action.
 */
export function NotificationBell() {
  const preview = useFetcher<Preview>()
  const { load } = preview
  const refresh = () => void load(PREVIEW_HREF)
  useEffect(() => {
    void load(PREVIEW_HREF)
  }, [load])

  const unread = preview.data?.ok ? preview.data.data.unread : 0
  return (
    <Dropdown
      align="right"
      panelClassName="w-[340px]"
      trigger={({ open, toggle }) => <BellButton open={open} toggle={toggle} unread={unread} />}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-hair px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-bold text-ink">Notifications</h3>
              {unread > 0 && (
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-soft px-1.5 text-[11px] font-semibold text-brand">
                  {unread}
                </span>
              )}
            </div>
          </div>
          <BellContents
            data={preview.data}
            busy={preview.state !== 'idle'}
            onPick={close}
            onRetry={refresh}
          />
          <Link
            to={FEED_HREF}
            onClick={close}
            className="block border-t border-hair px-4 py-2.5 text-center text-[13px] font-semibold text-brand hover:bg-line"
          >
            View all notifications
          </Link>
        </div>
      )}
    </Dropdown>
  )
}

function BellButton({
  open,
  toggle,
  unread,
}: {
  open: boolean
  toggle: () => void
  unread: number
}) {
  return (
    <button
      type="button"
      onClick={toggle}
      title="Notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      aria-expanded={open}
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-muted transition hover:text-ink"
    >
      <Icon name="hgi-notification-03" size={18} />
      {unread > 0 && (
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface" />
      )}
    </button>
  )
}

/** The dropdown's body in each of its states: loading, failed, empty, rows. */
function BellContents({
  data,
  busy,
  onPick,
  onRetry,
}: {
  data: Preview | undefined
  busy: boolean
  onPick: () => void
  onRetry: () => void
}) {
  if (!data) return <BellMessage>Loading notifications…</BellMessage>
  if (!data.ok) return <BellFailure error={data.error} busy={busy} onRetry={onRetry} />
  if (data.data.items.length === 0) return <BellMessage>No notifications yet.</BellMessage>
  return (
    <ul className="max-h-[340px] overflow-y-auto py-1">
      {data.data.items.map((item) => (
        <li key={item.id}>
          <BellRow item={item} onPick={onPick} />
        </li>
      ))}
    </ul>
  )
}

function BellMessage({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="px-4 py-6 text-center text-[12px] text-muted">
      {children}
    </p>
  )
}

/**
 * A failed read, with the API's own sentence and a retry. The retry re-runs the
 * bell's fetcher only — revalidating would reload the whole page under it.
 */
function BellFailure({
  error,
  busy,
  onRetry,
}: {
  error: string
  busy: boolean
  onRetry: () => void
}) {
  return (
    <div className="px-4 py-6 text-center">
      <p role="alert" className="text-[12px] text-muted">
        {error}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={busy}
        className="mt-2 text-[12px] font-semibold text-brand hover:text-brand-dark disabled:opacity-60"
      >
        Try again
      </button>
    </div>
  )
}

/** One row, as the kit's `notifItem`: title · sentence, time beneath, unread dot last. */
function BellRow({ item, onPick }: { item: NotificationView; onPick: () => void }) {
  return (
    <Link to={FEED_HREF} onClick={onPick} className="flex gap-3 px-4 py-2.5 transition hover:bg-line">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${NOTIFICATION_TINT[item.kind]}`}
      >
        <Icon name={item.icon} size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-ink">
          <span className="font-semibold">{item.title}</span> ·{' '}
          <NotificationBody segments={item.body} />
        </p>
        <p className="mt-0.5 text-[11px] text-muted">{item.time}</p>
      </div>
      {item.unread && (
        <>
          <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
          <span className="sr-only">(unread)</span>
        </>
      )}
    </Link>
  )
}

/* ---------- Signed-in user chip + profile menu ---------- */

const PROFILE_LINKS = [
  { to: '/admin/settings-profile', icon: 'hgi-user-circle', label: 'Your profile' },
  { to: '/admin/settings-organization', icon: 'hgi-building-03', label: 'Organization' },
  { to: '/admin/settings-notifications', icon: 'hgi-notification-03', label: 'Notification preferences' },
  { to: '/admin/settings-security', icon: 'hgi-shield-key', label: 'Security' },
]

/**
 * Signed-in user chip that opens a profile menu (links, theme toggle, sign
 * out). Collapses to just the avatar on small screens.
 *
 * Deliberately bare at rest — no hover fill, no padding, no chevron. The kit
 * paints nothing on this chip across all 46 admin pages; `shell.js` gives it
 * only `cursor-pointer` and a click handler. It is a real `<button>` here
 * rather than the kit's `<div onClick>`, so it keeps its focus ring.
 */
export function UserChip({
  name,
  email,
  onSignOut,
}: {
  name: string
  /** Still passed by callers; the trigger currently shows the avatar alone. */
  role: string
  email: string
  onSignOut: () => void
}) {
  const { dark, toggle } = useTheme()

  return (
    <Dropdown
      align="right"
      panelClassName="w-64"
      trigger={({ open, toggle: toggleMenu }) => (
        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={open}
          className="flex shrink-0 cursor-pointer items-center gap-2.5"
        >
          <UserAvatar name={name} />
          {/* <div className="hidden leading-tight sm:block">
            <p className="text-[13px] font-semibold text-ink">{name}</p>
            <p className="text-[11px] text-muted">{role}</p>
          </div> */}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center gap-3 border-b border-hair px-4 py-3">
            <UserAvatar name={name} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{name}</p>
              <p className="truncate text-[11px] text-muted">{email}</p>
            </div>
          </div>

          <div className="py-1">
            {PROFILE_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={close}
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-line"
              >
                <Icon name={l.icon} size={16} className="text-muted" />
                {l.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-hair py-1">
            <button
              type="button"
              onClick={toggle}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-line"
            >
              <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={16} className="text-muted" />
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          <div className="border-t border-hair py-1">
            <button
              type="button"
              onClick={() => {
                close()
                onSignOut()
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-red-500 transition hover:bg-line"
            >
              <Icon name="hgi-logout-03" size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </Dropdown>
  )
}

/**
 * `UserChip` wired to the real session.
 *
 * Reads the signed-in organizer from the admin shell's loader by route id, so
 * every page shows the real person without threading `me` through as a prop or
 * fetching it again per page. `UserChip` itself stays presentational — it takes
 * strings and a callback, which is what makes it usable outside the shell.
 */
export function SignedInChip() {
  const data = useRouteLoaderData(ADMIN_ROUTE_ID) as { me: Me } | undefined
  const me = data?.me ?? null
  const navigate = useNavigate()

  async function signOut() {
    // Clears the local session even if the request fails — the person asked to
    // leave this browser, and a network problem must not strand them inside.
    await authApi.logout()
    navigate('/auth/login', { replace: true })
  }

  return (
    <UserChip
      name={me?.name ?? ''}
      role={displayRole(me)}
      email={me?.email ?? ''}
      onSignOut={() => void signOut()}
    />
  )
}

/** The bell + user pairing used across most admin pages. */
export function HeaderUser() {
  return (
    <>
      <NotificationBell />
      <SignedInChip />
    </>
  )
}

/** The standard page footer line. */
export function PageFooter() {
  return (
    <p className="mt-4 text-center text-[11px] text-muted/70">
      Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
    </p>
  )
}
