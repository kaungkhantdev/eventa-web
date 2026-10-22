import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { mapPanel, panel, type Panel } from '@/app/panels'
import { ApiError, api, type Query } from '@/lib/api'
import { enumParam } from '@/lib/urlFilters'
import { GROUP_LABEL, toNotification, toNotificationPreview, type NotificationPreview, type NotificationView } from './notifications.mapper'
import type { FeedBucket, NotificationFeedWire } from './notifications.types'
import { NOTIFICATION_PREVIEW_SIZE, NOTIFICATION_TABS, PREVIEW_UNAVAILABLE } from '@/lib/constants/engagement.constants'

/** The notification feed (US-MSG-03). */

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

/**
 * The bell's preview of the feed, as a panel: loaded, or what to say instead.
 *
 * `panel()` turns the API refusing or the network failing into the API's own
 * sentence. Unlike a page's panel, this one absorbs everything else as well,
 * except an ended session, which `pageData` must see to redirect to sign-in.
 * The reason is where React Router would render a throw from here: only the
 * bell's fetcher calls this loader, and a fetcher's error goes to the boundary
 * of the page that rendered it on the first load, and to the ROOT boundary when
 * it is revalidated after an action — this route is never among the page's
 * matches. Either would replace a working screen over a dropdown nobody opened.
 * A bug therefore shows in the bell, with a fixed sentence rather than the
 * exception's own message.
 */
export async function previewPanel(
  feed: () => Promise<NotificationFeedWire>,
  now: Date,
): Promise<Panel<NotificationPreview>> {
  try {
    return mapPanel(await panel(feed()), (wire) =>
      toNotificationPreview(wire, now, NOTIFICATION_PREVIEW_SIZE),
    )
  } catch (cause) {
    if (cause instanceof ApiError && cause.isUnauthorized) throw cause
    return { ok: false, error: PREVIEW_UNAVAILABLE }
  }
}

/** The bell's resource route: the feed's newest rows, never thrown over the page. */
export const notificationPreviewRoute = {
  loader: pageData(() => previewPanel(() => notificationsApi.feed({}), new Date())),
}
