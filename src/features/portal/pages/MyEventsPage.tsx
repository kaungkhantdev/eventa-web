import { useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'
import {
  Badge,
  EmptyState,
  Icon,
  PillTabs,
  Paginator,
  VenueMap,
  type PillTabItem,
} from '@/components/ui'
import { authApi } from '@/features/auth/api'
import { useTheme } from '@/lib/useTheme'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters } from '@/lib/useFilters'
import { initials, num } from '@/lib/format'
import { cn } from '@/lib/cn'
import { ProfileTab } from '../components/ProfileTab'
import { SettingsTab } from '../components/SettingsTab'
import { TicketModal } from '../components/TicketModal'
import type { FlyerTicket } from '../lib/ticketFlyer'
import type { MyEventsData } from '../myEvents.routes'
import type { MyEventRow } from '../myEvents.types'
import { EVENT_ICON, lookOf } from '../portal.presentation'

/* Attendee "My Account" (portal/my-events.html). Standalone page with four
   tabs (My Events, Payment history, Profile, Settings), a paginated
   transactions table and a downloadable QR-ticket modal. */

type Tab = 'events' | 'payments' | 'profile' | 'settings'

/* Nothing on this page is filtered — the tabs are component state and the only
   query parameters are the payment history's page and page size — so an empty
   list here always means "you have not done this yet", never "a filter hid it".
   That makes the way forward the same in every case: go and find an event.
   Attendee pages never answer emptiness with "create one". */
const DISCOVER_ACTION = { label: 'Discover events', to: '/portal/discover', icon: 'hgi-search-01' }

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

function UpcomingCard({
  ev,
  holder,
  onTicket,
}: {
  ev: MyEventRow
  holder: string
  onTicket: (t: FlyerTicket) => void
}) {
  // Stable per event, so the same booking is the same colour on every visit.
  const look = lookOf(ev.slug)

  return (
    <article className="group overflow-hidden rounded-2xl bg-surface ring-2 ring-transparent transition hover:ring-brand">
      <div className={cn('relative h-24', look.header)}>
        {/* The event's own cover, or the card's gradient. */}
        {ev.image && (
          <img
            src={ev.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={hideOnError}
          />
        )}
        {/* The API writes the phrase — "in 3 days" — and stops once it passes. */}
        {ev.countdown && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur-sm">
            {ev.countdown}
          </span>
        )}
        <span
          className={cn(
            'absolute -bottom-5 left-4 grid h-11 w-11 place-items-center rounded-xl text-white shadow-md ring-4 ring-surface',
            look.badge,
          )}
        >
          <i className={cn('hgi-stroke text-[20px]', EVENT_ICON)} />
        </span>
      </div>
      <div className="px-4 pb-4 pt-7">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[15px] font-bold tracking-tight text-ink">{ev.title}</p>
          <Badge tone={look.tone} className="shrink-0">
            <i className="hgi-stroke hgi-ticket-01 text-[11px]" />
            {ev.ticket}
          </Badge>
        </div>
        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-calendar-03" size={14} />
            {ev.when}
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-location-01" size={14} />
            {ev.where}
          </p>
          {/* One map per card, but `loading="lazy"` inside VenueMap means only
              the cards actually scrolled to ever fetch one. */}
          {ev.venue && <VenueMap venue={ev.venue} title={`Where ${ev.title} is`} />}
        </div>
        <div className="mt-3.5 flex items-center gap-2 border-t border-hair pt-3.5">
          {/* An attendee's "Details" pointed into the organizer console, which
              they may not open — the API answers 403. Their own event page is
              the public one. */}
          <Link to={`/e/${ev.slug}`} className="btn btn-soft btn-sm flex-1">
            <Icon name="hgi-eye" size={14} />
            Details
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-sm flex-1"
            onClick={() =>
              onTicket({
                id: ev.reference,
                event: ev.title,
                date: ev.when,
                venue: ev.where,
                type: ev.ticket,
                attendee: holder,
                payload: `${window.location.origin}/e/${ev.slug}`,
              })
            }
          >
            <Icon name="hgi-qr-code-01" size={14} />
            Ticket
          </button>
        </div>
      </div>
    </article>
  )
}

function PastCard({ ev }: { ev: MyEventRow }) {
  const look = lookOf(ev.slug)

  return (
    <article className="group overflow-hidden rounded-2xl bg-surface ring-2 ring-transparent transition hover:ring-hair">
      <div className="relative h-24 bg-line">
        {ev.image && (
          <img
            src={ev.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale"
            onError={hideOnError}
          />
        )}
        {/* Only claimed when they were actually scanned in — a past event they
            missed is still theirs, and saying "Attended" would be wrong. */}
        {ev.attended && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur-sm">
            <i className="hgi-stroke hgi-checkmark-badge-01 text-[11px]" />
            Attended
          </span>
        )}
        <span
          className={cn(
            'absolute -bottom-5 left-4 grid h-11 w-11 place-items-center rounded-xl text-white shadow-md ring-4 ring-surface',
            look.badge,
          )}
        >
          <i className={cn('hgi-stroke text-[20px]', EVENT_ICON)} />
        </span>
      </div>
      <div className="px-4 pb-4 pt-7">
        <p className="truncate text-[15px] font-bold tracking-tight text-ink">{ev.title}</p>
        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-calendar-03" size={14} />
            {ev.when}
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-location-01" size={14} />
            {ev.where}
          </p>
        </div>
        <div className="mt-3.5 border-t border-hair pt-3.5">
          <Link to={`/portal/survey?event=${ev.slug}`} className="btn btn-soft btn-sm w-full">
            <Icon name="hgi-comment-01" size={14} />
            Leave feedback
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function MyEventsPage() {
  const { me, profile, settings, upcoming, past, transactions, window: range, totals } =
    useLoaderData() as MyEventsData
  const navigate = useNavigate()
  const { set } = useFilters()
  const { dark, toggle } = useTheme()
  const [tab, setTabState] = useState<Tab>('events')

  async function signOut() {
    await authApi.logout()
    navigate('/portal/login', { replace: true })
  }

  const modal = useDisclosure()
  const [ticket, setTicket] = useState<FlyerTicket | null>(null)

  function setTab(next: Tab) {
    setTabState(next)
    globalThis.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openTicket(t: FlyerTicket) {
    setTicket(t)
    modal.onOpen()
  }

  const tabItems: PillTabItem<Tab>[] = [
    { value: 'events', label: 'My Events', count: upcoming.length + past.length },
    // The whole history, not the page on screen — the API counted it.
    { value: 'payments', label: 'Payment history', count: range.total },
    { value: 'profile', label: 'Profile' },
    { value: 'settings', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      {/* ============ Top bar ============ */}
      <header className="sticky top-0 z-30 border-b border-hair bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 lg:px-6">
          <Link to="/portal/discover" className="flex items-center gap-2.5">
            <span className="brand-logo text-brand h-[17px] w-[31px]" />
            <span className="text-[15px] font-extrabold tracking-tight">Eventa</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              to="/portal/discover"
              className="hidden rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition hover:bg-line hover:text-ink sm:inline-flex sm:items-center sm:gap-1.5"
            >
              <i className="hgi-stroke hgi-search-01 text-[15px]" />
              Discover events
            </Link>
            <button type="button" onClick={toggle} className="btn-icon bg-surface" title="Toggle theme">
              <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={18} />
            </button>
            <button
              type="button"
              onClick={() => setTab('profile')}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-line"
              title="Account"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand to-emerald-400 text-[11px] font-semibold text-white">
                {initials(me.name)}
              </span>
              <span className="hidden text-[13px] font-semibold sm:inline">{me.name}</span>
            </button>
            {/* A real sign-out. This used to be a Link, which navigated away and
                left the tokens in localStorage — so "signed out" was a change of
                page rather than of session. */}
            <button
              type="button"
              onClick={signOut}
              className="btn-icon bg-surface"
              title="Sign out"
            >
              <Icon name="hgi-logout-03" size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ============ Main ============ */}
      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
        {/* Page header */}
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">My Account</h1>
          <p className="mt-1 text-[13px] text-muted">
            Manage your registrations, payments and profile.
          </p>
        </div>

        {/* Tabs */}
        <PillTabs items={tabItems} value={tab} onChange={setTab} className="no-scrollbar mt-4" />

        <div className="mt-5">
          {/* ======================= My Events ======================= */}
          {tab === 'events' &&
            (upcoming.length + past.length === 0 ? (
              /* Never registered for anything. The "Upcoming · 0" heading and
                 its "Discover more" link go too: with no list to head, they are
                 a label over nothing and a second copy of the one real step. */
              <EmptyState
                className="card"
                icon="hgi-ticket-02"
                title="No tickets yet"
                actions={[DISCOVER_ACTION]}
              >
                Events you register for show up here with your ticket and its QR code, ready to
                scan at the door. Nothing is booked yet.
              </EmptyState>
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[15px] font-bold tracking-tight">
                    Upcoming <span className="text-muted">· {upcoming.length}</span>
                  </h2>
                  <Link
                    to="/portal/discover"
                    className="text-[12px] font-semibold text-brand hover:underline"
                  >
                    Discover more →
                  </Link>
                </div>

                {upcoming.length ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {upcoming.map((ev) => (
                      <UpcomingCard
                        key={ev.orderId}
                        ev={ev}
                        holder={me.name}
                        onTicket={openTicket}
                      />
                    ))}
                  </div>
                ) : (
                  /* Past events below, so the heading stays and only the
                     Upcoming grid is replaced. No title — the heading above it
                     already says which half of the tab is empty. */
                  <EmptyState
                    compact
                    className="card"
                    icon="hgi-calendar-03"
                    actions={[DISCOVER_ACTION]}
                  >
                    Nothing coming up. Your next booking appears here with its ticket and QR code.
                  </EmptyState>
                )}

                {past.length > 0 && (
                  <>
                    <h2 className="mb-3 mt-7 text-[15px] font-bold tracking-tight">
                      Past <span className="text-muted">· {past.length}</span>
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {past.map((ev) => (
                        <PastCard key={ev.orderId} ev={ev} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

          {/* ======================= Payment history ======================= */}
          {tab === 'payments' &&
            (range.total === 0 ? (
              /* The API's own count of the whole history, not of the rows on
                 this page: there has never been a payment, so the three totals
                 would read zero three times above a table with no rows. */
              <EmptyState
                className="card"
                icon="hgi-credit-card"
                title="No payments yet"
                actions={[DISCOVER_ACTION]}
              >
                Tickets you pay for are listed here with their receipts, so you can look up what
                you paid, when, and for which event.
              </EmptyState>
            ) : (
              <div>
                <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="card p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                      <Icon name="hgi-wallet-01" size={13} className="text-brand" />
                      Total spent
                    </p>
                    <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight">
                      {totals.spent}
                    </p>
                  </div>
                  <div className="card p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                      <Icon name="hgi-credit-card" size={13} className="text-brand" />
                      Transactions
                    </p>
                    <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight">
                      {num(totals.count)}
                    </p>
                  </div>
                  <div className="card p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                      <Icon name="hgi-delivery-return-01" size={13} className="text-brand" />
                      Refunded
                    </p>
                    <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight">
                      {totals.refunded}
                    </p>
                  </div>
                </div>

                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-hair px-4 py-3">
                    <h2 className="text-[14px] font-bold tracking-tight">Transactions</h2>
                    <button type="button" className="btn btn-soft btn-sm">
                      <Icon name="hgi-download-01" size={14} />
                      Export
                    </button>
                  </div>
                  <div className="overflow-x-auto px-4 py-3">
                    <table className="data-table w-full [&_th:last-child]:pr-0 [&_td:last-child]:pr-0">
                      <thead>
                        <tr>
                          <th className="text-left">Event</th>
                          <th className="text-left">Date</th>
                          <th className="text-left">Method</th>
                          <th className="text-right">Amount</th>
                          <th className="text-left">Status</th>
                          <th className="text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.length === 0 ? (
                          /* History exists but this page holds none of it — a
                             hand-typed `?page=`, or the last row of the page
                             refunded away. Not a filtered view and not a first
                             run, so the way back is the first page, and the
                             paginator below stays put. */
                          <tr>
                            <td colSpan={6}>
                              <EmptyState
                                compact
                                icon="hgi-search-01"
                                title="Nothing on this page"
                                actions={[
                                  {
                                    label: 'Back to the first page',
                                    onClick: () => set({ page: 1 }),
                                    icon: 'hgi-refresh',
                                  },
                                ]}
                              >
                                This page is past the end of your payment history.
                              </EmptyState>
                            </td>
                          </tr>
                        ) : (
                          transactions.map((t) => (
                            <tr key={t.id}>
                              <td>
                                <p className="text-[13px] font-semibold text-ink">{t.event}</p>
                                <p className="font-mono text-[11px] text-muted">{t.reference}</p>
                              </td>
                              <td className="whitespace-nowrap text-[12px] text-muted">{t.date}</td>
                              <td className="whitespace-nowrap text-[12px] text-muted">
                                {t.method}
                              </td>
                              <td
                                className={cn(
                                  'text-right text-[13px] font-semibold tabular-nums',
                                  t.refunded && 'text-muted line-through',
                                )}
                              >
                                {t.amount}
                              </td>
                              <td>
                                {t.refunded ? (
                                  <Badge tone="red">
                                    <i className="hgi-stroke hgi-delivery-return-01 text-[11px]" />
                                    Refunded
                                  </Badge>
                                ) : (
                                  <Badge tone="green">
                                    <i className="hgi-stroke hgi-tick-02 text-[11px]" />
                                    Paid
                                  </Badge>
                                )}
                              </td>
                              <td className="text-right">
                                <button
                                  type="button"
                                  className="btn-icon bg-line"
                                  title="Download receipt"
                                >
                                  <Icon name="hgi-download-01" size={15} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* The API pages this, so the numbers come from its `meta`
                        and the page lives in the URL — the back button works and
                        the count can never disagree with the rows. */}
                    <Paginator
                      from={range.from}
                      to={range.to}
                      total={range.total}
                      page={range.page}
                      pageCount={range.pageCount}
                      size={range.size}
                      onPage={(page) => set({ page })}
                      onSize={(limit) => set({ limit })}
                      noun="transactions"
                    />
                  </div>
                </div>
              </div>
            ))}

          {/* ======================= Profile ======================= */}
          {tab === 'profile' && <ProfileTab profile={profile} />}

          {/* ======================= Settings ======================= */}
          {tab === 'settings' && (
            <SettingsTab
              settings={settings}
              twoFactorEnabled={me.twoFactorEnabled}
              dark={dark}
              onToggleTheme={toggle}
            />
          )}
        </div>

        <p className="mt-8 text-center text-[11px] text-muted/70">
          Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
        </p>
      </main>

      <TicketModal open={modal.open} onClose={modal.onClose} ticket={ticket} />
    </div>
  )
}
