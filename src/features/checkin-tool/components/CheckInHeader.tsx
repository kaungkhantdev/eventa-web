import { Link, useOutletContext } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { NotificationBell, UserChip } from '@/components/ui'
import { cn } from '@/lib/cn'
import { EVENTS, EVENT_META } from '../data/checkin'

/* The event is the headline; this station is bound to one event. The chevron
   select switches events, and the meta row reflects the picked event's date and
   live status. */
export function CheckInHeader({
  event,
  onEventChange,
}: {
  event: string
  onEventChange: (event: string) => void
}) {
  const ctx = useOutletContext<AdminOutletContext | null>()
  const meta = EVENT_META[event]

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={() => ctx?.openDrawer()}
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
          title="Open menu"
        >
          <i className="hgi-stroke hgi-menu-01 text-[18px]" />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Check-in station
          </p>
          {/* event name = hero; the chevron opens the picker to switch events */}
          <div
            className="relative mt-0.5 max-w-[240px] sm:max-w-[360px] lg:max-w-[480px]"
            title="This station is bound to one event — click to switch"
          >
            <select
              value={event}
              onChange={(e) => onEventChange(e.target.value)}
              className="select h-auto w-auto max-w-full cursor-pointer border-0 bg-transparent p-0 pr-8 text-[22px] font-bold leading-tight tracking-tight text-ink focus:outline-none focus:ring-0"
            >
              {EVENTS.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
          {/* event facts: date · venue · live status */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <i className="hgi-stroke hgi-calendar-03 text-[14px]" />
              <span className="tnum">{meta.date}</span>
            </span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-muted/40" />
            <span className="inline-flex items-center gap-1.5">
              <i className="hgi-stroke hgi-location-01 text-[14px]" />
              Main Hall · Station 1
            </span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-muted/40" />
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
              {meta.status}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link to="/admin/check-in" className="btn btn-ghost shrink-0">
          <i className="hgi-stroke hgi-menu-square text-[16px]" />
          <span className="hidden sm:inline">Check-in list</span>
        </Link>
        <NotificationBell />
        <UserChip />
      </div>
    </div>
  )
}
