import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router'
import { ButtonLink, HeaderUser, Icon } from '@/components/ui'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { cn } from '@/lib/cn'
import {
  ACTIVE_EVENTS,
  ALERTS,
  TEMPLATES,
  TODAY_MEETINGS,
  TODAY_REGISTRATIONS,
  UPCOMING_EVENTS,
} from '../data/home'

/* Faithful port of admin/home.html. The active-events donut is rendered as an
   inline SVG (matching the source's viewBox 0 0 42 42 arc maths) rather than the
   shared DonutChart, because this ring uses a page-local centre-label size
   (text-[30px]) and a responsive box (h-36 sm:h-40) the shared component's fixed
   geometry can't reproduce. */

// Active-events donut geometry, ported verbatim from the inline script.
const R = 15.915
const GAP = 2.4
const SW = 4.5

export default function HomePage() {
  const ctx = useOutletContext<AdminOutletContext | null>()

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  }, [])

  let donutStart = 0
  const donutArcs = ACTIVE_EVENTS.map((p) => {
    const len = Math.max(p.pct - GAP, 0.5)
    const arc = (
      <circle
        key={p.name}
        cx={21}
        cy={21}
        r={R}
        fill="none"
        stroke={p.color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeDasharray={`${len} ${100 - len}`}
        strokeDashoffset={25 - donutStart}
      />
    )
    donutStart += p.pct
    return arc
  })

  return (
    <>
      {/* top bar */}
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
          <h1 className="truncate text-[22px] font-bold tracking-tight text-ink">
            {greeting}, Harper 👋
          </h1>
          <p className="mt-0.5 hidden truncate text-[12px] text-muted sm:block">
            Here's what's happening across your events today.
          </p>
        </div>
        <ButtonLink to="/admin/event-form" variant="primary" className="ml-auto shrink-0">
          <Icon name="hgi-calendar-add-01" size={16} />
          <span className="hidden sm:inline">New event</span>
          <span className="sm:hidden">New</span>
        </ButtonLink>
        <HeaderUser />
      </header>

      {/* Row 1: Registrations · Meetings · Active events */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Registrations */}
        <section className="rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold tracking-tight">Today's Registrations</h2>
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-soft px-1.5 text-[11px] font-semibold text-brand-dark dark:text-brand">
                48
              </span>
            </div>
            <Link
              to="/admin/registrations"
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-3.5 space-y-3.5">
            {TODAY_REGISTRATIONS.map((r) => (
              <div key={r.name} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                    r.avatar,
                  )}
                >
                  {r.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                  <p className="truncate text-[12px] text-muted">{r.detail}</p>
                </div>
                <span className="tnum shrink-0 text-[11px] text-muted">{r.time}</span>
              </div>
            ))}
          </div>
          <Link
            to="/admin/registrations"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-dark"
          >
            <Icon name="hgi-user-add-01" size={15} />
            View all registrations
          </Link>
        </section>

        {/* Today's Meetings */}
        <section className="rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold tracking-tight">Today's Meetings</h2>
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-line px-1.5 text-[11px] font-semibold text-muted">
                5
              </span>
            </div>
            <Link
              to="/admin/meetings"
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-3.5 space-y-4">
            {TODAY_MEETINGS.map((m) => (
              <div key={m.title} className="flex gap-3">
                <span
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                    m.icon,
                  )}
                >
                  <Icon name="hgi-video-01" size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{m.title}</p>
                  <p className="tnum mt-0.5 text-[12px] text-muted">{m.time}</p>
                  <p className="text-[12px] text-muted">{m.who}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/admin/meetings"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-dark"
          >
            <Icon name="hgi-add-01" size={15} />
            Schedule meeting
          </Link>
        </section>

        {/* Active events */}
        <section className="flex flex-col rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight">Active events</h2>
            <Link
              to="/admin/events"
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-4 flex flex-1 items-center gap-5">
            <div className="relative grid h-36 w-36 shrink-0 place-items-center sm:h-40 sm:w-40">
              <svg viewBox="0 0 42 42" className="h-full w-full">
                {donutArcs}
              </svg>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="tnum text-[30px] font-bold leading-none text-ink">4</p>
                  <p className="mt-1 text-[11px] text-muted">events</p>
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              {ACTIVE_EVENTS.map((p) => (
                <div key={p.name} className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="truncate text-[13.5px] text-ink">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Row 2: Upcoming Events · Alerts */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Upcoming Events */}
        <section className="rounded-2xl bg-surface p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight">Upcoming Events</h2>
            <Link
              to="/admin/events"
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
            {UPCOMING_EVENTS.map((e) => (
              <div key={e.title} className={cn('rounded-xl p-4', e.card)}>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <span
                      className={cn(
                        'grid h-8 w-8 place-items-center rounded-full text-[10px] font-semibold ring-2',
                        e.avatarA,
                        e.ring,
                      )}
                    >
                      {e.initials}
                    </span>
                    <span
                      className={cn(
                        'grid h-8 w-8 place-items-center rounded-full text-[10px] font-semibold ring-2',
                        e.avatarMore,
                        e.ring,
                      )}
                    >
                      {e.more}
                    </span>
                  </div>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-ink dark:bg-white/10">
                    {e.daysLeft}
                  </span>
                </div>
                <p className="mt-3 text-[14px] font-bold tracking-tight text-ink">{e.title}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted">Progress</span>
                    <span className="tnum font-semibold text-ink">{e.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                    <div
                      className={cn('h-full rounded-full', e.bar)}
                      style={{ width: `${e.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts */}
        <section className="rounded-2xl bg-surface p-4 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight">Alerts</h2>
            <Link
              to="/admin/notifications"
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-3.5 space-y-3.5">
            {ALERTS.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Icon
                  name={a.icon}
                  size={18}
                  className={cn('mt-0.5 shrink-0', a.iconColor)}
                />
                <p className="text-[13px] leading-snug text-ink">
                  {a.text}
                  <Link to={a.to} className="font-semibold text-brand hover:underline">
                    {a.link}
                  </Link>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Row 3: Website Templates */}
      <section className="mt-4 rounded-2xl bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold tracking-tight">Website Templates</h2>
          <Link
            to="/admin/landing-pages"
            className="text-[12px] font-semibold text-brand hover:underline"
          >
            See all
          </Link>
        </div>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <Link
              key={t.title}
              to="/admin/landing-pages"
              className="group rounded-xl bg-canvas p-4 transition hover:bg-line"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-md bg-line px-2 py-1 text-[11px] font-medium text-muted">
                  {t.tag}
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                  <Icon name="hgi-arrow-up-right-01" size={14} />
                </span>
              </div>
              <p className="mt-3 text-[14px] font-bold tracking-tight text-ink">{t.title}</p>
              <p className="mt-1 text-[12px] leading-snug text-muted">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-[11px] text-muted/70">
        Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
      </p>
    </>
  )
}
