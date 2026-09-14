import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useFetcher, useLoaderData, useRouteLoaderData } from 'react-router'
import {
  ButtonLink,
  EmptyState,
  HeaderUser,
  Icon,
  NoResults,
  PageFooter,
  PageHeader,
  PastEnd,
  PillTabs,
} from '@/components/ui'
import { ADMIN_ROUTE_ID, type ActionResult } from '@/app/loaders'
import { can } from '@/features/auth/permissions'
import type { Me } from '@/features/auth/types'
import { cn } from '@/lib/cn'
import { num } from '@/lib/format'
import { PAGE_SIZES, type PageWindow } from '@/lib/paging'
import type { ListEmptyReason } from '@/lib/urlFilters'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import { EventCalendar } from '../components/EventCalendar'
import { COVER, STATUS_PILL, eventDetailPath as detailPath } from '../events.presentation'
import { EVENT_SORTS, EVENT_TYPES, type EventsData } from '../events.routes'
import type { EventBucket, EventRow } from '../types'

/* admin/events.html — the organizer's event list, plus a month calendar.

   Filters, sort, paging and the chosen view live in the URL: the API pages and
   filters server-side, so the query string is what both the request and this
   page read. Nothing is re-filtered here — the "of 48 events" count comes from
   the same response as the rows, and so cannot disagree with them. */

const SORT_LABEL: Record<(typeof EVENT_SORTS)[number], string> = {
  registrations: 'Registrations high→low',
  name: 'Name A–Z',
  date: 'Date',
}

const ALL_TYPES = 'All types'

/** What the API's `q` accepts; longer and it answers 400 instead of a table. */
const MAX_SEARCH_LENGTH = 120

export default function EventsPage() {
  const data = useLoaderData() as EventsData
  // `view` picks which screen this is and `month` walks the calendar — neither
  // narrows the list, so neither counts as a filter. (`sort` and `limit` are
  // already non-narrowing everywhere.) The total is what lets an empty page 2
  // be called "past the end" only while rows really do exist further back.
  const { params, set, clear, filtered, emptyReason } = useFilters({
    ignore: ['view', 'month'],
    // The calendar has no pager, so it has no total and cannot run off an end.
    total: data.view === 'overview' ? data.window.total : undefined,
  })
  const filtering = useIsFiltering()
  const me = (useRouteLoaderData(ADMIN_ROUTE_ID) as { me: Me } | undefined)?.me ?? null

  const view = data.view
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  /* An empty table means several different things and only one of them is a
     first run. The Active/Completed badges are live counts for the *whole*
     workspace — not this page — so they are what says there is genuinely
     nothing yet, rather than a status tab or a search hiding it; `EmptyEvents`
     below sorts out the rest. The calendar answers with one month, which can be
     empty in a busy workspace, so it never claims a first run. */
  const firstRun =
    data.view === 'overview' &&
    !filtered &&
    data.summary.active === 0 &&
    data.summary.completed === 0

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Create and manage your events."
        actions={
          <>
            {can(me, 'evCreate') && (
              <ButtonLink to="/admin/event-form" variant="primary" className="shrink-0">
                <Icon name="hgi-calendar-add-01" />
                <span className="hidden sm:inline">New event</span>
                <span className="sm:hidden">New</span>
              </ButtonLink>
            )}
            <HeaderUser />
          </>
        }
      />

      {firstRun ? (
        /* Nothing to filter, so the tabs, search and table go too — what is
           left is the one step that fills this page. */
        <EmptyState
          className="card"
          icon="hgi-calendar-03"
          title="No events yet"
          actions={[
            ...(can(me, 'evCreate')
              ? [
                  {
                    label: 'Create your first event',
                    to: '/admin/event-form',
                    icon: 'hgi-calendar-add-01',
                  },
                ]
              : []),
            { label: 'Browse page designs', to: '/admin/landing-pages' },
          ]}
        >
          Create your first event to start selling tickets. You can save it as a draft, add tickets
          and a programme, then publish when it&apos;s ready.
        </EmptyState>
      ) : (
        <>
          {/* view tabs + status filter */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 rounded-xl bg-surface p-1">
              <ViewTab
                label="Overview"
                active={view === 'overview'}
                onClick={() => set({ view: null })}
              />
              <ViewTab
                label="Calendar"
                active={view === 'calendar'}
                onClick={() => set({ view: 'calendar' })}
              />
            </div>
            {data.view === 'overview' && (
              <PillTabs<EventBucket>
                items={[
                  { value: 'active', label: 'Active', count: data.summary.active },
                  { value: 'completed', label: 'Completed', count: data.summary.completed },
                ]}
                value={(params.get('bucket') as EventBucket) ?? 'active'}
                onChange={(bucket) => set({ bucket: bucket === 'active' ? null : bucket })}
              />
            )}
          </div>

          {data.view === 'calendar' ? (
            <div className={cn(filtering && 'opacity-60 transition-opacity')}>
              <EventCalendar
                month={data.month}
                events={data.events}
                count={data.count}
                onMonth={(month) => set({ month })}
              />
            </div>
          ) : (
            <div className={cn(filtering && 'opacity-60 transition-opacity')}>
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
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
                    placeholder="Search events…"
                    maxLength={MAX_SEARCH_LENGTH}
                    aria-label="Search events"
                  />
                </div>
                <select
                  value={params.get('sort') ?? 'registrations'}
                  onChange={(e) => set({ sort: e.target.value })}
                  className="select h-10 w-full border-0 bg-surface font-medium sm:w-52"
                  aria-label="Sort by"
                >
                  {EVENT_SORTS.map((sort) => (
                    <option key={sort} value={sort}>
                      {SORT_LABEL[sort]}
                    </option>
                  ))}
                </select>
                <select
                  value={params.get('type') ?? ALL_TYPES}
                  onChange={(e) =>
                    set({ type: e.target.value === ALL_TYPES ? null : e.target.value })
                  }
                  className="select h-10 w-full border-0 bg-surface font-medium sm:w-44"
                  aria-label="Event type"
                >
                  <option value={ALL_TYPES}>{ALL_TYPES}</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <EventsTable
                rows={data.rows}
                range={data.window}
                canDuplicate={can(me, 'evCreate')}
                canDelete={can(me, 'evPublish')}
                onPage={(page) => set({ page })}
                onSize={(limit) => set({ limit })}
                empty={
                  <EmptyEvents
                    reason={emptyReason}
                    completed={data.summary.completed}
                    canCreate={can(me, 'evCreate')}
                    onClear={clear}
                    onCompleted={() => set({ bucket: 'completed' })}
                  />
                }
              />
            </div>
          )}
        </>
      )}

      <PageFooter />
    </>
  )
}

function ViewTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-lg px-4 py-2 text-[13px] font-semibold transition',
        active ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink',
      )}
    >
      {label}
    </button>
  )
}

/**
 * The three ways this table comes back empty, which need three different
 * answers — see `emptyListReason`.
 *
 * The last one is the one worth spelling out. The Active pill writes no
 * `bucket` parameter, so a workspace whose events have all finished or been
 * cancelled arrives here with nothing narrowing the list at all: "Clear
 * filters" would navigate to the URL already on screen and change nothing. The
 * Completed badge counts the whole workspace, so it is the proof that those
 * events are still there, one tab away. (Both badges reading zero never gets
 * this far — the page-level first-run block takes the whole screen instead.)
 */
function EmptyEvents({
  reason,
  completed,
  canCreate,
  onClear,
  onCompleted,
}: {
  reason: ListEmptyReason
  completed: number
  canCreate: boolean
  onClear: () => void
  onCompleted: () => void
}) {
  if (reason === 'past-end') return <PastEnd noun="events" onFirstPage={onClear} />

  if (reason === 'no-results') {
    return (
      <NoResults noun="events" onClear={onClear}>
        Nothing matches the current search, status tab and event type. Try a shorter search term, or
        widen the filters.
      </NoResults>
    )
  }

  return (
    <EmptyState
      compact
      icon="hgi-calendar-check-out-01"
      title="No active events"
      actions={[
        {
          label: `View completed (${num(completed)})`,
          onClick: onCompleted,
          icon: 'hgi-arrow-right-01',
        },
        ...(canCreate
          ? [{ label: 'Create an event', to: '/admin/event-form', icon: 'hgi-calendar-add-01' }]
          : []),
      ]}
    >
      Nothing is on sale or coming up — every event in this workspace has already finished or been
      cancelled. They are on the Completed tab.
    </EmptyState>
  )
}

function EventsTable({
  rows,
  range,
  canDuplicate,
  canDelete,
  onPage,
  onSize,
  empty,
}: {
  rows: EventRow[]
  range: PageWindow
  canDuplicate: boolean
  canDelete: boolean
  onPage: (page: number) => void
  onSize: (size: number) => void
  /** What stands in for the rows — the page decides which of the three it is. */
  empty: ReactNode
}) {
  const menu = useRowMenu()

  return (
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
            {rows.length ? (
              rows.map((row) => <EventTableRow key={row.id} r={row} onKebab={menu.open} />)
            ) : (
              /* The tabs and filters stay on screen — whichever of them is
                 responsible is what has to change. */
              <tr>
                <td colSpan={5}>{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PageNumbers range={range} onPage={onPage} onSize={onSize} />

      {menu.row && (
        <RowMenu
          row={menu.row}
          canDuplicate={canDuplicate}
          canDelete={canDelete}
          position={menu.position}
          menuRef={menu.ref}
          onClose={menu.close}
        />
      )}
    </section>
  )
}

/** The kit's fixed popover, positioned against the button that opened it. */
function useRowMenu() {
  const [open, setOpen] = useState<{ row: EventRow; rect: DOMRect } | null>(null)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const ref = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const el = ref.current
    const r = open.rect
    let left = r.right - el.offsetWidth
    let top = r.bottom + 6
    if (left < 8) left = 8
    if (top + el.offsetHeight > window.innerHeight - 8) top = r.top - el.offsetHeight - 6
    setPosition({ left, top })
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(null)
    const onDocClick = (ev: MouseEvent) => {
      if (ref.current?.contains(ev.target as Node)) return
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
  }, [open])

  const close = useCallback(() => setOpen(null), [])

  return {
    row: open?.row ?? null,
    position,
    ref,
    close,
    open: (e: React.MouseEvent<HTMLButtonElement>, row: EventRow) => {
      e.stopPropagation()
      setOpen({ row, rect: e.currentTarget.getBoundingClientRect() })
    },
  }
}

const MENU_ITEM =
  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink transition hover:bg-line'

function RowMenu({
  row,
  canDuplicate,
  canDelete,
  position,
  menuRef,
  onClose,
}: {
  row: EventRow
  canDuplicate: boolean
  canDelete: boolean
  position: { left: number; top: number }
  menuRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
}) {
  const fetcher = useFetcher<ActionResult>()
  const refusal = fetcher.data?.error
  const busy = fetcher.state !== 'idle'

  // The row is gone once the delete lands, so the popover pointing at it goes
  // too. A refusal keeps it open, with the reason under the button.
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.ok) onClose()
  }, [fetcher.state, fetcher.data, onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-56 rounded-xl border border-hair bg-surface p-1.5 shadow-xl"
      style={{ left: position.left, top: position.top }}
    >
      <Link to={detailPath(row.id)} onClick={onClose} className={MENU_ITEM}>
        <Icon name="hgi-view" size={15} className="text-muted" />
        View details
      </Link>
      <Link to={`/admin/event-form?id=${row.id}`} onClick={onClose} className={MENU_ITEM}>
        <Icon name="hgi-edit-02" size={15} className="text-muted" />
        Edit
      </Link>
      {canDuplicate && (
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="duplicate" />
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" disabled={busy} className={cn(MENU_ITEM, 'disabled:opacity-60')}>
            <Icon name="hgi-copy-01" size={15} className="text-muted" />
            {busy ? 'Working…' : 'Duplicate'}
          </button>
        </fetcher.Form>
      )}
      {canDelete && (
        <>
          <div className="my-1 h-px bg-line" />
          <fetcher.Form method="post">
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="version" value={row.version} />
            <button
              type="submit"
              disabled={busy}
              className={cn(
                MENU_ITEM,
                'text-red-500 hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-500/15',
              )}
            >
              <Icon name="hgi-delete-02" size={15} />
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </fetcher.Form>
        </>
      )}
      {/* The API decides what may be done and writes the refusal for the person
          reading it — a published event has to be cancelled so that attendees
          are refunded and told. Shown verbatim. */}
      {refusal && (
        <p role="alert" className="px-2.5 py-2 text-[12px] leading-snug text-red-500">
          {refusal}
        </p>
      )}
    </div>
  )
}

function EventTableRow({
  r,
  onKebab,
}: {
  r: EventRow
  onKebab: (e: React.MouseEvent<HTMLButtonElement>, row: EventRow) => void
}) {
  return (
    <tr className="border-t border-line align-middle transition hover:bg-line/40">
      <td className="py-4 pr-4">
        {/* A real link, not a click handler on the row. An anchor is reachable
            by keyboard, opens in a new tab on middle-click, and shows its
            destination on hover — none of which a clickable <tr> does, and it
            leaves the kebab beside it clickable without a stopPropagation
            dance. The whole cell is the target, so it is easy to hit. */}
        <Link
          to={detailPath(r.id)}
          className="group flex items-center gap-3.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span
            className={cn(
              'relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-white shadow-sm',
              COVER[r.tone],
            )}
          >
            {/* The type icon on its tint is the fallback, already underneath.
                No cover, no photograph: this used to seed picsum from the slug,
                which put a stranger's event beside a real one. */}
            <Icon name={r.icon} size={22} />
            {r.cover && (
              <img
                src={r.cover}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-bold tracking-tight text-ink group-hover:underline">
              {r.name}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-muted">{r.type}</p>
          </div>
        </Link>
      </td>
      <td className="py-4 pr-4 whitespace-nowrap text-[13px] text-muted tnum">{r.date}</td>
      <td className="py-4 pr-4">
        <div className="w-36 max-w-full">
          <div className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="font-bold text-ink tnum">{r.registrations}</span>
            <span className="text-muted tnum">{r.fillPercent}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand" style={{ width: `${r.fillPercent}%` }} />
          </div>
        </div>
      </td>
      <td className="py-4 pr-4">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium',
            STATUS_PILL[r.status].cls,
          )}
        >
          <Icon name={STATUS_PILL[r.status].icon} size={12} />
          {r.status}
        </span>
      </td>
      <td className="py-4">
        <button
          type="button"
          onClick={(e) => onKebab(e, r)}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
          title="More actions"
        >
          <Icon name="hgi-more-vertical" size={19} />
        </button>
      </td>
    </tr>
  )
}

function PageNumbers({
  range,
  onPage,
  onSize,
}: {
  range: PageWindow
  onPage: (page: number) => void
  onSize: (size: number) => void
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
      <p>
        {range.total === 0 ? (
          'No events'
        ) : (
          <>
            Showing{' '}
            <span className="font-semibold text-ink">
              {range.from}–{range.to}
            </span>{' '}
            of <span className="font-semibold text-ink tnum">{num(range.total)}</span> events
          </>
        )}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 whitespace-nowrap">
          Rows per page
          <select
            value={range.size}
            onChange={(e) => onSize(Number(e.target.value))}
            className="select h-8 w-auto min-w-[3.75rem] py-0 pl-2.5 pr-7 text-[12px] font-medium text-ink"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-label="Previous page"
            disabled={range.page <= 1}
            onClick={() => onPage(range.page - 1)}
          >
            <Icon name="hgi-arrow-left-01" size={14} />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-label="Next page"
            disabled={range.page >= range.pageCount}
            onClick={() => onPage(range.page + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <Icon name="hgi-arrow-right-01" size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
