import type { Panel } from '@/app/panels'
import type { ActivityRing } from '../overview.routes'
import type { ShareSlice } from '../overview.types'
import { PanelEmpty, PanelUnavailable, SectionHeader } from './PanelChrome'

/**
 * Which active events are driving sign-ups (US-DASH-05).
 *
 * The ring is an inline SVG rather than the shared `DonutChart`: the geometry
 * below (viewBox 0 0 42 42, r 15.915 so the circumference is 100) is the source
 * page's own arc maths, and its centre label and responsive box are page-local
 * sizes the shared component's fixed geometry cannot reproduce.
 */

const RADIUS = 15.915
const GAP = 2.4
const STROKE = 4.5
/** Where a dash offset of 0 would start; the kit rotates arcs to 12 o'clock. */
const TOP = 25

const NO_ACTIVE_EVENTS = 'No active events.'

export function ActivityRingPanel({ ring }: { ring: Panel<ActivityRing> }) {
  return (
    <section className="flex flex-col rounded-2xl bg-surface p-4">
      <SectionHeader title="Active events" link={{ to: '/admin/events', label: 'See all' }} />
      {ring.ok ? <Ring ring={ring.data} /> : <PanelUnavailable error={ring.error} />}
    </section>
  )
}

function Ring({ ring }: { ring: ActivityRing }) {
  if (ring.slices.length === 0) return <PanelEmpty>{NO_ACTIVE_EVENTS}</PanelEmpty>

  return (
    <div className="mt-4 flex flex-1 items-center gap-5">
      <div className="relative grid h-36 w-36 shrink-0 place-items-center sm:h-40 sm:w-40">
        <svg viewBox="0 0 42 42" className="h-full w-full">
          <Arcs slices={ring.slices} />
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="tnum text-[30px] font-bold leading-none text-ink">{ring.active}</p>
            <p className="mt-1 text-[11px] text-muted">events</p>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        {ring.slices.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="truncate text-[13.5px] text-ink">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The segments — or an empty track when nothing has been booked yet.
 *
 * Drawing four minimum-length stubs for four zero shares would read as "a
 * little of each" when the truth is "none of any".
 */
function Arcs({ slices }: { slices: ShareSlice[] }) {
  if (slices.every((s) => s.percent === 0)) {
    return (
      <circle
        cx={21}
        cy={21}
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE}
        className="stroke-line"
      />
    )
  }

  return arcsOf(slices).map(({ slice, length, offset }) => (
    <circle
      key={slice.name}
      cx={21}
      cy={21}
      r={RADIUS}
      fill="none"
      stroke={slice.color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeDasharray={`${length} ${100 - length}`}
      strokeDashoffset={offset}
    />
  ))
}

/**
 * Where each arc starts and how long it runs.
 *
 * A running total, kept out of the component so the render itself stays a plain
 * map over already-decided geometry. `length` leaves the kit's gap between
 * neighbours, with a floor so a 1% share is still visible as a dot.
 */
function arcsOf(slices: ShareSlice[]) {
  let start = 0
  return slices.map((slice) => {
    const arc = { slice, length: Math.max(slice.percent - GAP, 0.5), offset: TOP - start }
    start += slice.percent
    return arc
  })
}
