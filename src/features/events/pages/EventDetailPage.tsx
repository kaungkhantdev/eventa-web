import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Link, useOutletContext } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { cn } from '@/lib/cn'
import { num } from '@/lib/format'
import { usePagination } from '@/components/ui'
import {
  ATTENDEES,
  EVT,
  INITIAL_AGENDA,
  INITIAL_TICKETS,
  REG_FILTERS,
  REGISTRATIONS,
  REGSTATUS,
  SESSION_TONE,
  SPEAKERS,
  TONE,
  type AgendaDay,
  type AvatarTone,
  type EventTicket,
  type RegFilter,
  type Session,
  type SessionType,
} from '../data/eventDetail'

/* ---------- Event detail — admin/event-detail.html ----------
   Pill tabs switch between Overview, Registrations (filter + pagination),
   Attendees, Speakers, Agenda (add/remove sessions via slide-over), and
   Tickets (add/remove via slide-over). A share modal renders a self-contained
   SVG flyer with a seeded QR code and exports it to PNG. */

type TabId = 'overview' | 'registrations' | 'attendees' | 'speakers' | 'agenda' | 'tickets'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'registrations', label: 'Registrations' },
  { id: 'attendees', label: 'Attendees' },
  { id: 'speakers', label: 'Speakers' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'tickets', label: 'Tickets' },
]

const SESSION_TYPES: SessionType[] = ['Keynote', 'Talk', 'Workshop', 'Panel', 'Break']

/** Close on Escape while `open`. */
function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
}

/** Initials chip in the list tone palette. */
function ToneAvatar({
  initials,
  tone,
  size = 'h-9 w-9',
}: {
  initials: string
  tone: AvatarTone
  size?: string
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full text-[11px] font-semibold',
        size,
        TONE[tone],
      )}
    >
      {initials}
    </span>
  )
}

export default function EventDetailPage() {
  const ctx = useOutletContext<AdminOutletContext | null>()
  const [tab, setTab] = useState<TabId>('overview')

  const [agenda, setAgenda] = useState<AgendaDay[]>(() =>
    INITIAL_AGENDA.map((d) => ({ ...d, sessions: [...d.sessions] })),
  )
  const [tickets, setTickets] = useState<EventTicket[]>(() => INITIAL_TICKETS.map((t) => ({ ...t })))

  const [sessionOpen, setSessionOpen] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <>
      {/* top controls */}
      <div className="mb-3 flex items-center gap-2">
        <button
          id="btn-menu"
          type="button"
          onClick={() => ctx?.openDrawer()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
          title="Open menu"
        >
          <i className="hgi-stroke hgi-menu-01 text-[18px]" />
        </button>
        <Link
          to="/admin/events"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
          title="Back to Events"
        >
          <i className="hgi-stroke hgi-arrow-left-01 text-[20px]" />
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            to="/admin/event-form"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3.5 py-2 text-[13px] font-semibold text-brand transition hover:brightness-95"
          >
            <i className="hgi-stroke hgi-edit-02 text-[15px]" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <a
            href="/landing/aurora?event=tech-summit-2026"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
          >
            <i className="hgi-stroke hgi-view text-[15px]" />
            <span className="hidden sm:inline">View page</span>
          </a>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:bg-line"
            title="Share event"
          >
            <i className="hgi-stroke hgi-share-08 text-[15px]" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            type="button"
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-muted transition hover:text-ink"
            title="Notifications"
          >
            <i className="hgi-stroke hgi-notification-03 text-[18px]" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface" />
          </button>
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-emerald-400 text-[12px] font-semibold text-white">
              HN
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-[13px] font-semibold text-ink">Harper Nelson</p>
              <p className="text-[11px] text-muted">Event Manager</p>
            </div>
          </div>
        </div>
      </div>

      {/* hero cover */}
      <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-emerald-500">
        <img
          src="https://picsum.photos/seed/tech-summit-2026/1280/440"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => e.currentTarget.remove()}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div className="relative flex min-h-[190px] flex-col justify-end p-5 sm:min-h-[230px] sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-[24px] font-extrabold tracking-tight text-white sm:text-[30px]">
              Tech Summit 2026
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
              <i className="hgi-stroke hgi-checkmark-circle-02 text-[12px]" />
              Registration open
            </span>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-white/85">
            <span>Sat–Sun, July 18–19, 2026 · 09:00</span>
            <span className="h-1 w-1 rounded-full bg-white/50" />
            <span>BITEC, Bangkok</span>
          </p>
        </div>
      </div>

      {/* tabs */}
      <div className="mb-5 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-lg px-3.5 py-2 text-[13px] font-semibold transition',
              t.id === tab ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ OVERVIEW ============ */}
      <div className={cn('space-y-4', tab !== 'overview' && 'hidden')}>
        <OverviewPanel />
      </div>

      {/* ============ REGISTRATIONS ============ */}
      <div className={cn(tab !== 'registrations' && 'hidden')}>
        <RegistrationsPanel />
      </div>

      {/* ============ ATTENDEES ============ */}
      <div className={cn(tab !== 'attendees' && 'hidden')}>
        <AttendeesPanel />
      </div>

      {/* ============ SPEAKERS ============ */}
      <div className={cn(tab !== 'speakers' && 'hidden')}>
        <SpeakersPanel />
      </div>

      {/* ============ AGENDA ============ */}
      <div className={cn(tab !== 'agenda' && 'hidden')}>
        <AgendaPanel agenda={agenda} setAgenda={setAgenda} onAdd={() => setSessionOpen(true)} />
      </div>

      {/* ============ TICKETS ============ */}
      <div className={cn(tab !== 'tickets' && 'hidden')}>
        <TicketsPanel tickets={tickets} setTickets={setTickets} onAdd={() => setTicketOpen(true)} />
      </div>

      <p className="mt-4 text-center text-[11px] text-muted/70">
        Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
      </p>

      <SessionPanel
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        onAdd={(dayIndex, session) =>
          setAgenda((prev) =>
            prev.map((d, i) =>
              i === dayIndex
                ? { ...d, sessions: [...d.sessions, session].sort((a, b) => a.time.localeCompare(b.time)) }
                : d,
            ),
          )
        }
      />
      <TicketPanel
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        onAdd={(ticket) => setTickets((prev) => [...prev, ticket])}
      />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  )
}

/* ---------- Overview ---------- */
function OverviewPanel() {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    const url = 'https://' + EVT.url
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      {/* quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-user-add-01 text-[16px]" />
            Registrations
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">
              312<span className="text-[13px] font-semibold text-muted">/400</span>
            </p>
            <span className="text-[11px] font-semibold text-brand">78%</span>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-wallet-01 text-[16px]" />
            Revenue
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿284k</p>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[12px]" />
              18%
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-ticket-01 text-[16px]" />
            Tickets sold
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">
              312<span className="text-[13px] font-semibold text-muted">/450</span>
            </p>
            <span className="text-[11px] font-medium text-muted">4 types</span>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-calendar-03 text-[16px]" />
            Days left
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">7</p>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-300">Jul 18</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {/* Landing page */}
          <section className="rounded-2xl bg-surface p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold tracking-tight">Landing page</h2>
              <span className="badge badge-green">
                <i className="hgi-stroke hgi-checkmark-circle-02 text-[12px]" />
                Published
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              {/* template preview */}
              <div className="w-full shrink-0 sm:w-52">
                <div className="overflow-hidden rounded-xl bg-canvas p-2">
                  <div className="flex items-center gap-1 px-1 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-black/15 dark:bg-white/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-black/15 dark:bg-white/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-black/15 dark:bg-white/20" />
                  </div>
                  <div className="overflow-hidden rounded-lg bg-white">
                    <div className="h-8 bg-gradient-to-r from-brand to-emerald-400" />
                    <div className="space-y-1.5 p-2.5">
                      <div className="h-2 w-16 rounded bg-neutral-800" />
                      <div className="grid grid-cols-3 gap-1">
                        <span className="h-4 rounded bg-neutral-100" />
                        <span className="h-4 rounded bg-neutral-100" />
                        <span className="h-4 rounded bg-neutral-100" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-ink">Classic</p>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                    All-purpose
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-snug text-muted">
                  A clean, all-purpose event page — the title, date, venue, agenda, speakers and
                  tickets fill in automatically.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-canvas px-3 py-2">
                  <i className="hgi-stroke hgi-link-01 text-[14px] shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-muted">
                    eventa.co/e/tech-summit-2026
                  </span>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 text-[11px] font-semibold text-brand hover:underline"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href="/landing/aurora?event=tech-summit-2026"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-brand-dark"
                  >
                    <i className="hgi-stroke hgi-view text-[15px]" />
                    Preview
                  </a>
                  <Link
                    to="/admin/landing-pages"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3.5 py-2 text-[12.5px] font-semibold text-brand transition hover:brightness-95"
                  >
                    <i className="hgi-stroke hgi-layout-01 text-[15px]" />
                    Change template
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="rounded-2xl bg-surface p-4 lg:p-5">
            <h2 className="text-[16px] font-bold tracking-tight">About this event</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Tech Summit 2026 brings together founders, engineers and product leaders from across
              Southeast Asia for two days of keynotes, hands-on workshops and a startup showcase —
              with plenty of networking over Thai coffee between sessions.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge badge-green">Conference</span>
              <span className="badge badge-gray">Public</span>
              <span className="badge badge-gray">2 days</span>
            </div>
          </section>
        </div>

        {/* details */}
        <section className="rounded-2xl bg-surface p-4 lg:p-5 xl:col-span-1">
          <h2 className="text-[16px] font-bold tracking-tight">Details</h2>
          <div className="mt-3 space-y-3 text-[13px]">
            <div className="flex items-start gap-2.5">
              <i className="hgi-stroke hgi-calendar-03 text-[16px] mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-semibold text-ink">Jul 18–19, 2026</p>
                <p className="text-[12px] text-muted">09:00 – 18:00 · GMT+7</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-t border-line pt-3">
              <i className="hgi-stroke hgi-location-01 text-[16px] mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-semibold text-ink">BITEC</p>
                <p className="text-[12px] text-muted">Bang Na, Bangkok</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-t border-line pt-3">
              <i className="hgi-stroke hgi-user-multiple text-[16px] mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-semibold text-ink">312 registered</p>
                <p className="text-[12px] text-muted">of 400 capacity</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-t border-line pt-3">
              <i className="hgi-stroke hgi-checkmark-badge-01 text-[16px] mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-semibold text-ink">Eventa Co.</p>
                <p className="text-[12px] text-muted">Organizer</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

/* ---------- Registrations ---------- */
function RegistrationsPanel() {
  const [filter, setFilter] = useState<RegFilter>('all')

  const filtered = useMemo(
    () => (filter === 'all' ? REGISTRATIONS : REGISTRATIONS.filter((r) => r.status === filter)),
    [filter],
  )
  const pg = usePagination(filtered, 10)

  const count = (f: RegFilter) =>
    f === 'all' ? REGISTRATIONS.length : REGISTRATIONS.filter((r) => r.status === f).length

  const changeFilter = (f: RegFilter) => {
    if (f === filter) return
    setFilter(f)
    pg.setPage(1)
  }

  const total = pg.total

  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold tracking-tight">Registrations</h2>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
            312 total
          </span>
        </div>
        <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-canvas p-1">
          {REG_FILTERS.map((f) => {
            const on = f === filter
            const label = f === 'all' ? 'All' : f
            return (
              <button
                key={f}
                type="button"
                onClick={() => changeFilter(f)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition',
                  on ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink',
                )}
              >
                {label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] tnum',
                    on ? 'bg-brand/15 text-brand' : 'bg-line text-muted',
                  )}
                >
                  {count(f)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              <th className="pb-3 pr-3 font-semibold">Attendee</th>
              <th className="pb-3 pr-3 font-semibold">Ticket</th>
              <th className="pb-3 pr-3 font-semibold">Amount</th>
              <th className="pb-3 pr-3 font-semibold">Registered</th>
              <th className="pb-3 pr-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {total === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[12px] text-muted">
                  No registrations
                </td>
              </tr>
            ) : (
              pg.slice.map((r, i) => (
                <tr key={i} className="border-t border-line transition hover:bg-line/50">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <ToneAvatar initials={r.initials} tone={r.tone} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                        <p className="truncate text-[11px] text-muted">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-[13px] text-muted">{r.ticket}</td>
                  <td className="py-2.5 pr-3 text-[13px] font-semibold text-ink tnum">{r.amount}</td>
                  <td className="py-2.5 pr-3 text-[13px] text-muted tnum">{r.date}</td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', REGSTATUS[r.status])}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
        <p>
          {total === 0 ? (
            'No registrations'
          ) : (
            <>
              Showing{' '}
              <span className="font-semibold text-ink">
                {pg.from}–{pg.to}
              </span>{' '}
              of <span className="font-semibold text-ink tnum">{num(total)}</span> registrations
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 whitespace-nowrap">
            Rows per page
            <select
              value={pg.size}
              onChange={(e) => pg.setSize(Number(e.target.value))}
              className="select h-8 w-auto min-w-[3.75rem] py-0 pl-2.5 pr-7 text-[12px] font-medium text-ink"
            >
              <option>10</option>
              <option>20</option>
              <option>30</option>
              <option>50</option>
            </select>
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              className="btn btn-soft btn-sm"
              aria-label="Previous page"
              disabled={total === 0 || pg.page <= 1}
              onClick={() => pg.setPage(pg.page - 1)}
            >
              <i className="hgi-stroke hgi-arrow-left-01 text-[14px]" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              aria-label="Next page"
              disabled={total === 0 || pg.page >= pg.pageCount}
              onClick={() => pg.setPage(pg.page + 1)}
            >
              <span className="hidden sm:inline">Next</span>
              <i className="hgi-stroke hgi-arrow-right-01 text-[14px]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Attendees ---------- */
function AttendeesPanel() {
  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold tracking-tight">Attendees</h2>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
            296 confirmed
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
        >
          <i className="hgi-stroke hgi-mail-send-01 text-[15px]" />
          <span className="hidden sm:inline">Email all</span>
        </button>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              <th className="pb-3 pr-3 font-semibold">Attendee</th>
              <th className="pb-3 pr-3 font-semibold">Company</th>
              <th className="pb-3 pr-3 font-semibold">Role</th>
              <th className="pb-3 pr-3 font-semibold">Ticket</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {ATTENDEES.map((a, i) => (
              <tr key={i} className="border-t border-line transition hover:bg-line/50">
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <ToneAvatar initials={a.initials} tone={a.tone} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{a.name}</p>
                      <p className="truncate text-[11px] text-muted">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-[13px] font-medium text-ink">{a.company}</td>
                <td className="py-2.5 pr-3 text-[13px] text-muted">{a.role}</td>
                <td className="py-2.5 pr-3">
                  <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-medium text-muted">
                    {a.ticket}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ---------- Speakers ---------- */
function SpeakersPanel() {
  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold tracking-tight">Speakers</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
        >
          <i className="hgi-stroke hgi-add-01 text-[15px]" />
          <span className="hidden sm:inline">Add speaker</span>
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SPEAKERS.map((s, i) => (
          <div key={i} className="rounded-2xl bg-canvas p-4">
            <div className="flex items-center gap-3">
              <ToneAvatar initials={s.initials} tone={s.tone} size="h-11 w-11" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-ink">{s.name}</p>
                <p className="truncate text-[12px] text-muted">{s.role}</p>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[12.5px] font-medium text-ink">
              <i className="hgi-stroke hgi-mic-01 text-[14px] mt-0.5 shrink-0 text-brand" />
              {s.talk}
            </p>
            <span className="mt-3 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
              {s.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Agenda ---------- */
function AgendaPanel({
  agenda,
  setAgenda,
  onAdd,
}: {
  agenda: AgendaDay[]
  setAgenda: Dispatch<SetStateAction<AgendaDay[]>>
  onAdd: () => void
}) {
  const removeSession = (di: number, si: number) =>
    setAgenda((prev) =>
      prev.map((d, i) =>
        i === di ? { ...d, sessions: d.sessions.filter((_, j) => j !== si) } : d,
      ),
    )

  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-bold tracking-tight">Agenda</h2>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/agenda"
            className="hidden text-[12px] font-semibold text-brand hover:underline sm:inline"
          >
            Manage agenda
          </Link>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
          >
            <i className="hgi-stroke hgi-add-01 text-[15px]" />
            <span className="hidden sm:inline">Add session</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-5">
        {agenda.map((d, di) => (
          <div key={di}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{d.day}</p>
            <div className="space-y-2">
              {d.sessions.length ? (
                d.sessions.map((s, si) => (
                  <div key={si} className="flex gap-3 rounded-xl bg-canvas p-3">
                    <div className="w-12 shrink-0 text-right">
                      <p className="text-[13px] font-bold text-ink tnum">{s.time}</p>
                      <p className="text-[10px] text-muted">{s.dur}</p>
                    </div>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2 border-l border-hair pl-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              TONE[SESSION_TONE[s.type]],
                            )}
                          >
                            {s.type}
                          </span>
                          <p className="text-[13px] font-semibold text-ink">{s.title}</p>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                          <i className="hgi-stroke hgi-mic-01 text-[12px]" />
                          {s.who} · {s.room}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSession(di, si)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/15"
                        title="Remove session"
                      >
                        <i className="hgi-stroke hgi-delete-02 text-[14px]" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-canvas px-3 py-5 text-center text-[12px] text-muted">
                  No sessions on this day.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Tickets ---------- */
function TicketsPanel({
  tickets,
  setTickets,
  onAdd,
}: {
  tickets: EventTicket[]
  setTickets: Dispatch<SetStateAction<EventTicket[]>>
  onAdd: () => void
}) {
  const removeTicket = (i: number) => setTickets((prev) => prev.filter((_, j) => j !== i))

  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold tracking-tight">Ticket types</h2>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/tickets"
            className="hidden text-[12px] font-semibold text-brand hover:underline sm:inline"
          >
            Manage tickets
          </Link>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-[13px] font-semibold text-brand transition hover:brightness-95"
          >
            <i className="hgi-stroke hgi-add-01 text-[15px]" />
            Add ticket
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tickets.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-canvas px-4 py-10 text-center text-[13px] text-muted">
            No ticket types yet — click “Add ticket” to create one.
          </div>
        ) : (
          tickets.map((t, i) => {
            const pct = t.total ? Math.round((t.sold / t.total) * 100) : 0
            return (
              <div key={i} className={cn('rounded-2xl p-4', t.featured ? 'bg-brand-soft' : 'bg-canvas')}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-bold text-ink">{t.name}</p>
                  <div className="flex items-center gap-1">
                    {t.featured && (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                        Popular
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTicket(i)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/15"
                      title="Remove ticket"
                    >
                      <i className="hgi-stroke hgi-delete-02 text-[13px]" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[20px] font-extrabold tracking-tight text-ink tnum">{t.price}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted tnum">
                      {t.sold}/{t.total} sold
                    </span>
                    <span className="font-semibold text-ink tnum">{pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <p
                  className={cn(
                    'mt-3 border-t pt-2.5 text-[12px] text-muted',
                    t.featured ? 'border-black/5 dark:border-white/10' : 'border-line',
                  )}
                >
                  Revenue <span className="font-semibold text-ink tnum">{t.revenue}</span>
                </p>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

/* ---------- Add session slide-over ---------- */
function SessionPanel({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (dayIndex: number, session: Session) => void
}) {
  useEsc(open, onClose)
  const [title, setTitle] = useState('')
  const [day, setDay] = useState('0')
  const [time, setTime] = useState('09:00')
  const [dur, setDur] = useState('45')
  const [type, setType] = useState<SessionType>('Keynote')
  const [who, setWho] = useState('')
  const [room, setRoom] = useState('Hall A')

  const add = () => {
    onAdd(Number(day), {
      time: time || '09:00',
      dur: (dur || '45') + 'm',
      title: title.trim() || 'Untitled session',
      type,
      who: who.trim() || 'TBA',
      room,
    })
    setTitle('')
    setWho('')
    onClose()
  }

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <aside className={cn('panel', open && 'open')} role="dialog" aria-modal="true">
        <header className="flex items-center justify-between border-b border-hair p-4">
          <h3 className="text-[15px] font-bold tracking-tight">Add session</h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            <i className="hgi-stroke hgi-cancel-01 text-[18px]" />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="label">Session title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Opening Keynote"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Day</label>
            <select className="select" value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="0">Day 1 · Sat, Jul 18</option>
              <option value="1">Day 2 · Sun, Jul 19</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start time</label>
              <input
                type="time"
                className="input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input
                type="number"
                min={5}
                step={5}
                className="input"
                value={dur}
                onChange={(e) => setDur(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value as SessionType)}
            >
              {SESSION_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Speaker</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Dr. Anna Wong"
              value={who}
              onChange={(e) => setWho(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Room</label>
            <select className="select" value={room} onChange={(e) => setRoom(e.target.value)}>
              <option>Hall A</option>
              <option>Hall B</option>
              <option>Foyer</option>
            </select>
          </div>
        </div>
        <footer className="flex gap-2 border-t border-hair p-4">
          <button type="button" className="btn btn-soft flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary flex-1" onClick={add}>
            <i className="hgi-stroke hgi-add-01 text-[15px]" />
            Add session
          </button>
        </footer>
      </aside>
    </>
  )
}

/* ---------- Add ticket slide-over ---------- */
function TicketPanel({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (ticket: EventTicket) => void
}) {
  useEsc(open, onClose)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('')
  const [desc, setDesc] = useState('')
  const [featured, setFeatured] = useState(false)

  const add = () => {
    const priceNum = parseInt(price, 10)
    const qtyNum = parseInt(qty, 10)
    onAdd({
      name: name.trim() || 'New Ticket',
      price: '฿' + (isNaN(priceNum) ? 0 : priceNum).toLocaleString('en-US'),
      sold: 0,
      total: isNaN(qtyNum) ? 0 : qtyNum,
      revenue: '฿0',
      featured,
    })
    setName('')
    setPrice('')
    setQty('')
    setDesc('')
    setFeatured(false)
    onClose()
  }

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <aside className={cn('panel', open && 'open')} role="dialog" aria-modal="true">
        <header className="flex items-center justify-between border-b border-hair p-4">
          <h3 className="text-[15px] font-bold tracking-tight">Add ticket</h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            <i className="hgi-stroke hgi-cancel-01 text-[18px]" />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="label">Ticket name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Early Bird"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Price (฿)</label>
              <input
                type="number"
                min={0}
                step={50}
                className="input"
                placeholder="1250"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                min={1}
                step={1}
                className="input"
                placeholder="200"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">
              Description <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              className="textarea"
              placeholder="What's included with this ticket…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-canvas p-3">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#1ba770]"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <span className="text-[13px] font-medium text-ink">Mark as “Popular”</span>
          </label>
        </div>
        <footer className="flex gap-2 border-t border-hair p-4">
          <button type="button" className="btn btn-soft flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary flex-1" onClick={add}>
            <i className="hgi-stroke hgi-add-01 text-[15px]" />
            Add ticket
          </button>
        </footer>
      </aside>
    </>
  )
}

/* ---------- Share modal (channels + self-contained SVG flyer) ---------- */
const shareUrl = 'https://' + EVT.url
const shareText = 'Join me at ' + EVT.title + ' — ' + EVT.dateLine.replace('·', '·') + ' at ' + EVT.loc

const CHAN: Record<string, (u: string, t: string) => string> = {
  facebook: (u) => 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u),
  x: (u, t) => 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(t) + '&url=' + encodeURIComponent(u),
  line: (u) => 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(u),
  whatsapp: (u, t) => 'https://wa.me/?text=' + encodeURIComponent(t + ' ' + u),
  email: (u, t) => 'mailto:?subject=' + encodeURIComponent(EVT.title) + '&body=' + encodeURIComponent(t + '\n\n' + u),
}

function hashStr(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(a: number): () => number {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function qrRects(seed: string, ox: number, oy: number, size: number): string {
  const N = 21
  const rnd = mulberry32(hashStr(seed))
  const on: boolean[][] = []
  for (let y = 0; y < N; y++) {
    on[y] = []
    for (let x = 0; x < N; x++) on[y][x] = rnd() > 0.5
  }
  function finder(fx: number, fy: number) {
    for (let y = -1; y <= 7; y++)
      for (let x = -1; x <= 7; x++) {
        const gx = fx + x
        const gy = fy + y
        if (gx < 0 || gy < 0 || gx >= N || gy >= N) continue
        let v: boolean
        if (x < 0 || x > 6 || y < 0 || y > 6) v = false
        else if (x === 0 || x === 6 || y === 0 || y === 6) v = true
        else if (x >= 2 && x <= 4 && y >= 2 && y <= 4) v = true
        else v = false
        on[gy][gx] = v
      }
  }
  finder(0, 0)
  finder(N - 7, 0)
  finder(0, N - 7)
  const cell = size / N
  let r = ''
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (on[y][x])
        r +=
          '<rect x="' +
          (ox + x * cell).toFixed(2) +
          '" y="' +
          (oy + y * cell).toFixed(2) +
          '" width="' +
          cell.toFixed(2) +
          '" height="' +
          cell.toFixed(2) +
          '" fill="#0b1220"/>'
  return r
}
function flame(x: number, y: number, size: number, fill: string): string {
  const s = size / 24
  return (
    '<g transform="translate(' +
    x +
    ',' +
    y +
    ') scale(' +
    s.toFixed(4) +
    ')" fill="' +
    fill +
    '" fill-rule="evenodd">' +
    '<path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></g>'
  )
}
function posterSVG(): string {
  const qr = qrRects(EVT.url, 36, 296, 80)
  return (
    '<svg viewBox="0 0 440 540" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto" font-family="Inter, system-ui, sans-serif">' +
    '<defs><linearGradient id="pbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1aa873"/><stop offset="1" stop-color="#128455"/></linearGradient>' +
    '<clipPath id="pcl"><rect x="0" y="0" width="440" height="540" rx="22"/></clipPath></defs>' +
    '<g clip-path="url(#pcl)">' +
    '<rect x="0" y="0" width="440" height="540" fill="url(#pbg)"/>' +
    '<circle cx="46" cy="34" r="96" fill="#ffffff" opacity="0.07"/>' +
    '<circle cx="410" cy="150" r="90" fill="#ffffff" opacity="0.06"/>' +
    '<text x="220" y="104" text-anchor="middle" font-size="18" font-weight="700" letter-spacing="5" fill="#fbf4e6">TECH SUMMIT</text>' +
    '<text x="220" y="178" text-anchor="middle" font-size="70" font-weight="800" letter-spacing="1" fill="#ffffff">2026</text>' +
    '<text x="220" y="212" text-anchor="middle" font-size="10.5" font-weight="600" letter-spacing="2.5" fill="#fbf4e6" opacity="0.92">BANGKOK · EST. 2026</text>' +
    '<rect x="0" y="266" width="440" height="274" fill="#faf3e4"/>' +
    '<rect x="28" y="288" width="96" height="96" rx="12" fill="#ffffff"/>' +
    qr +
    '<text x="142" y="315" font-size="13" font-weight="800" fill="#14342a">Sat–Sun · Jul 18–19, 2026</text>' +
    '<text x="142" y="338" font-size="12" font-weight="500" fill="#6f8078">09:00 · BITEC, Bangkok</text>' +
    '<text x="142" y="360" font-size="11.5" font-weight="500" fill="#6f8078">By Eventa Events</text>' +
    '<text x="142" y="387" font-size="11" font-weight="800" letter-spacing="0.5" fill="#128455">SCAN TO REGISTER</text>' +
    '<rect x="28" y="404" width="384" height="46" rx="23" fill="#128455"/>' +
    '<text x="220" y="433" text-anchor="middle" font-size="15" font-weight="700" fill="#ffffff">Register on Eventa</text>' +
    '<rect x="28" y="482" width="30" height="30" rx="9" fill="#128455"/>' +
    flame(34, 487, 18, '#ffffff') +
    '<text x="66" y="503" font-size="15.5" font-weight="800" fill="#14342a">Eventa</text>' +
    '<text x="412" y="503" text-anchor="end" font-size="11" font-weight="500" fill="#6f8078">' +
    EVT.url +
    '</text>' +
    '</g></svg>'
  )
}

const POSTER_SVG = posterSVG()

function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEsc(open, onClose)
  const posterRef = useRef<HTMLDivElement>(null)
  const [copyLabel, setCopyLabel] = useState('Copy link')
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const onShare = (kind: string) => {
    if (kind === 'copy') {
      const done = () => {
        setCopyLabel('Copied!')
        clearTimeout(copyTimer.current)
        copyTimer.current = setTimeout(() => setCopyLabel('Copy link'), 1600)
      }
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(shareUrl).then(done, done)
      else done()
      return
    }
    const href = CHAN[kind](shareUrl, shareText)
    if (kind === 'email') {
      const a = document.createElement('a')
      a.href = href
      document.body.appendChild(a)
      a.click()
      a.remove()
    } else {
      window.open(href, '_blank', 'noopener,noreferrer,width=620,height=540')
    }
  }

  const saveFlyer = () => {
    const src = posterRef.current?.querySelector('svg')
    if (!src) return
    const clone = src.cloneNode(true) as SVGSVGElement
    clone.setAttribute('width', '880')
    clone.setAttribute('height', '1080')
    const xml = new XMLSerializer().serializeToString(clone)
    const img = new Image()
    img.onload = () => {
      const W = 880
      const H = 1080
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      try {
        ctx.drawImage(img, 0, 0, W, H)
        const a = document.createElement('a')
        a.href = c.toDataURL('image/png')
        a.download = 'eventa-flyer-' + EVT.seed + '.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } catch (err) {
        console.warn('flyer export blocked', err)
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)))
  }

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true" style={{ maxWidth: 452 }}>
        <div className="max-h-[88vh] overflow-y-auto p-4 sm:p-5">
          {/* header */}
          <div className="relative mb-4 flex items-center justify-center">
            <h3 className="text-[15px] font-bold tracking-tight">Share event</h3>
            <button
              type="button"
              className="btn-icon absolute right-0 top-1/2 -translate-y-1/2"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="hgi-stroke hgi-cancel-01 text-[18px]" />
            </button>
          </div>

          {/* share channels */}
          <div className="grid grid-cols-6 gap-y-3">
            <button type="button" onClick={() => onShare('copy')} className="group flex flex-col items-center gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-hair bg-surface text-ink transition group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-sm">
                <i className="hgi-stroke hgi-link-01 text-[22px]" />
              </span>
              <span className="text-[12px] font-medium text-muted group-hover:text-ink">{copyLabel}</span>
            </button>
            <button type="button" onClick={() => onShare('facebook')} className="group flex flex-col items-center gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-hair bg-surface text-[#1877F2] transition group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-sm">
                <i className="hgi-stroke hgi-facebook-01 text-[22px]" />
              </span>
              <span className="text-[12px] font-medium text-muted group-hover:text-ink">Facebook</span>
            </button>
            <button type="button" onClick={() => onShare('x')} className="group flex flex-col items-center gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-hair bg-surface text-ink transition group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-sm">
                <i className="hgi-stroke hgi-new-twitter text-[20px]" />
              </span>
              <span className="text-[12px] font-medium text-muted group-hover:text-ink">X</span>
            </button>
            <button type="button" onClick={() => onShare('line')} className="group flex flex-col items-center gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-hair bg-surface text-[#06C755] transition group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-sm">
                <i className="hgi-stroke hgi-line text-[22px]" />
              </span>
              <span className="text-[12px] font-medium text-muted group-hover:text-ink">LINE</span>
            </button>
            <button type="button" onClick={() => onShare('whatsapp')} className="group flex flex-col items-center gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-hair bg-surface text-[#25D366] transition group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-sm">
                <i className="hgi-stroke hgi-whatsapp text-[22px]" />
              </span>
              <span className="text-[12px] font-medium text-muted group-hover:text-ink">WhatsApp</span>
            </button>
            <button type="button" onClick={() => onShare('email')} className="group flex flex-col items-center gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-hair bg-surface text-muted transition group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-sm group-hover:text-ink">
                <i className="hgi-stroke hgi-mail-01 text-[22px]" />
              </span>
              <span className="text-[12px] font-medium text-muted group-hover:text-ink">Email</span>
            </button>
          </div>

          {/* divider */}
          <div className="my-4 flex items-center gap-3 text-[12px] font-medium text-muted">
            <span className="h-px flex-1 bg-hair" />
            or share a flyer
            <span className="h-px flex-1 bg-hair" />
          </div>

          {/* flyer */}
          <div className="group relative">
            <div
              ref={posterRef}
              className="mx-auto max-w-[300px] overflow-hidden rounded-2xl ring-1 ring-hair"
              dangerouslySetInnerHTML={{ __html: POSTER_SVG }}
            />
            <button
              type="button"
              onClick={saveFlyer}
              className="pointer-events-none absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 translate-y-1 items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-[12.5px] font-bold text-ink opacity-0 shadow-xl ring-1 ring-black/5 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100 dark:ring-white/10"
            >
              <i className="hgi-stroke hgi-download-04 text-[15px]" />
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
