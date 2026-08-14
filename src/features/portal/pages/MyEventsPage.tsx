import { useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'
import { Badge, Icon, PillTabs, Paginator, usePagination, type PillTabItem } from '@/components/ui'
import { authApi } from '@/features/auth/api'
import type { Me } from '@/features/auth/types'
import { useTheme } from '@/lib/useTheme'
import { useDisclosure } from '@/lib/useDisclosure'
import { baht, initials, num } from '@/lib/format'
import { cn } from '@/lib/cn'
import { TicketModal } from '../components/TicketModal'
import type { FlyerTicket } from '../lib/ticketFlyer'
import { UPCOMING_EVENTS, PAST_EVENTS, type UpcomingEvent, type PastEvent } from '../data/myEvents'
import { TRANSACTIONS } from '../data/transactions'

/* Attendee "My Account" (portal/my-events.html). Standalone page with four
   tabs (My Events, Payment history, Profile, Settings), a paginated
   transactions table and a downloadable QR-ticket modal. */

const SWITCH_CSS = `
.switch{position:relative;display:inline-flex;height:1.25rem;width:2.25rem;flex:none;cursor:pointer;align-items:center}
.switch input{position:absolute;inset:0;opacity:0;cursor:pointer}
.switch .track{height:1.25rem;width:2.25rem;border-radius:9999px;background:rgb(var(--line));transition:background .18s}
.switch .dot{position:absolute;left:.125rem;height:1rem;width:1rem;border-radius:9999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:transform .18s}
.switch input:checked + .track{background:#1ba770}
.switch input:checked ~ .dot{transform:translateX(1rem)}
`

type Tab = 'events' | 'payments' | 'profile' | 'settings'

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

function Switch({
  checked,
  defaultChecked,
  onChange,
}: {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <span className="switch">
      <input
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
      />
      <span className="track" />
      <span className="dot" />
    </span>
  )
}

function UpcomingCard({ ev, onTicket }: { ev: UpcomingEvent; onTicket: (t: FlyerTicket) => void }) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-surface ring-2 ring-transparent transition hover:ring-brand">
      <div className={cn('relative h-24', ev.headerClass)}>
        <img
          src={`https://picsum.photos/seed/${ev.imgSeed}/540/240`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={hideOnError}
        />
        <span
          className={cn(
            'absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
            ev.tag.variant === 'brand'
              ? 'bg-brand text-white'
              : 'bg-white/85 text-ink backdrop-blur-sm',
          )}
        >
          {ev.tag.text}
        </span>
        <span
          className={cn(
            'absolute -bottom-5 left-4 grid h-11 w-11 place-items-center rounded-xl text-white shadow-md ring-4 ring-surface',
            ev.badgeClass,
          )}
        >
          <i className={cn('hgi-stroke text-[20px]', ev.icon)} />
        </span>
      </div>
      <div className="px-4 pb-4 pt-7">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[15px] font-bold tracking-tight text-ink">{ev.title}</p>
          <Badge tone={ev.chip.tone} className="shrink-0">
            <i className={cn('hgi-stroke text-[11px]', ev.chip.icon)} />
            {ev.chip.label}
          </Badge>
        </div>
        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-calendar-03" size={14} />
            {ev.date}
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-location-01" size={14} />
            {ev.venue}
          </p>
        </div>
        <div className="mt-3.5 flex items-center gap-2 border-t border-hair pt-3.5">
          {/* An attendee's "Details" pointed into the organizer console, which
              they may not open — the API answers 403. Their own event page is
              the public one. */}
          <Link to="/portal/discover" className="btn btn-soft btn-sm flex-1">
            <Icon name="hgi-eye" size={14} />
            Details
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-sm flex-1"
            onClick={() =>
              onTicket({
                id: ev.ticket.id,
                event: ev.ticket.event,
                date: ev.ticket.date,
                venue: ev.ticket.venue,
                type: ev.ticket.type,
                attendee: 'Anong Pattana',
                payload: 'https://eventa.app/t/' + ev.ticket.id,
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

function PastCard({ ev }: { ev: PastEvent }) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-surface ring-2 ring-transparent transition hover:ring-hair">
      <div className="relative h-24 bg-line">
        <img
          src={`https://picsum.photos/seed/${ev.imgSeed}/540/240`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale"
          onError={hideOnError}
        />
        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur-sm">
          <i className="hgi-stroke hgi-checkmark-badge-01 text-[11px]" />
          Attended
        </span>
        <span
          className={cn(
            'absolute -bottom-5 left-4 grid h-11 w-11 place-items-center rounded-xl text-white shadow-md ring-4 ring-surface',
            ev.badgeClass,
          )}
        >
          <i className={cn('hgi-stroke text-[20px]', ev.icon)} />
        </span>
      </div>
      <div className="px-4 pb-4 pt-7">
        <p className="truncate text-[15px] font-bold tracking-tight text-ink">{ev.title}</p>
        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-calendar-03" size={14} />
            {ev.date}
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-location-01" size={14} />
            {ev.venue}
          </p>
        </div>
        <div className="mt-3.5 border-t border-hair pt-3.5">
          <Link to={`/portal/survey?event=${ev.surveySlug}`} className="btn btn-soft btn-sm w-full">
            <Icon name="hgi-comment-01" size={14} />
            Leave feedback
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function MyEventsPage() {
  // Who is signed in is real; the tickets and transactions below are still the
  // demo modules, and migrating them is US-DISC-07/09/10 — a separate change.
  const { me } = useLoaderData() as { me: Me }
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const [tab, setTabState] = useState<Tab>('events')

  async function signOut() {
    await authApi.logout()
    navigate('/portal/login', { replace: true })
  }

  const modal = useDisclosure()
  const [ticket, setTicket] = useState<FlyerTicket | null>(null)

  const pager = usePagination(TRANSACTIONS, 10)

  const stats = useMemo(() => {
    let spent = 0
    let refunded = 0
    for (const t of TRANSACTIONS) {
      if (t.refunded) refunded += t.amount
      else spent += t.amount
    }
    return { spent, refunded, count: TRANSACTIONS.length }
  }, [])

  function setTab(next: Tab) {
    setTabState(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openTicket(t: FlyerTicket) {
    setTicket(t)
    modal.onOpen()
  }

  const tabItems: PillTabItem<Tab>[] = [
    { value: 'events', label: 'My Events', count: UPCOMING_EVENTS.length + PAST_EVENTS.length },
    { value: 'payments', label: 'Payment history', count: TRANSACTIONS.length },
    { value: 'profile', label: 'Profile' },
    { value: 'settings', label: 'Settings' },
  ]

  return (
    <div className="h-full bg-canvas font-sans text-ink antialiased">
      <style>{SWITCH_CSS}</style>

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
          {tab === 'events' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-bold tracking-tight">
                  Upcoming <span className="text-muted">· {UPCOMING_EVENTS.length}</span>
                </h2>
                <Link
                  to="/portal/discover"
                  className="text-[12px] font-semibold text-brand hover:underline"
                >
                  Discover more →
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {UPCOMING_EVENTS.map((ev) => (
                  <UpcomingCard key={ev.ticket.id} ev={ev} onTicket={openTicket} />
                ))}
              </div>

              <h2 className="mb-3 mt-7 text-[15px] font-bold tracking-tight">
                Past <span className="text-muted">· {PAST_EVENTS.length}</span>
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PAST_EVENTS.map((ev) => (
                  <PastCard key={ev.surveySlug} ev={ev} />
                ))}
              </div>
            </div>
          )}

          {/* ======================= Payment history ======================= */}
          {tab === 'payments' && (
            <div>
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="card p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <Icon name="hgi-wallet-01" size={13} className="text-brand" />
                    Total spent
                  </p>
                  <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight">
                    {baht(stats.spent)}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <Icon name="hgi-credit-card" size={13} className="text-brand" />
                    Transactions
                  </p>
                  <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight">
                    {num(stats.count)}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <Icon name="hgi-delivery-return-01" size={13} className="text-brand" />
                    Refunded
                  </p>
                  <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight">
                    {baht(stats.refunded)}
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
                      {pager.slice.map((t) => (
                        <tr key={t.inv}>
                          <td>
                            <p className="text-[13px] font-semibold text-ink">{t.event}</p>
                            <p className="font-mono text-[11px] text-muted">{t.inv}</p>
                          </td>
                          <td className="whitespace-nowrap text-[12px] text-muted">{t.date}</td>
                          <td className="whitespace-nowrap text-[12px] text-muted">
                            <i className={cn('hgi-stroke mr-1 text-[13px]', t.icon)} />
                            {t.method}
                          </td>
                          <td
                            className={cn(
                              'text-right text-[13px] font-semibold tabular-nums',
                              t.refunded && 'text-muted line-through',
                            )}
                          >
                            {baht(t.amount)}
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
                            <button type="button" className="btn-icon bg-line" title="Download receipt">
                              <Icon name="hgi-download-01" size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Paginator
                    from={pager.from}
                    to={pager.to}
                    total={pager.total}
                    page={pager.page}
                    pageCount={pager.pageCount}
                    size={pager.size}
                    onPage={pager.setPage}
                    onSize={pager.setSize}
                    noun="transactions"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= Profile ======================= */}
          {tab === 'profile' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              {/* avatar card */}
              <div className="card p-5">
                <p className="text-[13px] font-bold tracking-tight">Profile photo</p>
                <div className="mt-3 flex items-center gap-4">
                  <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-emerald-400 text-[26px] font-bold text-white">
                    AP
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" className="btn btn-soft btn-sm">
                        <Icon name="hgi-image-upload-01" size={15} />
                        Upload
                      </button>
                      <button
                        type="button"
                        className="text-[12px] font-medium text-muted transition hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-muted">JPG or PNG · Max 5MB</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-hair pt-4">
                  <h3 className="text-[15px] font-bold tracking-tight">Anong Phanit</h3>
                  <p className="text-[12px] text-muted">Attendee · Bangkok</p>
                </div>
                <div className="mt-4 border-t border-hair pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Interests
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['Tech', 'Live music', 'Yoga', 'Networking', 'Startups', 'Design'].map((i) => (
                      <span
                        key={i}
                        className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-hair pt-4 text-[12px]">
                  <p className="flex items-center justify-between">
                    <span className="text-muted">Verified</span>
                    <Badge tone="green">
                      <i className="hgi-stroke hgi-tick-02 text-[11px]" />
                      Email
                    </Badge>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted">Events attended</span>
                    <span className="font-semibold tabular-nums">12</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted">Member since</span>
                    <span className="font-semibold">Aug 2024</span>
                  </p>
                </div>
              </div>

              {/* details form */}
              <div className="card p-5">
                <h3 className="text-[14px] font-bold tracking-tight">Personal information</h3>
                <p className="mt-0.5 text-[12px] text-muted">
                  Update your details so organizers can reach you.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">First name</label>
                    <input className="input" defaultValue="Anong" />
                  </div>
                  <div>
                    <label className="label">Last name</label>
                    <input className="input" defaultValue="Phanit" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input" type="email" defaultValue="anong.p@gmail.com" />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" type="tel" defaultValue="+66 81 234 5678" />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input className="input" defaultValue="Bangkok" />
                  </div>
                  <div>
                    <label className="label">Date of birth</label>
                    <input className="input" type="date" defaultValue="1994-03-15" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Bio</label>
                    <textarea
                      className="textarea"
                      rows={3}
                      placeholder="Tell organizers a bit about yourself…"
                      defaultValue="Product designer who loves tech meetups, live music and weekend yoga."
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 border-t border-hair pt-4">
                  <button type="button" className="btn btn-soft btn-sm">
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary btn-sm">
                    <Icon name="hgi-tick-02" size={15} />
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================= Settings ======================= */}
          {tab === 'settings' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Notifications */}
              <div className="card p-5">
                <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
                  <Icon name="hgi-notification-03" size={16} className="text-muted" />
                  Notifications
                </h3>
                <div className="mt-4 divide-y divide-line">
                  <label className="flex items-center justify-between py-3 first:pt-0">
                    <span>
                      <span className="block text-[13px] font-medium text-ink">
                        Email notifications
                      </span>
                      <span className="block text-[11px] text-muted">
                        Order confirmations and updates
                      </span>
                    </span>
                    <Switch defaultChecked />
                  </label>
                  <label className="flex items-center justify-between py-3">
                    <span>
                      <span className="block text-[13px] font-medium text-ink">Event reminders</span>
                      <span className="block text-[11px] text-muted">A day before each event</span>
                    </span>
                    <Switch defaultChecked />
                  </label>
                  <label className="flex items-center justify-between py-3">
                    <span>
                      <span className="block text-[13px] font-medium text-ink">SMS alerts</span>
                      <span className="block text-[11px] text-muted">Time-sensitive changes only</span>
                    </span>
                    <Switch />
                  </label>
                  <label className="flex items-center justify-between py-3 last:pb-0">
                    <span>
                      <span className="block text-[13px] font-medium text-ink">
                        Marketing &amp; promotions
                      </span>
                      <span className="block text-[11px] text-muted">New events you may like</span>
                    </span>
                    <Switch />
                  </label>
                </div>
              </div>

              {/* Preferences */}
              <div className="card p-5">
                <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
                  <Icon name="hgi-globe-02" size={16} className="text-muted" />
                  Preferences
                </h3>
                <div className="mt-4 space-y-3.5">
                  <div>
                    <label className="label">Language</label>
                    <select className="select">
                      <option>English</option>
                      <option>ไทย (Thai)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Timezone</label>
                    <select className="select">
                      <option>(GMT+7) Bangkok</option>
                      <option>(GMT+0) London</option>
                      <option>(GMT+9) Tokyo</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Currency</label>
                    <select className="select">
                      <option>฿ Thai Baht (THB)</option>
                      <option>$ US Dollar (USD)</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-between pt-1">
                    <span>
                      <span className="block text-[13px] font-medium text-ink">Dark mode</span>
                      <span className="block text-[11px] text-muted">Switch the interface theme</span>
                    </span>
                    <Switch checked={dark} onChange={toggle} />
                  </label>
                </div>
              </div>

              {/* Security */}
              <div className="card p-5">
                <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
                  <Icon name="hgi-shield-01" size={16} className="text-muted" />
                  Security
                </h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-hair bg-canvas px-3.5 py-3">
                    <span>
                      <span className="block text-[13px] font-medium text-ink">Password</span>
                      <span className="block text-[11px] text-muted">Last changed 3 months ago</span>
                    </span>
                    <button type="button" className="btn btn-soft btn-sm">
                      Change
                    </button>
                  </div>
                  <label className="flex items-center justify-between rounded-lg border border-hair bg-canvas px-3.5 py-3">
                    <span>
                      <span className="block text-[13px] font-medium text-ink">
                        Two-factor authentication
                      </span>
                      <span className="block text-[11px] text-muted">Extra security at sign-in</span>
                    </span>
                    <Switch />
                  </label>
                </div>
              </div>

              {/* Danger zone */}
              <div className="card border-red-200 p-5 dark:border-red-500/30">
                <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-red-600 dark:text-red-400">
                  <Icon name="hgi-alert-02" size={16} />
                  Danger zone
                </h3>
                <p className="mt-2 text-[12px] text-muted">
                  Permanently remove your account and all registration data. This cannot be undone.
                </p>
                <button
                  type="button"
                  className="btn btn-sm mt-4 border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400"
                >
                  <Icon name="hgi-delete-02" size={15} />
                  Delete account
                </button>
              </div>
            </div>
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
