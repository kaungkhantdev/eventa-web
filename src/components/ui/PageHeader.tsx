import type { ReactNode } from 'react'
import { Link, useNavigate, useOutletContext, useRouteLoaderData } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { ADMIN_ROUTE_ID } from '@/app/loaders'
import { authApi } from '@/features/auth/api'
import { displayRole } from '@/features/auth/permissions'
import type { Me } from '@/features/auth/types'
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

type Note = { icon: string; tone: string; title: string; time: string }

const RECENT_NOTES: Note[] = [
  {
    icon: 'hgi-user-add-01',
    tone: 'text-brand bg-brand-soft',
    title: 'New registration for Tech Summit 2026',
    time: '2m ago',
  },
  {
    icon: 'hgi-wallet-01',
    tone: 'text-blue-600 bg-blue-50 dark:bg-blue-500/15 dark:text-blue-300',
    title: 'Payout of ฿82,400 sent to your bank',
    time: '1h ago',
  },
  {
    icon: 'hgi-alert-02',
    tone: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300',
    title: 'Bangkok Jazz Night is 90% sold out',
    time: '3h ago',
  },
  {
    icon: 'hgi-comment-01',
    tone: 'text-purple-600 bg-purple-50 dark:bg-purple-500/15 dark:text-purple-300',
    title: '12 new survey responses',
    time: 'Yesterday',
  },
]

/** Notification bell that opens a preview dropdown of recent activity. */
export function NotificationBell({ unread = true }: { unread?: boolean }) {
  return (
    <Dropdown
      align="right"
      panelClassName="w-80"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          title="Notifications"
          aria-expanded={open}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-muted transition hover:text-ink"
        >
          <Icon name="hgi-notification-03" size={18} />
          {unread && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface" />
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-hair px-4 py-3">
            <p className="text-[13px] font-bold text-ink">Notifications</p>
            <span className="badge badge-green">4 new</span>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {RECENT_NOTES.map((n, i) => (
              <li key={i}>
                <Link
                  to="/admin/notifications"
                  onClick={close}
                  className="flex items-start gap-3 px-4 py-2.5 transition hover:bg-line"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${n.tone}`}>
                    <Icon name={n.icon} size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-medium leading-snug text-ink">
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">{n.time}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/admin/notifications"
            onClick={close}
            className="block border-t border-hair px-4 py-2.5 text-center text-[12px] font-semibold text-brand transition hover:bg-line"
          >
            View all notifications
          </Link>
        </div>
      )}
    </Dropdown>
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
  role,
  email,
  onSignOut,
}: {
  name: string
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
          <div className="hidden leading-tight sm:block">
            <p className="text-[13px] font-semibold text-ink">{name}</p>
            <p className="text-[11px] text-muted">{role}</p>
          </div>
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
