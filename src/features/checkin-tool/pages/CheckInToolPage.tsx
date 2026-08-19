import { Link, useFetcher, useLoaderData, useOutletContext } from 'react-router'
import { HeaderUser, Icon, PageFooter } from '@/components/ui'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { CameraStage, CameraStatus } from '../components/CameraStage'
import { EventChooser } from '../components/EventChooser'
import { ManualSearch } from '../components/ManualSearch'
import { ScanResult } from '../components/ScanResult'
import { useQrCamera } from '../useQrCamera'
import type { StationData } from '../door.routes'
import type { AttendanceRow, DoorCounts, ScanFeedback } from '../door.types'

/**
 * The door station (US-REG-12/13). Ported from checkin-tool.html.
 *
 * Two ways in, both real. The camera decodes with the platform's own
 * BarcodeDetector; the manual fallback searches name, email or ticket code —
 * which is where a hardware reader types. Whichever finds the person, the API
 * decides what it means.
 *
 * The kit simulated all of this: a canned queue of outcomes on a timer, so the
 * page always "worked" and never told the truth. Its "Simulate scan" button
 * has no counterpart here on purpose.
 *
 * No `<main>`, no header bar of its own: this renders inside AdminShell's
 * `<main>` and its max-w-[1600px] wrapper, like every other admin page.
 */

type ScanAction = { scan: ScanFeedback } | { ok: false; error: string }

export default function CheckInToolPage() {
  const data = useLoaderData() as StationData
  const ctx = useOutletContext<AdminOutletContext | null>()
  const scan = useFetcher<ScanAction>()
  const feedback = scan.data && 'scan' in scan.data ? scan.data.scan : null
  const error = scan.data && 'ok' in scan.data && !scan.data.ok ? scan.data.error : null
  const busy = scan.state !== 'idle'
  const eventId = data.event?.id ?? ''

  // A decoded code goes through exactly the same action as a manual admit, so
  // the camera cannot become a second, subtly different way of letting someone
  // in.
  const camera = useQrCamera((code) => {
    if (!eventId) return
    scan.submit({ eventId, qrToken: code }, { method: 'post' })
  })

  return (
    <>
      {/* The EVENT is the headline; this is a station bound to it. */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() => ctx?.openDrawer()}
            title="Open menu"
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
          >
            <Icon name="hgi-menu-01" size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Check-in station
            </p>
            <EventChooser
              events={data.events}
              value={eventId}
              onChange={(chosen) => {
                window.location.search = `?eventId=${encodeURIComponent(chosen)}`
              }}
            />
            {/* Event facts. The kit's "Main Hall · Station 1" is not ported —
                it hard-coded a venue and a station identity that this product
                does not have, and inventing one would be worse than omitting
                it. */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted">
              {data.event?.when && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="hgi-calendar-03" size={14} />
                    <span className="tnum">{data.event.when}</span>
                  </span>
                  <span className="h-1 w-1 shrink-0 rounded-full bg-muted/40" />
                </>
              )}
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Live
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={`/admin/check-in${eventId ? `?eventId=${eventId}` : ''}`}
            className="btn btn-ghost shrink-0"
          >
            <Icon name="hgi-menu-square" size={16} />
            <span className="hidden sm:inline">Check-in list</span>
          </Link>
          <HeaderUser />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        <section className="card overflow-hidden p-0 xl:col-span-3">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight">Scan tickets</h2>
              <p className="mt-0.5 text-[12px] text-muted">
                Every valid scan checks the attendee in instantly.
              </p>
            </div>
            <CameraStatus camera={camera} />
          </div>

          <CameraStage camera={camera} busy={busy} />

          {feedback && <ScanResult feedback={feedback} />}
          {error && (
            <p
              role="alert"
              className="mx-5 mb-4 rounded-xl bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <ManualSearch eventId={eventId} />
        </section>

        <div className="flex flex-col gap-3 xl:col-span-2">
          <Stats counts={data.counts} />
          <Feed feed={data.feed} />
        </div>
      </div>

      <PageFooter />
    </>
  )
}

/**
 * The room at a glance. One card, not four: the share that has arrived is the
 * number an organizer reads across a hall, and it only means anything next to
 * the bar it fills.
 *
 * On-site and Late are the API's own totals for the whole event — never
 * counted from the feed, which shows the last eight arrivals of a thousand.
 */
function Stats({ counts }: { counts: DoorCounts }) {
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Checked in</p>
        <span className="tnum text-[13px] font-bold text-brand">{counts.percent}%</span>
      </div>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="tnum text-[26px] font-bold leading-none text-ink">{counts.checkedIn}</span>
        <span className="text-[14px] text-muted">
          / <span className="tnum">{counts.total}</span>
        </span>
      </p>
      <div className="mt-2.5 h-2 w-full rounded-full bg-line">
        <div
          className="h-2 rounded-full bg-brand transition-all"
          style={{ width: `${counts.percent}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted">
        <span>
          On-site <b className="tnum text-ink">{counts.onSite}</b>
        </span>
        <span>
          Late <b className="tnum text-red-500">{counts.late}</b>
        </span>
        <span className="ml-auto">
          Remaining <b className="tnum text-ink">{counts.expected}</b>
        </span>
      </div>
    </section>
  )
}

function Feed({ feed }: { feed: AttendanceRow[] }) {
  return (
    <section className="card flex min-h-0 flex-1 flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-tight">Just checked in</h2>
        <span className="flex items-center gap-1 text-[11px] font-medium text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Live
        </span>
      </div>
      {feed.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted">Nobody has come through yet.</p>
      ) : (
        <div className="mt-2">
          {feed.map((row) => (
            <div
              key={row.ticketId}
              className="flex items-center gap-2.5 border-t border-line py-2.5 first:border-t-0 first:pt-0"
            >
              <span className="avatar h-8 w-8 shrink-0 text-[10px]">{row.initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{row.name}</p>
                {/* One tone for every tier: the kit coloured VIP purple and
                    General green by hand, and a real catalogue has no such
                    fixed palette to read from. */}
                <span className="badge badge-green mt-0.5">{row.ticketType}</span>
              </div>
              <span className="tnum shrink-0 text-[11px] text-muted">{row.time}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
