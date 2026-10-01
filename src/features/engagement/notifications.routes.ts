import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { api, type Query } from '@/lib/api'
import { enumParam } from '@/lib/urlFilters'
import { GROUP_LABEL, toNotification, type NotificationView } from './notifications.mapper'
import type { FeedBucket, NotificationFeedWire } from './notifications.types'

/** The notification feed (US-MSG-03). */

export const NOTIFICATION_TABS = ['all', 'unread'] as const
export type NotificationTab = (typeof NOTIFICATION_TABS)[number]

const notificationsApi = {
  feed: (query: Query) => api.get<NotificationFeedWire>('/notifications', { query }),
  markAllRead: () => api.post<{ readAt: string; unread: number }>('/notifications/read'),
}

export interface NotificationGroupView {
  bucket: FeedBucket
  label: string
  recent: boolean
  items: NotificationView[]
}

export interface NotificationsData {
  tab: NotificationTab
  /** Both counts, whichever tab is open: the All tab keeps its number. */
  counts: { all: number; unread: number }
  groups: NotificationGroupView[]
}

async function loadNotifications({ request }: LoaderArgs): Promise<NotificationsData> {
  const tab = enumParam(queryOf(request), 'tab', NOTIFICATION_TABS, 'all')
  const feed = await notificationsApi.feed({
    unreadOnly: tab === 'unread' ? true : undefined,
  })

  // One clock for the whole feed, so two items a second apart do not disagree
  // about what "now" was while the list was being built.
  const now = new Date()
  return {
    tab,
    counts: feed.counts,
    groups: feed.groups.map((group) => ({
      bucket: group.bucket,
      label: GROUP_LABEL[group.bucket],
      recent: group.recent,
      items: group.items.map((item) => toNotification(item, now)),
    })),
  }
}

/**
 * Marking the feed read.
 *
 * Nothing is returned for the page to hold: the loader revalidates after an
 * action, so the counts and the rows come back from the API rather than being
 * patched here — which is what stops the badge and the list disagreeing.
 */
async function runNotificationsAction(): Promise<null> {
  await notificationsApi.markAllRead()
  return null
}

export const notificationsRoute = {
  loader: pageData(loadNotifications),
  action: pageAction(runNotificationsAction),
}
