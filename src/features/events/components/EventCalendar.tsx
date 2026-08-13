import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button, ButtonLink, Icon, IconButton } from '@/components/ui'
import { bangkokDayKey } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  dayHeading,
  eventsOnDay,
  longTime,
  monthGrid,
  monthOfDay,
  parseMonth,
  shiftMonth,
  shortTime,
} from '../calendar'
import { CAL_PILL, COVER, MONTHS, WEEK } from '../events.presentation'
import type { CalendarEvent } from '../types'

/* Calendar view of admin/events.html — month grid + day agenda. Same three
   pills per square with a "+N more" roll-up, same selected-day ring and today
   highlight as the source kit.

   The month is the page's — it comes from the URL and is fetched by the loader —
   so this component only asks for a different one. Which day is selected is
   local: nothing is loaded for it, and it should not survive a reload. */

export interface EventCalendarProps {
  /** `YYYY-MM`, the month being shown. */
  month: string
  events: CalendarEvent[]
  /** How many events the month holds, as the API counted them. */
  count: number
  onMonth: (month: string) => void
}

export function EventCalendar({ month, events, count, onMonth }: EventCalendarProps) {
  // Today in Bangkok, not in the browser's timezone: this is the same "today"
  // the rest of the product means, and it is only recomputed on mount.
  const [today] = useState(() => bangkokDayKey(new Date()))
  const [selected, setSelected] = useState(today)

  const cells = useMemo(
    () => monthGrid(month, events, { today, selected }),
    [month, events, today, selected],
  )
  const agenda = useMemo(() => eventsOnDay(events, selected), [events, selected])
  const { year, month: index } = parseMonth(month)

  const selectDay = (day: string) => {
    setSelected(day)
    // Following a leading or trailing square into its own month is what the
    // kit did; here it also asks the loader for that month's events.
    if (monthOfDay(day) !== month) onMonth(monthOfDay(day))
  }

  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconButton title="Previous month" onClick={() => onMonth(shiftMonth(month, -1))}>
            <Icon name="hgi-arrow-left-01" size={18} />
          </IconButton>
          <div className="min-w-[150px] text-center">
            <h2 className="text-[16px] font-bold tracking-tight">
              {MONTHS[index]} {year}
            </h2>
            <p className="text-[11px] text-muted">
              {count} {count === 1 ? 'event' : 'events'} this month
            </p>
          </div>
          <IconButton title="Next month" onClick={() => onMonth(shiftMonth(month, 1))}>
            <Icon name="hgi-arrow-right-01" size={18} />
          </IconButton>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="soft" size="sm" onClick={() => onMonth(monthOfDay(today))}>
            Today
          </Button>
          <ButtonLink to="/admin/event-form" variant="primary" size="sm">
            <Icon name="hgi-calendar-add-01" size={14} />
            <span className="hidden sm:inline">New event</span>
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-x-auto">
          <div className="min-w-[680px] overflow-hidden rounded-xl border-l border-t border-line">
            <div className="grid grid-cols-7">
              {WEEK.map((w) => (
                <div
                  key={w}
                  className="border-b border-r border-line bg-canvas/50 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted"
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((cell) => (
                <div
                  key={cell.key}
                  onClick={() => selectDay(cell.key)}
                  className={cn(
                    'min-h-[118px] cursor-pointer border-b border-r border-line p-1.5 transition',
                    cell.otherMonth && 'bg-canvas/40',
                    cell.isSelected ? 'ring-2 ring-inset ring-brand/60' : 'hover:bg-line/30',
                  )}
                >
                  <div className="mb-1">
                    <span
                      className={
                        cell.isToday
                          ? 'grid h-6 w-6 place-items-center rounded-full bg-brand text-[12px] font-bold text-white'
                          : cn(
                              'text-[12px] font-semibold',
                              cell.otherMonth ? 'text-muted/40' : 'text-ink',
                            )
                      }
                    >
                      {cell.day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {cell.events.map((event) => (
                      <Link
                        key={event.id}
                        to={`/admin/event-detail?id=${event.id}`}
                        onClick={(ev) => ev.stopPropagation()}
                        title={`${event.name} · ${shortTime(event.time)}`}
                        className={cn(
                          'block rounded-md px-1.5 py-1 transition hover:brightness-95',
                          CAL_PILL[event.tone],
                        )}
                      >
                        <span className="block truncate text-[11px] font-semibold leading-tight">
                          {event.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-medium leading-tight opacity-75 tnum">
                          {shortTime(event.time)}
                        </span>
                      </Link>
                    ))}
                    {cell.more > 0 && (
                      <div className="px-1.5 text-[10px] font-semibold text-muted">
                        +{cell.more} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-hair p-4">
          <p className="text-[14px] font-bold tracking-tight text-ink">
            {(selected === today ? 'Today · ' : '') + dayHeading(selected)}
          </p>
          <p className="text-[11px] text-muted">
            {agenda.length} {agenda.length === 1 ? 'event scheduled' : 'events scheduled'}
          </p>
          <div className="mt-3 space-y-2">
            {agenda.length ? (
              agenda.map((event) => (
                <Link
                  key={event.id}
                  to={`/admin/event-detail?id=${event.id}`}
                  className="flex items-center gap-3 rounded-lg bg-canvas p-2.5 transition hover:bg-line"
                >
                  <span className={cn('h-9 w-1 shrink-0 rounded-full', COVER[event.tone])} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink tnum leading-tight">
                      {longTime(event.time)}
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink">
                      {event.name}
                    </p>
                  </div>
                  <Icon name="hgi-arrow-right-01" size={15} className="shrink-0 text-muted" />
                </Link>
              ))
            ) : (
              <div className="rounded-lg bg-canvas px-3 py-8 text-center text-[12px] text-muted">
                No events scheduled.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
