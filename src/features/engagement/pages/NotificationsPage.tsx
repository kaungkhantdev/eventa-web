import { useMemo, useState } from 'react'
import { Button, HeaderUser, Icon, PageFooter, PageHeader, PillTabs } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  NOTIFICATION_GROUPS,
  TINT,
  type Notification,
  type NotificationGroup,
} from '../data/notifications'

/* ---------- Notifications — admin/notifications.html ----------
   Feed grouped by recency. Two pill filters (All / Unread) with live counts,
   a "Show older activity" reveal for non-recent groups, and "Mark all read"
   that flips every item to read. Message bodies render bold spans inline. */

type Filter = 'all' | 'unread'

function NotificationRow({ n, unread }: { n: Notification; unread: boolean }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-line',
        unread && 'bg-brand-soft/50',
      )}
      data-unread={unread ? '1' : '0'}
    >
      <span
        className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', TINT[n.kind])}
      >
        <i className={cn('hgi-stroke', n.icon, 'text-[18px]')} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-ink">{n.title}</p>
          {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
        </div>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">
          {n.body.map((seg, i) =>
            seg.bold ? (
              <b key={i} className="font-semibold text-ink">
                {seg.text}
              </b>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </p>
      </div>
      <span className="shrink-0 whitespace-nowrap text-[11px] text-muted tnum">{n.time}</span>
    </div>
  )
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [showOlder, setShowOlder] = useState(false)
  const [markedAllRead, setMarkedAllRead] = useState(false)

  const isUnread = (n: Notification) => (markedAllRead ? false : n.unread)

  const allCount = useMemo(
    () => NOTIFICATION_GROUPS.reduce((s, g) => s + g.items.length, 0),
    [],
  )
  const baseUnread = useMemo(
    () => NOTIFICATION_GROUPS.reduce((s, g) => s + g.items.filter((n) => n.unread).length, 0),
    [],
  )
  const unreadCount = markedAllRead ? 0 : baseUnread

  const passes = (n: Notification) => filter === 'all' || isUnread(n)

  const visibleGroups: NotificationGroup[] = NOTIFICATION_GROUPS.filter(
    (g) => g.recent || showOlder,
  )
    .map((g) => ({ ...g, items: g.items.filter(passes) }))
    .filter((g) => g.items.length > 0)

  const hasOlder = NOTIFICATION_GROUPS.some(
    (g) => !g.recent && g.items.some(passes),
  )
  const showOlderButton = !showOlder && hasOlder
  const feedEmpty = visibleGroups.length === 0 && !showOlderButton
  const showEmptyState = filter === 'unread' && unreadCount === 0

  const onFilter = (value: Filter) => {
    setFilter(value)
    setShowOlder(false)
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Registrations, payments, feedback and things that need your attention."
        actions={
          <>
            <Button
              variant="ghost"
              className="shrink-0"
              onClick={() => setMarkedAllRead(true)}
            >
              <Icon name="hgi-tick-double-01" size={16} />
              <span className="hidden sm:inline">Mark all read</span>
              <span className="sm:hidden">Read</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      <PillTabs<Filter>
        items={[
          { value: 'all', label: 'All', count: allCount },
          { value: 'unread', label: 'Unread', count: unreadCount },
        ]}
        value={filter}
        onChange={onFilter}
      />

      {!feedEmpty && (
        <div className="mt-4 space-y-4 rounded-2xl bg-surface p-2 sm:p-3">
          {visibleGroups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {g.label}
              </h2>
              <div className="space-y-0.5">
                {g.items.map((n, i) => (
                  <NotificationRow key={`${g.label}-${i}`} n={n} unread={isUnread(n)} />
                ))}
              </div>
            </section>
          ))}
          {showOlderButton && (
            <div className="px-1 pt-1 text-center">
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => setShowOlder(true)}
              >
                <Icon name="hgi-arrow-down-01" size={14} />
                Show older activity
              </button>
            </div>
          )}
        </div>
      )}

      {showEmptyState && (
        <p className="py-10 text-center text-[13px] text-muted">
          You're all caught up — no unread notifications.
        </p>
      )}

      <PageFooter />
    </>
  )
}
