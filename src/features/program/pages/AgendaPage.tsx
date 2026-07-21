import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router'
import { EventPicker, HeaderUser, Icon, PageFooter } from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import {
  AGENDA_EVENTS,
  AGENDA_EVENT_NAMES,
  CBY,
  HE,
  HH,
  HS,
  SESSION_ROOMS,
  SESSION_TYPES,
} from '../data/agenda'
import type { AgendaSession, SessionColor, SessionType } from '../data/agenda'

/** Track colours (Tailwind classes) — only `bg` and `t` are used on a block;
 *  `b` is kept for parity with the source palette. */
const PAL: Record<SessionColor, { b: string; bg: string; t: string }> = {
  green: { b: 'border-brand', bg: 'bg-brand-soft', t: 'text-brand' },
  amber: {
    b: 'border-amber-400 dark:border-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-400/10',
    t: 'text-amber-600 dark:text-amber-300',
  },
  rose: {
    b: 'border-rose-400 dark:border-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-400/10',
    t: 'text-rose-600 dark:text-rose-300',
  },
}

const toMin = (t: string) => {
  const p = t.split(':')
  return Number(p[0]) * 60 + Number(p[1])
}
const fmt = (m: number) =>
  String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')

const HOURS = Array.from({ length: HE - HS }, (_, i) => HS + i)

export default function AgendaPage() {
  const ctx = useOutletContext<AdminOutletContext | null>()

  const [events, setEvents] = useState(AGENDA_EVENTS)
  const [currentEvent, setCurrentEvent] = useState<string>(AGENDA_EVENT_NAMES[0])
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'week' | 'month'>('week')

  const panel = useDisclosure()
  const del = useDisclosure()
  const seq = useRef(90)

  // Add-session form
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDay, setSessionDay] = useState(0)
  const [sessionStart, setSessionStart] = useState('09:00')
  const [sessionEnd, setSessionEnd] = useState('10:30')
  const [sessionType, setSessionType] = useState<SessionType>('Keynote')
  const [sessionSpeakers, setSessionSpeakers] = useState('')
  const [sessionRoom, setSessionRoom] = useState<string>(SESSION_ROOMS[0])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        panel.onClose()
        del.onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [panel.onClose, del.onClose])

  const data = events[currentEvent]
  const days = data?.days ?? []
  const q = search.trim().toLowerCase()

  function saveSession() {
    const day = Number(sessionDay) || 0
    const s = sessionStart || '09:00'
    let e = sessionEnd || ''
    if (!e || toMin(e) <= toMin(s)) e = fmt(Math.min(toMin(s) + 60, HE * 60))
    if (toMin(e) > HE * 60) e = fmt(HE * 60)
    const type = sessionType
    const newSession: AgendaSession = {
      day,
      s,
      e,
      id: '#' + String(++seq.current).padStart(4, '0'),
      type,
      title: sessionTitle.trim() || 'Untitled session',
      who: sessionSpeakers.trim().slice(0, 2).toUpperCase() || 'NA',
      c: CBY[type] || 'green',
    }
    setEvents((prev) => {
      const ev = prev[currentEvent]
      if (!ev) return prev
      return { ...prev, [currentEvent]: { ...ev, sessions: [...ev.sessions, newSession] } }
    })
    setSessionTitle('')
    setSessionSpeakers('')
    panel.onClose()
  }

  return (
    <>
      {/* header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => ctx?.openDrawer()}
            title="Open menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
          >
            <Icon name="hgi-menu-01" size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Agenda for</p>
            <div className="relative -mt-0.5 inline-flex max-w-full items-center">
              <EventPicker
                value={currentEvent}
                onChange={setCurrentEvent}
                allLabel={false}
                className="w-auto max-w-full cursor-pointer border-0 bg-transparent text-[22px] font-bold tracking-tight text-ink"
              />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <HeaderUser />
        </div>
      </div>

      {/* calendar toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
            title="Previous week"
          >
            <Icon name="hgi-arrow-left-01" size={18} />
          </button>
          <h2 className="px-1 text-[17px] font-bold tracking-tight">{data ? data.month : ''}</h2>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
            title="Next week"
          >
            <Icon name="hgi-arrow-right-01" size={18} />
          </button>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Icon
              name="hgi-search-01"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
              placeholder="Search sessions…"
            />
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg bg-surface p-1">
            <button
              type="button"
              onClick={() => setView('week')}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition',
                view === 'week' ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink',
              )}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setView('month')}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition',
                view === 'month' ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink',
              )}
            >
              Month
            </button>
          </div>
          <button
            type="button"
            className="btn btn-primary shrink-0"
            onClick={panel.onOpen}
          >
            <Icon name="hgi-add-01" size={16} />
            <span className="hidden sm:inline">Add New</span>
          </button>
        </div>
      </div>

      {/* calendar */}
      <div className="card overflow-hidden p-0">
        <div className={cn('overflow-x-auto', view !== 'week' && 'hidden')}>
          <div className="min-w-[880px]">
            {data ? (
              <>
                <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-hair">
                  <div className="grid place-items-center border-r border-hair py-3 text-muted">
                    <Icon name="hgi-calendar-03" size={16} />
                  </div>
                  {days.map((d) => (
                    <div
                      key={d.d}
                      className="border-r border-hair py-2.5 text-center last:border-r-0"
                    >
                      <p className={cn('text-[13px] font-bold', d.hot ? 'text-brand' : 'text-ink')}>
                        {d.n}
                      </p>
                      <p className={cn('text-[11px] tnum', d.hot ? 'text-brand/70' : 'text-muted')}>
                        {d.d}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
                  <div className="relative border-r border-hair">
                    {HOURS.map((h) => (
                      <div key={h} className="relative" style={{ height: HH }}>
                        <span className="absolute right-2 top-1 text-[10px] text-muted tnum">
                          {String(h).padStart(2, '0')}:00
                        </span>
                      </div>
                    ))}
                  </div>
                  {days.map((d, di) => (
                    <div key={d.d} className="relative border-r border-hair last:border-r-0">
                      {HOURS.map((h) => (
                        <div key={h} style={{ height: HH }} className="border-b border-line/70" />
                      ))}
                      {data.sessions
                        .filter((s) => s.day === di)
                        .map((s) => {
                          const top = ((toMin(s.s) - HS * 60) / 60) * HH
                          const height = ((toMin(s.e) - toMin(s.s)) / 60) * HH
                          const p = PAL[s.c] || PAL.green
                          const hit = !q || (s.title + ' ' + s.type).toLowerCase().includes(q)
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={panel.onOpen}
                              className={cn(
                                'session absolute inset-x-1 overflow-hidden rounded-lg',
                                p.bg,
                                'px-2 pt-1.5 text-left transition hover:brightness-[0.97]',
                                !hit && 'hidden',
                              )}
                              style={{ top: top + 2, height: Math.max(height - 4, 18) }}
                            >
                              <p className={cn('text-[10px] font-medium tnum', p.t)}>{s.id}</p>
                              <p className={cn('truncate text-[12px] font-bold', p.t)}>{s.title}</p>
                              <span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-surface text-[9px] font-semibold text-ink shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                {s.who}
                              </span>
                            </button>
                          )
                        })}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-hair" />
                <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
                  <div className="col-span-full grid place-items-center px-4 py-16 text-center">
                    <div className="max-w-sm">
                      <Icon name="hgi-calendar-03" size={30} className="text-muted/40" />
                      <p className="mt-2 text-[14px] font-semibold text-ink">
                        No agenda for {currentEvent} yet
                      </p>
                      <p className="mt-1 text-[13px] text-muted">
                        Add a session to start building this event’s schedule.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className={cn('px-6 py-16 text-center', view !== 'month' && 'hidden')}>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
            <Icon name="hgi-calendar-03" size={22} />
          </div>
          <p className="mt-4 text-[15px] font-bold tracking-tight">Month view</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">
            Switch back to Week to lay out sessions by time slot.
          </p>
        </div>
      </div>

      <PageFooter />

      {/* Add / edit session panel */}
      <div className={cn('panel-overlay', panel.open && 'open')} onClick={panel.onClose} />
      <aside className={cn('panel', panel.open && 'open')} role="dialog" aria-modal="true">
        <header className="flex items-center justify-between border-b border-hair p-4">
          <h3 className="text-[15px] font-bold tracking-tight">Add session</h3>
          <button type="button" className="btn-icon" onClick={panel.onClose}>
            <Icon name="hgi-cancel-01" size={18} />
          </button>
        </header>
        <p className="border-b border-hair px-4 py-2.5 text-[12px] text-muted">
          Adding to <span className="font-semibold text-ink">{currentEvent}</span>
        </p>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="label">Session title</label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="input"
              placeholder="e.g. Opening Keynote: Building Tomorrow's Events"
            />
          </div>
          <div>
            <label className="label">Day</label>
            <select
              value={sessionDay}
              onChange={(e) => setSessionDay(Number(e.target.value))}
              className="select"
            >
              {days.map((d, i) => (
                <option key={d.d} value={i}>
                  {d.n} · {d.d}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start time</label>
              <input
                type="time"
                value={sessionStart}
                onChange={(e) => setSessionStart(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">End time</label>
              <input
                type="time"
                value={sessionEnd}
                onChange={(e) => setSessionEnd(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Track / type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as SessionType)}
              className="select"
            >
              {SESSION_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Speaker (initials)</label>
            <input
              type="text"
              maxLength={2}
              value={sessionSpeakers}
              onChange={(e) => setSessionSpeakers(e.target.value)}
              className="input uppercase"
              placeholder="e.g. SK"
            />
            <p className="hint">Shown as an avatar on the session block.</p>
          </div>
          <div>
            <label className="label">Room</label>
            <select
              value={sessionRoom}
              onChange={(e) => setSessionRoom(e.target.value)}
              className="select"
            >
              {SESSION_ROOMS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="textarea" placeholder="What will this session cover…" />
          </div>
        </div>
        <footer className="flex gap-2 border-t border-hair p-4">
          <button type="button" className="btn btn-soft flex-1" onClick={panel.onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary flex-1" onClick={saveSession}>
            Save session
          </button>
        </footer>
      </aside>

      {/* Delete confirm modal */}
      <div className={cn('panel-overlay', del.open && 'open')} onClick={del.onClose} />
      <div className={cn('modal', del.open && 'open')} role="dialog" aria-modal="true">
        <div className="p-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
            <Icon name="hgi-alert-01" size={18} />
          </div>
          <h3 className="mt-3 text-[15px] font-bold tracking-tight">Remove session?</h3>
          <p className="mt-1 text-[13px] text-muted">
            This will remove the session from the agenda. Attendees who bookmarked it won't be
            notified.
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-soft flex-1" onClick={del.onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger flex-1" onClick={del.onClose}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
