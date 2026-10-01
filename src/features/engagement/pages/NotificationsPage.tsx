import { useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Button,
  Card,
  EmptyState,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  PillTabs,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useFilters } from '@/lib/useFilters'
import type { NotificationView } from '../notifications.mapper'
import type { NotificationTab, NotificationsData } from '../notifications.routes'
import type { FeedKind } from '../notifications.types'

/**
 * The notification feed (US-MSG-03). Layout ported from admin/notifications.html.
 *
 * Which items exist, what is unread and how they group are all the API's
 * answers — the feed is derived from registrations, payments and payouts, and
 * "read" is a watermark the server holds. The only state this page owns is
 * whether the older groups are expanded.
 */

/** Icon tints per kind, from the kit. */
const TINT: Record<FeedKind, string> = {
  registration: 'bg-brand-soft text-brand',
  payment: 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
  payout: 'bg-brand-soft text-brand',
  alert: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
}

function NotificationRow({ item }: { item: NotificationView }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-line',
        item.unread && 'bg-brand-soft/50',
      )}
    >
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', TINT[item.kind])}>
        <i className={cn('hgi-stroke', item.icon, 'text-[18px]')} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-ink">{item.title}</p>
          {item.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
        </div>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">
          {item.body.map((segment, index) =>
            segment.bold ? (
              <b key={index} className="font-semibold text-ink">
                {segment.text}
              </b>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </p>
      </div>
      <span className="shrink-0 whitespace-nowrap text-[11px] text-muted tnum">{item.time}</span>
    </div>
  )
}

export default function NotificationsPage() {
  const data = useLoaderData() as NotificationsData
  const { set } = useFilters()
  const marking = useFetcher()
  const [showOlder, setShowOlder] = useState(false)

  const visible = data.groups.filter((group) => group.recent || showOlder)
  const hasOlder = data.groups.some((group) => !group.recent)
  const showOlderButton = !showOlder && hasOlder
  // Only the Unread tab has a "caught up" state — an empty All feed means the
  // workspace has had no activity, which is a different sentence entirely.
  const caughtUp = data.tab === 'unread' && data.counts.unread === 0
  // The API has already applied the tab, so no groups means nothing to show for
  // it. Distinct from `visible`, which can be empty while older activity waits
  // behind the reveal.
  const nothingToShow = data.groups.length === 0

  const onTab = (tab: NotificationTab) => {
    setShowOlder(false)
    set({ tab: tab === 'all' ? null : tab })
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Registrations, payments, feedback and things that need your attention."
        actions={
          <>
            <marking.Form method="post">
              <Button
                type="submit"
                variant="ghost"
                className="shrink-0"
                disabled={data.counts.unread === 0 || marking.state !== 'idle'}
              >
                <Icon name="hgi-tick-double-01" size={16} />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Read</span>
              </Button>
            </marking.Form>
            <HeaderUser />
          </>
        }
      />

      <PillTabs<NotificationTab>
        items={[
          { value: 'all', label: 'All', count: data.counts.all },
          { value: 'unread', label: 'Unread', count: data.counts.unread },
        ]}
        value={data.tab}
        onChange={onTab}
      />

      {/* Gated on the groups the API returned, not on the visible ones: with
          only older activity, `visible` is empty and the reveal that would
          bring it back lives inside this block. */}
      {!nothingToShow && (
        <div className="mt-4 space-y-4 rounded-2xl bg-surface p-2 sm:p-3">
          {visible.map((group) => (
            <section key={group.bucket}>
              <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {group.label}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NotificationRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
          {showOlderButton && (
            <div className="px-1 pt-1 text-center">
              <button type="button" className="btn btn-soft btn-sm" onClick={() => setShowOlder(true)}>
                <Icon name="hgi-arrow-down-01" size={14} />
                Show older activity
              </button>
            </div>
          )}
        </div>
      )}

      {nothingToShow && (
        <Card className="mt-4">
          {caughtUp ? (
            // Deliberately NOT the no-results state: being caught up is good
            // news, and "nothing matches your filters" would read as a miss.
            <EmptyState
              icon="hgi-tick-double-01"
              title="You’re all caught up"
              actions={[{ label: 'Show all activity', onClick: () => onTab('all') }]}
            >
              Nothing here is unread. Anything new will appear as it happens.
            </EmptyState>
          ) : (
            // First run. The way forward is on an earlier screen — this feed is
            // filled by what happens across your events, not by anything that
            // can be added here.
            <EmptyState
              icon="hgi-notification-03"
              title="No activity yet"
              actions={[
                { label: 'See your events', to: '/admin/events', icon: 'hgi-calendar-03' },
              ]}
            >
              Registrations, payments, declined cards and payouts land here as they happen.
              Nothing has in the last 30 days.
            </EmptyState>
          )}
        </Card>
      )}

      <PageFooter />
    </>
  )
}
