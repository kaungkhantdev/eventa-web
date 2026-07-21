import type { ReactNode } from 'react'
import { useOutletContext } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { UserAvatar } from './Avatar'
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

/** Notification bell with an unread dot. */
export function NotificationBell({ unread = true }: { unread?: boolean }) {
  return (
    <button
      type="button"
      title="Notifications"
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-muted transition hover:text-ink"
    >
      <Icon name="hgi-notification-03" size={18} />
      {unread && (
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface" />
      )}
    </button>
  )
}

/** Signed-in user chip — avatar plus name/role, collapsing to the avatar on
 *  small screens. Pairs with NotificationBell in page headers. */
export function UserChip({
  name = 'Harper Nelson',
  role = 'Event Manager',
}: {
  name?: string
  role?: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <UserAvatar name={name} />
      <div className="hidden leading-tight sm:block">
        <p className="text-[13px] font-semibold text-ink">{name}</p>
        <p className="text-[11px] text-muted">{role}</p>
      </div>
    </div>
  )
}

/** The bell + user pairing used across most admin pages. */
export function HeaderUser() {
  return (
    <>
      <NotificationBell />
      <UserChip />
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
