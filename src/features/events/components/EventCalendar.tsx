import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button, ButtonLink, Icon, IconButton } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Tone } from '../types'
import { COVER } from '../data/events'
import { CAL_EVENT_SEEDS, CAL_PILL, MONTHS, WEEK } from '../data/calendar'

/* Calendar view of admin/events.html — month grid + day agenda. Ported from the
   inline <script>: same 14 demo events (offset from today), same +N more roll-up
   at 3 pills per cell, same selected-day ring and today highlight. */

type CalEvent = { d: Date; t: string; name: string; tone: Tone }

const addDays = (base: Date, n: number): Date => {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}
const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const fmtTime = (t: string): string => {
  const [h, m] = t.split(':').map(Number)
  const ap = h < 12 ? 'am' : 'pm'
  const h12 = h % 12 || 12
  return m === 0 ? h12 + ap : h12 + ':' + String(m).padStart(2, '0') + ap
}
const fmtTimeLong = (t: string): string => {
  const [h, m] = t.split(':').map(Number)
  const ap = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return h12 + ':' + String(m).padStart(2, '0') + ' ' + ap
}

export function EventCalendar() {
  const [today] = useState(() => new Date())
  const [calState, setCalState] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState(() => new Date(today))

  const calEvents = useMemo<CalEvent[]>(
    () => CAL_EVENT_SEEDS.map((e) => ({ d: addDays(today, e.offset), t: e.t, name: e.name, tone: e.tone })),
    [today],
  )

  const monthCount = calEvents.filter(
    (e) => e.d.getFullYear() === calState.y && e.d.getMonth() === calState.m,
  ).length

  const cells = useMemo(() => {
    const first = new Date(calState.y, calState.m, 1)
    const gridStart = new Date(calState.y, calState.m, 1 - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const d = addDays(gridStart, i)
      const other = d.getMonth() !== calState.m
      const isToday = sameDay(d, today)
      const isSel = sameDay(d, selectedDay)
      const evs = calEvents.filter((e) => sameDay(e.d, d)).sort((a, b) => a.t.localeCompare(b.t))
      const shown = evs.slice(0, 3)
      const more = evs.length - shown.length
      return { d, other, isToday, isSel, shown, more }
    })
  }, [calState, selectedDay, today, calEvents])

  const agenda = useMemo(
    () => calEvents.filter((e) => sameDay(e.d, selectedDay)).sort((a, b) => a.t.localeCompare(b.t)),
    [calEvents, selectedDay],
  )
  const agendaIsToday = sameDay(selectedDay, today)

  const prevMonth = () =>
    setCalState((s) => (s.m === 0 ? { y: s.y - 1, m: 11 } : { y: s.y, m: s.m - 1 }))
  const nextMonth = () =>
    setCalState((s) => (s.m === 11 ? { y: s.y + 1, m: 0 } : { y: s.y, m: s.m + 1 }))
  const goToday = () => setCalState({ y: today.getFullYear(), m: today.getMonth() })

  const selectDay = (d: Date) => {
    setSelectedDay(d)
    if (d.getMonth() !== calState.m || d.getFullYear() !== calState.y) {
      setCalState({ y: d.getFullYear(), m: d.getMonth() })
    }
  }

  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconButton title="Previous month" onClick={prevMonth}>
            <Icon name="hgi-arrow-left-01" size={18} />
          </IconButton>
          <div className="min-w-[150px] text-center">
            <h2 className="text-[16px] font-bold tracking-tight">
              {MONTHS[calState.m]} {calState.y}
            </h2>
            <p className="text-[11px] text-muted">
              {monthCount} {monthCount === 1 ? 'event' : 'events'} this month
            </p>
          </div>
          <IconButton title="Next month" onClick={nextMonth}>
            <Icon name="hgi-arrow-right-01" size={18} />
          </IconButton>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="soft" size="sm" onClick={goToday}>
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
              {cells.map(({ d, other, isToday, isSel, shown, more }) => (
                <div
                  key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                  onClick={() => selectDay(d)}
                  className={cn(
                    'min-h-[118px] cursor-pointer border-b border-r border-line p-1.5 transition',
                    other && 'bg-canvas/40',
                    isSel ? 'ring-2 ring-inset ring-brand/60' : 'hover:bg-line/30',
                  )}
                >
                  <div className="mb-1">
                    <span
                      className={
                        isToday
                          ? 'grid h-6 w-6 place-items-center rounded-full bg-brand text-[12px] font-bold text-white'
                          : cn('text-[12px] font-semibold', other ? 'text-muted/40' : 'text-ink')
                      }
                    >
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {shown.map((e, idx) => (
                      <Link
                        key={idx}
                        to="/admin/event-detail"
                        onClick={(ev) => ev.stopPropagation()}
                        title={`${e.name} · ${fmtTime(e.t)}`}
                        className={cn(
                          'block rounded-md px-1.5 py-1 transition hover:brightness-95',
                          CAL_PILL[e.tone],
                        )}
                      >
                        <span className="block truncate text-[11px] font-semibold leading-tight">
                          {e.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-medium leading-tight opacity-75 tnum">
                          {fmtTime(e.t)}
                        </span>
                      </Link>
                    ))}
                    {more > 0 && (
                      <div className="px-1.5 text-[10px] font-semibold text-muted">+{more} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-hair p-4">
          <p className="text-[14px] font-bold tracking-tight text-ink">
            {(agendaIsToday ? 'Today · ' : '') +
              selectedDay.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
          </p>
          <p className="text-[11px] text-muted">
            {agenda.length} {agenda.length === 1 ? 'event scheduled' : 'events scheduled'}
          </p>
          <div className="mt-3 space-y-2">
            {agenda.length ? (
              agenda.map((e, idx) => (
                <Link
                  key={idx}
                  to="/admin/event-detail"
                  className="flex items-center gap-3 rounded-lg bg-canvas p-2.5 transition hover:bg-line"
                >
                  <span className={cn('h-9 w-1 shrink-0 rounded-full', COVER[e.tone])} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink tnum leading-tight">
                      {fmtTimeLong(e.t)}
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink">{e.name}</p>
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
