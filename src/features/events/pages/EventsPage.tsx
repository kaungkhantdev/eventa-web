import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ButtonLink,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  PillTabs,
  usePagination,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { num } from '@/lib/format'
import type { EventBucket } from '../types'
import { COVER, EVENT_TYPES, EVENTS, STATUS_PILL, type EventRow } from '../data/events'
import { EventCalendar } from '../components/EventCalendar'

type ViewKey = 'overview' | 'calendar'
type SortKey = 'reg' | 'name' | 'date'

const regCount = (r: EventRow): number => parseInt(r.tasks.split('/')[0], 10) || 0

const seedFrom = (name: string): string => name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()

/* Static bucket badges are computed once from the source data (like the kit,
   which never recomputes them after a delete/duplicate). */
const ACTIVE_COUNT = EVENTS.filter((e) => e.bucket === 'active').length
const COMPLETED_COUNT = EVENTS.filter((e) => e.bucket === 'completed').length

export default function EventsPage() {
  const [view, setView] = useState<ViewKey>('overview')
  const [bucket, setBucket] = useState<EventBucket>('active')
  const [q, setQ] = useState('')
  const [type, setType] = useState('All types')
  const [sort, setSort] = useState<SortKey>('reg')
  const [events, setEvents] = useState<EventRow[]>(EVENTS)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = events
      .filter((e) => e.bucket === bucket)
      .filter((e) => type === 'All types' || e.type === type)
      .filter((e) => !query || e.name.toLowerCase().includes(query))
    if (sort === 'reg') list = [...list].sort((a, b) => regCount(b) - regCount(a))
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'date') list = [...list].sort((a, b) => +new Date(a.date) - +new Date(b.date))
    return list
  }, [events, bucket, type, q, sort])

  const pager = usePagination(filtered, 10)
  const resetPage = () => pager.setPage(1)

  /* ---------- row actions menu (⋮), positioned like the kit's fixed popover ---------- */
  const [menu, setMenu] = useState<{ id: string; rect: DOMRect } | null>(null)
  const [pos, setPos] = useState({ left: 0, top: 0 })
  const menuRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return
    const el = menuRef.current
    const r = menu.rect
    let left = r.right - el.offsetWidth
    let top = r.bottom + 6
    if (left < 8) left = 8
    if (top + el.offsetHeight > window.innerHeight - 8) top = r.top - el.offsetHeight - 6
    setPos({ left, top })
  }, [menu])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onDocClick = (ev: MouseEvent) => {
      if (menuRef.current?.contains(ev.target as Node)) return
      close()
    }
    document.addEventListener('click', onDocClick)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('click', onDocClick)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation()
    setMenu({ id, rect: e.currentTarget.getBoundingClientRect() })
  }
  const duplicate = (id: string) =>
    setEvents((list) => {
      const i = list.findIndex((e) => e.id === id)
      if (i < 0) return list
      const next = list.slice()
      next.splice(i + 1, 0, { ...list[i], id: `${list[i].id}-copy-${Date.now()}` })
      return next
    })
  const remove = (id: string) => setEvents((list) => list.filter((e) => e.id !== id))

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Create and manage your events."
        actions={
          <>
            <ButtonLink to="/admin/event-form" variant="primary" className="shrink-0">
              <Icon name="hgi-calendar-add-01" />
              <span className="hidden sm:inline">New event</span>
              <span className="sm:hidden">New</span>
            </ButtonLink>
            <HeaderUser />
          </>
        }
      />

      {/* view tabs + status filter */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl bg-surface p-1">
          <button
            type="button"
            onClick={() => setView('overview')}
            className={cn(
              'rounded-lg px-4 py-2 text-[13px] font-semibold transition',
              view === 'overview' ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink',
            )}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={cn(
              'rounded-lg px-4 py-2 text-[13px] font-semibold transition',
              view === 'calendar' ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink',
            )}
          >
            Calendar
          </button>
        </div>
        <PillTabs<EventBucket>
          items={[
            { value: 'active', label: 'Active', count: ACTIVE_COUNT },
            { value: 'completed', label: 'Completed', count: COMPLETED_COUNT },
          ]}
          value={bucket}
          onChange={(v) => {
            setBucket(v)
            resetPage()
          }}
          className={cn(view !== 'overview' && 'hidden')}
        />
      </div>

      {/* ============ OVERVIEW ============ */}
      <div className={cn(view !== 'overview' && 'hidden')}>
        {/* search + filters (out of table) */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full flex-1">
            <Icon
              name="hgi-search-01"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                resetPage()
              }}
              className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
              placeholder="Search events…"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey)
              resetPage()
            }}
            className="select h-10 w-full border-0 bg-surface font-medium sm:w-52"
            aria-label="Sort by"
          >
            <option value="reg">Registrations high→low</option>
            <option value="name">Name A–Z</option>
            <option value="date">Date</option>
          </select>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              resetPage()
            }}
            className="select h-10 w-full border-0 bg-surface font-medium sm:w-44"
            aria-label="Event type"
          >
            <option value="All types">All types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* events table */}
        <section className="card mt-3 scroll-mt-4 p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-3 pr-4 font-semibold">Event</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 pr-4 font-semibold">Registrations</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="w-10 pb-3"></th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {pager.slice.length ? (
                  pager.slice.map((r) => <EventTableRow key={r.id} r={r} onKebab={openMenu} />)
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-10 text-center text-[13px] text-muted">No events match.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
            <p>
              {pager.total === 0 ? (
                'No events'
              ) : (
                <>
                  Showing{' '}
                  <span className="font-semibold text-ink">
                    {pager.from}–{pager.to}
                  </span>{' '}
                  of <span className="font-semibold text-ink tnum">{num(pager.total)}</span> events
                </>
              )}
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 whitespace-nowrap">
                Rows per page
                <select
                  value={pager.size}
                  onChange={(e) => pager.setSize(Number(e.target.value))}
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
                  disabled={pager.page <= 1}
                  onClick={() => pager.setPage(pager.page - 1)}
                >
                  <Icon name="hgi-arrow-left-01" size={14} />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  aria-label="Next page"
                  disabled={pager.page >= pager.pageCount}
                  onClick={() => pager.setPage(pager.page + 1)}
                >
                  <span className="hidden sm:inline">Next</span>
                  <Icon name="hgi-arrow-right-01" size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============ CALENDAR ============ */}
      <div className={cn(view !== 'calendar' && 'hidden')}>
        <EventCalendar />
      </div>

      {/* shared row-actions menu (fixed so overflow-x-auto can't clip it) */}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 w-44 rounded-xl border border-hair bg-surface p-1.5 shadow-xl"
          style={{ left: pos.left, top: pos.top }}
        >
          <Link
            to="/admin/event-detail"
            onClick={() => setMenu(null)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink transition hover:bg-line"
          >
            <Icon name="hgi-view" size={15} className="text-muted" />
            View details
          </Link>
          <Link
            to="/admin/event-form"
            onClick={() => setMenu(null)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink transition hover:bg-line"
          >
            <Icon name="hgi-edit-02" size={15} className="text-muted" />
            Edit
          </Link>
          <button
            type="button"
            onClick={() => {
              duplicate(menu.id)
              setMenu(null)
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink transition hover:bg-line"
          >
            <Icon name="hgi-copy-01" size={15} className="text-muted" />
            Duplicate
          </button>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            onClick={() => {
              remove(menu.id)
              setMenu(null)
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/15"
          >
            <Icon name="hgi-delete-02" size={15} />
            Delete
          </button>
        </div>
      )}

      <PageFooter />
    </>
  )
}

function EventTableRow({
  r,
  onKebab,
}: {
  r: EventRow
  onKebab: (e: React.MouseEvent<HTMLButtonElement>, id: string) => void
}) {
  const [done, total] = r.tasks.split('/')
  const pct = total ? Math.round((parseInt(done, 10) / parseInt(total, 10)) * 100) : 0
  return (
    <tr className="border-t border-line align-middle transition hover:bg-line/40">
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3.5">
          <span
            className={cn(
              'relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-white shadow-sm',
              COVER[r.tone],
            )}
          >
            <Icon name={r.icon} size={22} />
            <img
              src={`https://picsum.photos/seed/${seedFrom(r.name)}/96/96`}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-bold tracking-tight text-ink">{r.name}</p>
            <p className="mt-0.5 truncate text-[12px] text-muted">{r.type}</p>
          </div>
        </div>
      </td>
      <td className="py-4 pr-4 whitespace-nowrap text-[13px] text-muted tnum">{r.date}</td>
      <td className="py-4 pr-4">
        <div className="w-36 max-w-full">
          <div className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="font-bold text-ink tnum">{r.tasks}</span>
            <span className="text-muted tnum">{pct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </td>
      <td className="py-4 pr-4">
        <span
          className={cn('inline-block rounded-full px-3 py-1 text-[12px] font-medium', STATUS_PILL[r.status])}
        >
          {r.status}
        </span>
      </td>
      <td className="py-4">
        <button
          type="button"
          onClick={(e) => onKebab(e, r.id)}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
          title="More actions"
        >
          <Icon name="hgi-more-vertical" size={19} />
        </button>
      </td>
    </tr>
  )
}
