import { useEffect, useRef, useState } from 'react'
import { Link, useFetcher, useLoaderData, useOutletContext } from 'react-router'
import {
  EmptyState,
  NoResults,
  NotificationBell,
  PastEnd,
  SignedInChip,
  VenueMap,
} from '@/components/ui'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import type { ActionResult } from '@/app/loaders'
import { cn } from '@/lib/cn'
import { num } from '@/lib/format'
import { PAGE_SIZES, type PageWindow } from '@/lib/paging'
import type { ListEmptyReason } from '@/lib/urlFilters'
import { useFilters } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import {
  endOf,
  withSeconds,
  type AgendaDay,
  type AttendeeRow,
  type AvatarTone,
  type EventHeader,
  type OverviewTiles,
  type RegistrationRow,
  type SpeakerCard,
  type TicketRow,
} from '../eventDetail.mapper'
import {
  EVENT_TABS,
  REGISTRATION_FILTERS,
  type EventDetailData,
  type EventTab,
  type RegistrationFilter,
} from '../eventDetail.routes'
import { LANDING_TEMPLATES } from '../landingTemplates'
import { STATUS_PILL } from '../events.presentation'

/* ---------- Event detail — admin/event-detail.html ----------
   Pill tabs switch between Overview, Registrations (filter + paging),
   Attendees, Speakers, Agenda and Tickets. A share modal renders a
   self-contained SVG flyer with a QR code and exports it to PNG.

   Which event and which tab are both in the URL, and only the open tab is
   fetched — the six panels ask different questions of different tables, and a
   visit that shows one should not pay for six. */

const TAB_LABEL: Record<EventTab, string> = {
  overview: 'Overview',
  registrations: 'Registrations',
  attendees: 'Attendees',
  speakers: 'Speakers',
  agenda: 'Agenda',
  tickets: 'Tickets',
}

const FILTER_LABEL: Record<RegistrationFilter, string> = {
  all: 'All',
  paid: 'Paid',
  pending: 'Pending',
  refunded: 'Refunded',
}

/** Payment status → pill classes, copied from the kit. */
const PAYMENT_PILL: Record<string, string> = {
  Paid: 'bg-brand-soft text-brand-dark dark:text-brand',
  Pending: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  Refunded: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

/** tone → avatar chip classes (light + dark). */
const TONE: Record<AvatarTone, string> = {
  brand: 'bg-brand-soft text-brand-dark dark:text-brand',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
}

/** Session type → the avatar tone its agenda pill borrows. */
const SESSION_TONE: Record<string, AvatarTone> = {
  Keynote: 'brand',
  Talk: 'blue',
  Workshop: 'violet',
  Panel: 'amber',
  Break: 'brand',
}

const SESSION_TYPES = ['Keynote', 'Talk', 'Workshop', 'Panel', 'Break']

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

function ToneAvatar({
  initials,
  tone,
  size = 'h-8 w-8',
}: {
  initials: string
  tone: AvatarTone
  size?: string
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full text-[11px] font-bold',
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
  const data = useLoaderData() as EventDetailData
  // `id` says which event this is and `tab` which panel is open — both are page
  // state, not a narrowing the organizer chose. Only `status` and `page` filter.
  const { set, clear, filtered, emptyReason } = useFilters({ ignore: ['id', 'tab'] })
  const fetcher = useFetcher<ActionResult>()

  const [sessionOpen, setSessionOpen] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const { header, overview } = data
  const publicUrl = overview.publicUrl

  /** Open a tab. The payment filter goes with it — it means nothing on the agenda. */
  const goTab = (tab: EventTab) => set({ tab: tab === 'overview' ? null : tab, status: null })

  return (
    <>
      {/* top controls */}
      <div className="mb-3 flex items-center gap-2">
        <button
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
            to={`/admin/event-form?id=${header.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3.5 py-2 text-[13px] font-semibold text-brand transition hover:brightness-95"
          >
            <i className="hgi-stroke hgi-edit-02 text-[15px]" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <a
            href={publicUrl}
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
          <NotificationBell />
          <SignedInChip />
        </div>
      </div>

      {/* hero cover */}
      <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-emerald-500">
        <img
          src={`https://picsum.photos/seed/${header.seed}/1280/440`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => e.currentTarget.remove()}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div className="relative flex min-h-[190px] flex-col justify-end p-5 sm:min-h-[230px] sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-[24px] font-extrabold tracking-tight text-white sm:text-[30px]">
              {header.name}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
              <i className="hgi-stroke hgi-checkmark-circle-02 text-[12px]" />
              {header.status}
            </span>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-white/85">
            <span>{header.when}</span>
            {header.where && (
              <>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                <span>{header.where}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* tabs */}
      <div className="mb-5 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-surface p-1">
        {EVENT_TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => goTab(id)}
            aria-pressed={id === data.tab}
            className={cn(
              'rounded-lg px-3.5 py-2 text-[13px] font-semibold transition',
              id === data.tab ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink',
            )}
          >
            {TAB_LABEL[id]}
          </button>
        ))}
      </div>

      {fetcher.data?.error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
        >
          {fetcher.data.error}
        </p>
      )}

      <TabPanels
        data={data}
        filtered={filtered}
        emptyReason={emptyReason}
        onPage={(page) => set({ page })}
        onSize={(limit) => set({ limit })}
        onFilter={(status) => set({ status: status === 'all' ? null : status })}
        onClear={clear}
        onTab={goTab}
        onAddSession={() => setSessionOpen(true)}
        onAddTicket={() => setTicketOpen(true)}
        onRemoveSession={(sessionId) =>
          fetcher.submit({ intent: 'remove-session', sessionId }, { method: 'post' })
        }
      />

      <p className="mt-4 text-center text-[11px] text-muted/70">
        Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
      </p>

      <SessionPanel
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        onAdd={(values) => fetcher.submit({ intent: 'add-session', ...values }, { method: 'post' })}
      />
      <TicketPanel
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        onAdd={(values) => fetcher.submit({ intent: 'add-ticket', ...values }, { method: 'post' })}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        event={{ title: header.name, when: header.when, where: header.where, url: publicUrl, seed: header.seed }}
      />
    </>
  )
}

/** Renders whichever tab the URL asked for — the loader fetched only that one. */
function TabPanels({
  data,
  filtered,
  emptyReason,
  onPage,
  onSize,
  onFilter,
  onClear,
  onTab,
  onAddSession,
  onAddTicket,
  onRemoveSession,
}: {
  data: EventDetailData
  filtered: boolean
  emptyReason: ListEmptyReason
  onPage: (page: number) => void
  onSize: (size: number) => void
  onFilter: (status: RegistrationFilter) => void
  onClear: () => void
  onTab: (tab: EventTab) => void
  onAddSession: () => void
  onAddTicket: () => void
  onRemoveSession: (sessionId: string) => void
}) {
  const busy = useIsFiltering()
  const dim = busy ? 'opacity-60 transition-opacity' : undefined

  if (data.tab === 'registrations') {
    return (
      <div className={dim}>
        <RegistrationsPanel
          rows={data.rows}
          range={data.window}
          counts={data.counts}
          filter={data.filter}
          filtered={filtered}
          emptyReason={emptyReason}
          event={data.header}
          onFilter={onFilter}
          onClear={onClear}
          onTab={onTab}
          onPage={onPage}
          onSize={onSize}
        />
      </div>
    )
  }
  if (data.tab === 'attendees') {
    return (
      <div className={dim}>
        <AttendeesPanel
          rows={data.attendees}
          range={data.window}
          onTab={onTab}
          onPage={onPage}
        />
      </div>
    )
  }
  if (data.tab === 'speakers') {
    return (
      <div className={dim}>
        <SpeakersPanel speakers={data.speakers} eventId={data.header.id} onTab={onTab} />
      </div>
    )
  }
  if (data.tab === 'agenda') {
    return (
      <div className={dim}>
        <AgendaPanel
          days={data.days}
          eventId={data.header.id}
          onAdd={onAddSession}
          onRemove={onRemoveSession}
        />
      </div>
    )
  }
  if (data.tab === 'tickets') {
    return (
      <div className={dim}>
        <TicketsPanel tickets={data.tickets} onAdd={onAddTicket} />
      </div>
    )
  }
  return (
    <div className={cn('space-y-4', dim)}>
      <OverviewPanel header={data.header} overview={data.overview} />
    </div>
  )
}

/* ---------- Overview ---------- */
function OverviewPanel({ header, overview }: { header: EventHeader; overview: OverviewTiles }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(overview.publicUrl)
    } catch {
      /* the browser refused the clipboard — the link is on screen to copy by hand */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const [sold, capacity] = overview.registrations.split('/')

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
              {sold}
              {capacity && <span className="text-[13px] font-semibold text-muted">/{capacity}</span>}
            </p>
            <span className="text-[11px] font-semibold text-brand">{overview.fillPercent}%</span>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-wallet-01 text-[16px]" />
            Revenue
          </div>
          <div className="mt-2 flex items-end justify-between">
            {/* A dash here means "you may not see this", not "nothing was taken". */}
            <p className="text-[22px] font-bold tracking-tight tnum">{overview.revenue}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-ticket-01 text-[16px]" />
            Tickets sold
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">{num(overview.ticketsSold)}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-calendar-03 text-[16px]" />
            Days left
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">{overview.daysLeft}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {/* Landing page */}
          <section className="rounded-2xl bg-surface p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold tracking-tight">Landing page</h2>
              <span className={cn('badge', STATUS_PILL[header.status])}>{header.status}</span>
            </div>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
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
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-ink">{LANDING_TEMPLATES[0]!.title}</p>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                    {LANDING_TEMPLATES[0]!.badge}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-snug text-muted">
                  {LANDING_TEMPLATES[0]!.description}
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-canvas px-3 py-2">
                  <i className="hgi-stroke hgi-link-01 text-[14px] shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-muted">
                    {overview.publicUrl}
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
                    href={overview.publicUrl}
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
        </div>

        {/* details */}
        <section className="rounded-2xl bg-surface p-4 lg:p-5 xl:col-span-1">
          <h2 className="text-[16px] font-bold tracking-tight">Details</h2>
          <div className="mt-3 space-y-3 text-[13px]">
            <div className="flex items-start gap-2.5">
              <i className="hgi-stroke hgi-calendar-03 text-[16px] mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-semibold text-ink">{header.when}</p>
                <p className="text-[12px] text-muted">Asia/Bangkok · GMT+7</p>
              </div>
            </div>
            {header.where && (
              <div className="flex items-start gap-2.5 border-t border-line pt-3">
                <i className="hgi-stroke hgi-location-01 text-[16px] mt-0.5 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{header.where}</p>
                  {header.venue && <VenueMap venue={header.venue} className="mt-2.5" />}
                </div>
              </div>
            )}
            <div className="flex items-start gap-2.5 border-t border-line pt-3">
              <i className="hgi-stroke hgi-user-multiple text-[16px] mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-semibold text-ink">{overview.registrations} registered</p>
                <p className="text-[12px] text-muted">{overview.fillPercent}% full</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

/* ---------- Registrations ---------- */
function RegistrationsPanel({
  rows,
  range,
  counts,
  filter,
  filtered,
  emptyReason,
  event,
  onFilter,
  onClear,
  onTab,
  onPage,
  onSize,
}: {
  rows: RegistrationRow[]
  range: PageWindow
  counts: { all: number; paid: number; pending: number; refunded: number }
  filter: RegistrationFilter
  filtered: boolean
  emptyReason: ListEmptyReason
  event: EventHeader
  onFilter: (status: RegistrationFilter) => void
  onClear: () => void
  onTab: (tab: EventTab) => void
  onPage: (page: number) => void
  onSize: (size: number) => void
}) {
  /* Nobody has registered for this event at all — `statusCounts.all` counts the
     whole event, not the page. The payment pills, the table and the pager would
     be controls over an empty set, so they go and the panel says what fills it.
     A filter in the URL still wins: it may be hiding rows, and offering
     onboarding to someone who filtered is telling the wrong person to start. */
  const firstRun = counts.all === 0 && !filtered
  /* Why it is empty depends on the event: a draft cannot be registered for at
     all, while a published one is simply waiting. Only `Draft` is unpublished —
     `planned`/`upcoming`/`live` are the API's public statuses. */
  const draft = event.status === 'Draft'

  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold tracking-tight">Registrations</h2>
          {!firstRun && (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
              {num(counts.all)} total
            </span>
          )}
        </div>
        {!firstRun && (
          <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-canvas p-1">
            {REGISTRATION_FILTERS.map((f) => {
              const on = f === filter
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => onFilter(f)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition',
                    on ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink',
                  )}
                >
                  {FILTER_LABEL[f]}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] tnum',
                      on ? 'bg-brand/15 text-brand' : 'bg-line text-muted',
                    )}
                  >
                    {counts[f]}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {firstRun ? (
        <EmptyState
          icon="hgi-ticket-01"
          actions={
            draft
              ? [
                  {
                    label: 'Finish setup and publish',
                    to: `/admin/event-form?id=${encodeURIComponent(event.id)}`,
                    icon: 'hgi-rocket-01',
                  },
                  { label: 'Set up ticket types', onClick: () => onTab('tickets') },
                ]
              : [
                  {
                    label: 'Check your ticket types',
                    onClick: () => onTab('tickets'),
                    icon: 'hgi-ticket-01',
                  },
                  { label: 'See all registrations', to: '/admin/registrations' },
                ]
          }
        >
          {draft
            ? `A registration is created the moment someone claims a ticket. This event is still a
               draft, so nobody can register yet — publish it with a ticket type on sale.`
            : `Nobody has claimed a ticket for this event yet. Each registration lands here as it
               happens, with the tickets it covers and what was paid.`}
        </EmptyState>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-3 pr-3 font-semibold">Attendee</th>
                  <th className="pb-3 pr-3 font-semibold">Tickets</th>
                  <th className="pb-3 pr-3 font-semibold">Amount</th>
                  <th className="pb-3 pr-3 font-semibold">Registered</th>
                  <th className="pb-3 pr-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      {/* Registrations exist for the event, so either a filter is
                          hiding them or the page number ran off the end — and only
                          one of those has "Clear filters" as its way out.
                          `range.total` is the count for *these* filters, so it is
                          what proves there are rows further back to go to; without
                          it a filtered-to-nothing page 2 would be told to start
                          from the beginning of a list that has no rows at all. */}
                      {emptyReason === 'past-end' && range.total > 0 ? (
                        <PastEnd noun="registrations" onFirstPage={() => onPage(1)} />
                      ) : (
                        <NoResults noun="registrations" onClear={onClear} />
                      )}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.reference} className="border-t border-line transition hover:bg-line/50">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <ToneAvatar initials={r.initials} tone={r.tone} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                            {/* The reference, not an email — this endpoint sends none. */}
                            <p className="truncate text-[11px] text-muted tnum">{r.reference}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-[13px] text-muted tnum">{r.tickets}</td>
                      <td className="py-2.5 pr-3 text-[13px] font-semibold text-ink tnum">{r.amount}</td>
                      <td className="py-2.5 pr-3 text-[13px] text-muted tnum">
                        {r.date} · {r.time}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-medium',
                            PAYMENT_PILL[r.status] ?? 'bg-canvas text-muted',
                          )}
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

          <TabPager range={range} noun="registrations" onPage={onPage} onSize={onSize} />
        </>
      )}
    </section>
  )
}

/** The "showing X–Y of Z" line the workspace's paged tabs share. */
function TabPager({
  range,
  noun,
  onPage,
  onSize,
}: {
  range: PageWindow
  noun: string
  onPage: (page: number) => void
  onSize?: (size: number) => void
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
      <p>
        {range.total === 0 ? (
          `No ${noun}`
        ) : (
          <>
            Showing{' '}
            <span className="font-semibold text-ink">
              {range.from}–{range.to}
            </span>{' '}
            of <span className="font-semibold text-ink tnum">{num(range.total)}</span> {noun}
          </>
        )}
      </p>
      <div className="flex items-center gap-3">
        {onSize && (
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
        )}
        <div className="flex gap-1">
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-label="Previous page"
            disabled={range.page <= 1}
            onClick={() => onPage(range.page - 1)}
          >
            <i className="hgi-stroke hgi-arrow-left-01 text-[14px]" />
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
            <i className="hgi-stroke hgi-arrow-right-01 text-[14px]" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Attendees ---------- */
function AttendeesPanel({
  rows,
  range,
  onTab,
  onPage,
}: {
  rows: AttendeeRow[]
  range: PageWindow
  onTab: (tab: EventTab) => void
  onPage: (page: number) => void
}) {
  /* The window's total is the whole tab, not the page: zero means nobody has
     completed a registration for this event yet. Nothing in the URL narrows this
     list — the loader sends only `page` and `limit` — so the total alone decides,
     and a stale `?status=` left over from the registrations tab cannot turn a
     genuine first run into a filtered one. */
  const firstRun = range.total === 0

  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold tracking-tight">Attendees</h2>
          {!firstRun && (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
              {num(range.total)} confirmed
            </span>
          )}
        </div>
      </div>
      {firstRun ? (
        <EmptyState
          icon="hgi-user-multiple"
          actions={[
            { label: 'Set up ticket types', onClick: () => onTab('tickets'), icon: 'hgi-add-01' },
            { label: 'Open the attendee directory', to: '/admin/attendees' },
          ]}
        >
          Everyone who completes a registration for this event appears here, with the tickets they
          hold. Nobody has completed one yet.
        </EmptyState>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-3 pr-3 font-semibold">Attendee</th>
                  <th className="pb-3 pr-3 font-semibold">Registrations</th>
                  <th className="pb-3 pr-3 font-semibold">Seats</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      {/* `firstRun` already covers a total of zero, so reaching this
                          means attendees exist and the page number ran past them.
                          This tab has no filters to clear, only a page to go back to. */}
                      <PastEnd noun="attendees" onFirstPage={() => onPage(1)} />
                    </td>
                  </tr>
                ) : (
                  rows.map((a) => (
                    <tr key={a.email} className="border-t border-line transition hover:bg-line/50">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <ToneAvatar initials={a.initials} tone={a.tone} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-ink">{a.name}</p>
                            <p className="truncate text-[11px] text-muted">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-[13px] text-muted tnum">{a.registrations}</td>
                      <td className="py-2.5 pr-3 text-[13px] font-medium text-ink tnum">{a.seats}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TabPager range={range} noun="attendees" onPage={onPage} />
        </>
      )}
    </section>
  )
}

/* ---------- Speakers ---------- */
function SpeakersPanel({
  speakers,
  eventId,
  onTab,
}: {
  speakers: SpeakerCard[]
  eventId: string
  onTab: (tab: EventTab) => void
}) {
  /* The directory is event-scoped and falls back to the MOST RECENT event when
     the URL names none, so every link out of this panel has to carry the event
     it came from — otherwise a speaker added from an older event's workspace
     silently attaches to a different one. */
  const directory = `/admin/speakers?eventId=${encodeURIComponent(eventId)}`

  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold tracking-tight">Speakers</h2>
        <Link
          to={directory}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
        >
          <i className="hgi-stroke hgi-add-01 text-[15px]" />
          <span className="hidden sm:inline">Manage speakers</span>
        </Link>
      </div>
      {/* This tab has no filters, so an empty list can only mean a first run. */}
      {speakers.length === 0 ? (
        <EmptyState
          icon="hgi-mic-01"
          actions={[
            { label: 'Add your first speaker', to: directory, icon: 'hgi-user-add-01' },
            { label: 'Build the agenda', onClick: () => onTab('agenda') },
          ]}
        >
          Speakers are part of this event's programme, so you can line them up well before the
          first ticket sells. Add a name, bio and session and they appear on the event page and in
          the agenda.
        </EmptyState>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {speakers.map((s) => (
            <div key={s.id} className="rounded-2xl bg-canvas p-4">
              <div className="flex items-center gap-3">
                <ToneAvatar initials={s.initials} tone={s.tone} size="h-11 w-11" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-ink">{s.name}</p>
                  <p className="truncate text-[12px] text-muted">{s.role}</p>
                </div>
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[12.5px] font-medium text-ink">
                <i className="hgi-stroke hgi-mic-01 text-[14px] mt-0.5 shrink-0 text-brand" />
                {s.talk || s.sessions}
              </p>
              {s.tag && (
                <span className="mt-3 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                  {s.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------- Agenda ---------- */
function AgendaPanel({
  days,
  eventId,
  onAdd,
  onRemove,
}: {
  days: AgendaDay[]
  eventId: string
  onAdd: () => void
  onRemove: (sessionId: string) => void
}) {
  /* Both programme screens default to the most recent event, so the id travels
     with the link — see SpeakersPanel. */
  const scoped = (path: string) => `${path}?eventId=${encodeURIComponent(eventId)}`

  return (
    <section className="rounded-2xl bg-surface p-4 lg:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-bold tracking-tight">Agenda</h2>
        <div className="flex items-center gap-3">
          <Link
            to={scoped('/admin/agenda')}
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
        {/* No filters on this tab either — nothing has been scheduled yet. */}
        {days.length === 0 ? (
          <EmptyState
            icon="hgi-time-schedule"
            actions={[
              { label: 'Add the first session', onClick: onAdd, icon: 'hgi-add-01' },
              { label: 'Add speakers', to: scoped('/admin/speakers') },
            ]}
          >
            The agenda is this event's programme — talks, workshops and breaks laid out by time
            slot. Build it whenever you like; it does not wait on registrations, and attendees see
            it on the event page.
          </EmptyState>
        ) : (
          days.map((d) => (
            <div key={d.day}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Day {d.day}
              </p>
              <div className="space-y-2">
                {d.sessions.map((s) => (
                  <div key={s.id} className="flex gap-3 rounded-xl bg-canvas p-3">
                    <div className="w-12 shrink-0 text-right">
                      <p className="text-[13px] font-bold text-ink tnum">{s.time}</p>
                      <p className="text-[10px] text-muted">{s.duration}</p>
                    </div>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2 border-l border-hair pl-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              TONE[SESSION_TONE[s.type] ?? 'blue'],
                            )}
                          >
                            {s.type}
                          </span>
                          <p className="text-[13px] font-semibold text-ink">{s.title}</p>
                        </div>
                        {(s.who || s.room) && (
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                            <i className="hgi-stroke hgi-mic-01 text-[12px]" />
                            {[s.who, s.room].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(s.id)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/15"
                        title="Remove session"
                      >
                        <i className="hgi-stroke hgi-delete-02 text-[14px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

/* ---------- Tickets ---------- */
function TicketsPanel({ tickets, onAdd }: { tickets: TicketRow[]; onAdd: () => void }) {
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
      {/* Nothing to filter here — an empty grid means none have been created. */}
      {tickets.length === 0 ? (
        <EmptyState
          icon="hgi-ticket-01"
          actions={[
            { label: 'Add ticket', onClick: onAdd, icon: 'hgi-add-01' },
            { label: 'Manage tickets', to: '/admin/tickets' },
          ]}
        >
          Every ticket type carries a price in ฿, how many are available and when they go on sale.
          Add the first one and this event can start selling.
        </EmptyState>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-2xl bg-canvas p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-bold text-ink">{t.name}</p>
                <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-semibold text-muted">
                  {t.status}
                </span>
              </div>
              <p className="mt-1 text-[20px] font-extrabold tracking-tight text-ink tnum">
                {t.price}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted tnum">{t.allocation} sold</span>
                  <span className="font-semibold text-ink tnum">{t.soldPercent}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${t.soldPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
  onAdd: (values: Record<string, string>) => void
}) {
  useEsc(open, onClose)
  const [title, setTitle] = useState('')
  const [day, setDay] = useState('0')
  const [time, setTime] = useState('09:00')
  const [dur, setDur] = useState('45')
  const [type, setType] = useState('Keynote')
  const [who, setWho] = useState('')
  const [room, setRoom] = useState('Hall A')

  const add = () => {
    // The API stores a start and an end, not a duration — the two are the same
    // fact, and converting here keeps the form the shape organizers think in.
    onAdd({
      day: String(Number(day) + 1),
      startTime: withSeconds(time || '09:00'),
      endTime: withSeconds(endOf(time || '09:00', Number(dur) || 45)),
      title: title.trim(),
      type,
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
              {[0, 1, 2, 3].map((index) => (
                <option key={index} value={index}>
                  Day {index + 1}
                </option>
              ))}
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
              onChange={(e) => setType(e.target.value)}
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
  onAdd: (values: Record<string, string>) => void
}) {
  useEsc(open, onClose)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('')
  const [desc, setDesc] = useState('')
  const [isFree, setIsFree] = useState(false)

  const add = () => {
    onAdd({
      name: name.trim(),
      price,
      total: qty,
      // A free tier is priced differently by the API, not priced at zero.
      ...(isFree ? { isFree: 'on' } : {}),
    })
    setName('')
    setPrice('')
    setQty('')
    setDesc('')
    setIsFree(false)
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
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
            />
            <span className="text-[13px] font-medium text-ink">This ticket is free</span>
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

/** What the flyer and the share links are about. */
export interface ShareEvent {
  title: string
  when: string
  where: string
  url: string
  seed: string
}

const CHAN: Record<string, (u: string, t: string, title: string) => string> = {
  facebook: (u) => 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u),
  x: (u, t) => 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(t) + '&url=' + encodeURIComponent(u),
  line: (u) => 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(u),
  whatsapp: (u, t) => 'https://wa.me/?text=' + encodeURIComponent(t + ' ' + u),
  email: (u, t, title) =>
    'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(t + '\n\n' + u),
}

/** Text inside an SVG is markup — an ampersand in an event name breaks it. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** The link as people read it, without the scheme. */
function bareUrl(url: string): string {
  return url.replace(/^https?:\/\//, '')
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
function posterSVG(event: ShareEvent): string {
  const qr = qrRects(event.url, 36, 296, 80)
  const title = escapeXml(event.title.toUpperCase())
  // One line of a fixed-width poster only holds so much.
  const headline = title.length > 22 ? title.slice(0, 21) + '…' : title
  return (
    '<svg viewBox="0 0 440 540" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto" font-family="Inter, system-ui, sans-serif">' +
    '<defs><linearGradient id="pbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1aa873"/><stop offset="1" stop-color="#128455"/></linearGradient>' +
    '<clipPath id="pcl"><rect x="0" y="0" width="440" height="540" rx="22"/></clipPath></defs>' +
    '<g clip-path="url(#pcl)">' +
    '<rect x="0" y="0" width="440" height="540" fill="url(#pbg)"/>' +
    '<circle cx="46" cy="34" r="96" fill="#ffffff" opacity="0.07"/>' +
    '<circle cx="410" cy="150" r="90" fill="#ffffff" opacity="0.06"/>' +
    '<text x="220" y="150" text-anchor="middle" font-size="34" font-weight="800" letter-spacing="1" fill="#ffffff">' +
    headline +
    '</text>' +
    '<text x="220" y="196" text-anchor="middle" font-size="12" font-weight="600" letter-spacing="2.5" fill="#fbf4e6" opacity="0.92">' +
    escapeXml(event.where.toUpperCase()) +
    '</text>' +
    '<rect x="0" y="266" width="440" height="274" fill="#faf3e4"/>' +
    '<rect x="28" y="288" width="96" height="96" rx="12" fill="#ffffff"/>' +
    qr +
    '<text x="142" y="315" font-size="13" font-weight="800" fill="#14342a">' +
    escapeXml(event.when) +
    '</text>' +
    '<text x="142" y="338" font-size="12" font-weight="500" fill="#6f8078">' +
    escapeXml(event.where) +
    '</text>' +
    '<text x="142" y="387" font-size="11" font-weight="800" letter-spacing="0.5" fill="#128455">SCAN TO REGISTER</text>' +
    '<rect x="28" y="404" width="384" height="46" rx="23" fill="#128455"/>' +
    '<text x="220" y="433" text-anchor="middle" font-size="15" font-weight="700" fill="#ffffff">Register on Eventa</text>' +
    '<rect x="28" y="482" width="30" height="30" rx="9" fill="#128455"/>' +
    flame(34, 487, 18, '#ffffff') +
    '<text x="66" y="503" font-size="15.5" font-weight="800" fill="#14342a">Eventa</text>' +
    '<text x="412" y="503" text-anchor="end" font-size="11" font-weight="500" fill="#6f8078">' +
    escapeXml(bareUrl(event.url)) +
    '</text>' +
    '</g></svg>'
  )
}

function ShareModal({
  open,
  onClose,
  event,
}: {
  open: boolean
  onClose: () => void
  event: ShareEvent
}) {
  useEsc(open, onClose)
  const shareUrl = event.url
  const shareText = `Join me at ${event.title}${event.when ? ` — ${event.when}` : ''}${
    event.where ? ` at ${event.where}` : ''
  }`
  const POSTER_SVG = posterSVG(event)
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
    const href = CHAN[kind]!(shareUrl, shareText, event.title)
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
        a.download = 'eventa-flyer-' + event.seed + '.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } catch {
        /* a tainted canvas — the flyer is still on screen to save by hand */
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
