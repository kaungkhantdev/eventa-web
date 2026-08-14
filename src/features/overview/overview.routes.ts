import { pageData } from '@/app/loaders'
import { mapPanel, panel, type Panel } from '@/app/panels'
import { authApi } from '@/features/auth/api'
import {
  toAlertRow,
  toMeetingRow,
  toShareSlices,
  toTodayRegistrations,
  toUpcomingCard,
} from './home.mapper'
import { UPCOMING_PREVIEW, overviewApi } from './overview.api'
import type {
  AlertRow,
  MeetingRow,
  ShareSlice,
  TodayRegistrations,
  UpcomingCard,
} from './overview.types'

/** The organizer's home screen (US-DASH-01..07). It only ever reads. */

export interface TodayMeetings {
  count: number
  rows: MeetingRow[]
}

export interface ActivityRing {
  slices: ShareSlice[]
  /** Every active event, not just the ones named in the legend. */
  active: number
}

export interface HomeData {
  greeting: string
  /** Null when this person may not see attendee personal data — hidden, not zeroed. */
  today: TodayRegistrations | null
  alerts: AlertRow[]
  alertsEmpty: string
  meetings: Panel<TodayMeetings>
  upcoming: Panel<UpcomingCard[]>
  ring: Panel<ActivityRing>
}

/** What the alert feed says when there is nothing outstanding (US-DASH-06). */
const ALL_CAUGHT_UP = "You're all caught up."

export const homeRoute = {
  loader: pageData(async (): Promise<HomeData> => {
    // The workspace's language decides the greeting and the alert wording, and
    // the shell's copy of `me` is not reachable from a sibling loader — the
    // router runs them in parallel, which is also why this costs nothing.
    const me = await authApi.me()
    const language = me.organization.locale

    // The greeting and the feeds it is built around are the page. The three
    // panels beside them are supplementary, so each is allowed to fail alone.
    const [home, meetings, upcoming, ring] = await Promise.all([
      overviewApi.home(language),
      panel(overviewApi.todayMeetings()),
      panel(overviewApi.upcoming()),
      panel(overviewApi.activeEvents()),
    ])

    return {
      greeting: home.greeting,
      today: home.today && toTodayRegistrations(home.today),
      alerts: home.alerts.alerts.map((a) => toAlertRow(a, language)),
      alertsEmpty: home.alerts.emptyMessage?.[language] ?? ALL_CAUGHT_UP,
      meetings: mapPanel(meetings, (page) => ({
        count: page.meta.total,
        rows: page.items.map(toMeetingRow),
      })),
      upcoming: mapPanel(upcoming, (events) =>
        events.slice(0, UPCOMING_PREVIEW).map(toUpcomingCard),
      ),
      ring: mapPanel(ring, (page) => ({
        slices: toShareSlices(page.items),
        active: page.meta.total,
      })),
    }
  }),
}
