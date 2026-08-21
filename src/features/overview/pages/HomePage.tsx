import { useLoaderData, useOutletContext } from 'react-router'
import { ButtonLink, HeaderUser, Icon } from '@/components/ui'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { isFirstRun } from '../firstRun'
import { ActivityRingPanel } from '../components/ActivityRingPanel'
import { FirstRunHome } from '../components/FirstRunHome'
import { AlertsPanel } from '../components/AlertsPanel'
import { TemplateShortcuts } from '../components/TemplateShortcuts'
import { TodayMeetingsPanel } from '../components/TodayMeetingsPanel'
import { TodayRegistrationsPanel } from '../components/TodayRegistrationsPanel'
import { UpcomingEventsPanel } from '../components/UpcomingEventsPanel'
import type { HomeData } from '../overview.routes'

/**
 * The organizer's daily home (US-DASH-01). Layout ported from admin/home.html.
 *
 * It reads and links out; nothing here changes a record. The greeting arrives
 * already written — the API decides morning from evening on the Bangkok clock,
 * which is the answer this product means wherever the browser happens to be.
 */
export default function HomePage() {
  const home = useLoaderData() as HomeData
  const { greeting, today, alerts, alertsEmpty, meetings, upcoming, ring } = home
  const ctx = useOutletContext<AdminOutletContext | null>()
  // A workspace with nothing in it gets the guided start, not six empty panels.
  const firstRun = isFirstRun(home)

  return (
    <>
      <header className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => ctx?.openDrawer()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
          title="Open menu"
        >
          <Icon name="hgi-menu-01" size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-bold tracking-tight text-ink">{greeting} 👋</h1>
          <p className="mt-0.5 hidden truncate text-[12px] text-muted sm:block">
            {firstRun
              ? "Let's get your first event live — you can stop at any point."
              : "Here's what's happening across your events today."}
          </p>
        </div>
        <ButtonLink to="/admin/event-form" variant="primary" className="ml-auto shrink-0">
          <Icon name="hgi-calendar-add-01" size={16} />
          <span className="hidden sm:inline">New event</span>
          <span className="sm:hidden">New</span>
        </ButtonLink>
        <HeaderUser />
      </header>

      {firstRun ? (
        <FirstRunHome setup={home.setup} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {today && <TodayRegistrationsPanel today={today} />}
            <TodayMeetingsPanel meetings={meetings} />
            <ActivityRingPanel ring={ring} />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <UpcomingEventsPanel upcoming={upcoming} />
            <AlertsPanel alerts={alerts} emptyMessage={alertsEmpty} />
          </div>

          <TemplateShortcuts />
        </>
      )}

      <p className="mt-6 text-center text-[11px] text-muted/70">
        Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
      </p>
    </>
  )
}
