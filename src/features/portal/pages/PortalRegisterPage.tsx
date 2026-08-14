import { Fragment, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Icon } from '@/components/ui'
import { useTheme } from '@/lib/useTheme'
import { cn } from '@/lib/cn'
import { getPortalEvent } from '../data/events'

/* Multi-step registration flow (portal/register.html). Standalone page: pick a
   ticket tier, then either choose seats on a cinema-style map (reserved events)
   or a quantity (GA / online), then pay (paid events) — with a live order
   summary, sticky action bar and a success overlay. */

const SEAT_CSS = `
.house { background: radial-gradient(120% 90% at 50% -10%, #17201c 0%, #0c110f 60%); }
.seat {
  position: relative; height: 30px; width: 30px; border-radius: 9px 9px 4px 4px;
  display: grid; place-items: center; font-size: 11px; font-weight: 600;
  transition: background .12s, box-shadow .12s, color .12s; user-select: none;
}
.seat::after { content: ''; position: absolute; bottom: -3px; left: 4px; right: 4px; height: 3px; border-radius: 2px; background: inherit; opacity: .55; }
.seat-avail  { background: rgba(255,255,255,.08); color: rgba(255,255,255,.72); cursor: pointer; }
.seat-avail:hover { background: rgba(27,167,112,.4); color: #fff; }
.seat-sel    { background: #1ba770; color: #fff; cursor: pointer; box-shadow: 0 0 0 3px rgba(27,167,112,.28); }
.seat-booked { background: rgba(255,255,255,.035); color: rgba(255,255,255,.16); cursor: not-allowed; }
.rowlab { color: rgba(255,255,255,.4); font-size: 12px; font-weight: 600; width: 18px; text-align: center; }
`

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const COLS = 16
const MAX = 8
const BOOKED: Record<string, number[]> = {
  A: [5, 8, 9, 12],
  B: [2, 3, 15, 16],
  C: [6, 7, 8, 11, 14, 15],
  D: [3, 4, 5, 7, 11, 12, 16],
  E: [6, 7, 8, 9, 14, 15],
  F: [1, 16],
  G: [],
}

type TierKey = 'general' | 'vip'

function isBooked(r: string, c: number) {
  return (BOOKED[r] || []).indexOf(c) !== -1
}

/** natural sort of seat ids (row then number) */
function sortSeats(a: string[]) {
  return a.slice().sort((x, y) =>
    x.charAt(0) === y.charAt(0)
      ? +x.slice(1) - +y.slice(1)
      : x.charAt(0) < y.charAt(0)
        ? -1
        : 1,
  )
}

function money(x: number) {
  return '฿' + x.toLocaleString('en-US')
}

function Bold({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-ink">{children}</span>
}

export default function PortalRegisterPage() {
  const { dark, toggle } = useTheme()
  const [searchParams] = useSearchParams()

  const ev = useMemo(() => getPortalEvent(searchParams), [searchParams])
  const slug = searchParams.get('event') || ev.slug || ''

  /* event type → registration mode */
  const isOnline = searchParams.get('online') === '1'
  const seatingMode = searchParams.get('seating') || ev.seating || 'ga'
  const mode: 'online' | 'reserved' | 'ga' = isOnline
    ? 'online'
    : seatingMode === 'reserved'
      ? 'reserved'
      : 'ga'

  /* price: parse "฿480" → 480; Free/RSVP → 0 */
  const base = parseInt(String(ev.priceFrom || '').replace(/[^\d]/g, ''), 10) || 0
  const free = base === 0
  const baht = (n: number) => (free ? 'Free' : '฿' + n.toLocaleString('en-US'))

  const TIERS = [
    { key: 'general' as TierKey, name: 'General Admission', desc: 'Standard seating', price: base },
    {
      key: 'vip' as TierKey,
      name: 'VIP',
      desc: 'Front rows · priority entry',
      price: Math.round((base * 2.5) / 10) * 10,
    },
  ]

  const [tierKey, setTierKey] = useState<TierKey>('general')
  const tier = TIERS.find((t) => t.key === tierKey) || TIERS[0]!

  const [selected, setSelected] = useState<string[]>([])
  const [qty, setQty] = useState(1)
  const [payMethod, setPayMethod] = useState<'card' | 'promptpay'>('card')
  const [done, setDone] = useState(false)

  const count = mode === 'reserved' ? selected.length : qty
  const subtotal = tier.price * count
  const fee = free ? 0 : Math.round(subtotal * 0.05)
  const total = subtotal + fee

  const confirmDisabled = mode === 'reserved' && count === 0

  function seatClass(r: string, c: number) {
    const id = r + c
    if (isBooked(r, c)) return 'seat seat-booked'
    return 'seat ' + (selected.indexOf(id) !== -1 ? 'seat-sel' : 'seat-avail')
  }

  function toggleSeat(r: string, c: number) {
    if (isBooked(r, c)) return
    const id = r + c
    setSelected((prev) => {
      const i = prev.indexOf(id)
      if (i !== -1) return prev.filter((s) => s !== id)
      if (prev.length >= MAX) return prev
      return [...prev, id]
    })
  }

  function setQtyClamped(n: number) {
    setQty(Math.max(1, Math.min(MAX, n)))
  }

  function onConfirm() {
    if (count < 1) return
    setDone(true)
  }

  const sorted = sortSeats(selected).join(', ')

  const backTo = slug ? `/landing/aurora?event=${encodeURIComponent(slug)}` : '/'

  /* success-overlay copy */
  const verb = count === 1 ? 'is' : 'are'

  return (
    <div className="h-full bg-canvas font-sans text-ink antialiased">
      <style>{SEAT_CSS}</style>

      {/* ============ Top bar ============ */}
      <header className="sticky top-0 z-30 border-b border-hair bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 lg:px-6">
          <Link to="/portal/discover" className="flex items-center gap-2.5">
            <span className="brand-logo text-brand h-[17px] w-[31px]" />
            <span className="text-[15px] font-extrabold tracking-tight">Eventa</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              to={backTo}
              className="hidden rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition hover:bg-line hover:text-ink sm:inline-flex sm:items-center sm:gap-1.5"
            >
              <Icon name="hgi-arrow-left-01" size={15} />
              Back to event
            </Link>
            <button type="button" onClick={toggle} className="btn-icon bg-surface" title="Toggle theme">
              <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-36 pt-6 lg:px-6">
        {/* event summary */}
        <div className="mb-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-brand">Register</p>
          <h1 className="mt-1 text-[24px] font-extrabold tracking-tight sm:text-[28px]">
            {ev.title || 'Event'}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            {ev.dateText && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="hgi-calendar-03" size={15} />
                {ev.dateText}
                {ev.timeText ? ' · ' + ev.timeText : ''}
              </span>
            )}
            {ev.venue && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="hgi-location-01" size={15} />
                {ev.venue}
                {ev.city ? ', ' + ev.city : ''}
              </span>
            )}
          </p>
        </div>

        {/* ticket type */}
        <section className="mb-6">
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">
            1 · Ticket type
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TIERS.map((tr) => {
              const on = tr.key === tier.key
              return (
                <button
                  key={tr.key}
                  type="button"
                  onClick={() => setTierKey(tr.key)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-3.5 text-left transition',
                    on
                      ? 'border-brand bg-brand-soft ring-1 ring-brand'
                      : 'border-hair bg-surface hover:border-brand/40',
                  )}
                >
                  <span>
                    <span className="block text-[14px] font-bold text-ink">{tr.name}</span>
                    <span className="block text-[12px] text-muted">{tr.desc}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={cn('text-[15px] font-bold', on ? 'text-brand' : 'text-ink')}>
                      {baht(tr.price)}
                    </span>
                    <span
                      className={cn(
                        'grid h-5 w-5 place-items-center rounded-full border',
                        on ? 'border-brand bg-brand text-white' : 'border-hair text-transparent',
                      )}
                    >
                      <Icon name="hgi-tick-02" size={12} />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* step 2: seats (reserved) OR quantity (GA / online) */}
        <section>
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">
            {mode === 'reserved' ? '2 · Choose your seats' : '2 · How many tickets?'}
          </h2>

          {/* reserved: seat map */}
          {mode === 'reserved' && (
            <div>
              <div className="house overflow-hidden rounded-2xl p-5 sm:p-7">
                {/* stage */}
                <div className="mb-6 flex flex-col items-center">
                  <svg
                    viewBox="0 0 400 34"
                    className="w-full max-w-md"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="stageg" x1="0" x2="1">
                        <stop offset="0" stopColor="#1ba770" stopOpacity="0" />
                        <stop offset=".5" stopColor="#1ba770" />
                        <stop offset="1" stopColor="#1ba770" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M8 30 Q200 2 392 30"
                      fill="none"
                      stroke="url(#stageg)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="mt-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-white/45">
                    Stage
                  </span>
                </div>
                {/* seat grid */}
                <div className="flex flex-col items-center gap-2 overflow-x-auto">
                  {ROWS.map((r) => (
                    <div key={r} className="flex items-center gap-1.5 sm:gap-2">
                      <span className="rowlab">{r}</span>
                      {Array.from({ length: COLS }, (_, i) => i + 1).map((c) => (
                        <Fragment key={c}>
                          <button
                            type="button"
                            className={seatClass(r, c)}
                            onClick={() => toggleSeat(r, c)}
                          >
                            {c}
                          </button>
                          {c === 8 && <span className="w-3 sm:w-5" />}
                        </Fragment>
                      ))}
                      <span className="rowlab">{r}</span>
                    </div>
                  ))}
                </div>
                {/* legend */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-[12px] text-white/60">
                  <span className="inline-flex items-center gap-2">
                    <span className="seat seat-sel !h-4 !w-4 !rounded-[4px]" />
                    Selected
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="seat seat-avail !h-4 !w-4 !rounded-[4px]" />
                    Available
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="seat seat-booked !h-4 !w-4 !rounded-[4px]" />
                    Booked
                  </span>
                </div>
              </div>
              <p className="mt-2 text-center text-[12px] text-muted">
                Tap a seat to select. Up to 8 seats per booking.
              </p>
            </div>
          )}

          {/* GA / online: quantity stepper */}
          {mode !== 'reserved' && (
            <div>
              <div className="rounded-2xl border border-hair bg-surface p-6 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={mode === 'online' ? 'hgi-video-01' : 'hgi-user-group'} size={22} />
                </span>
                <p className="mx-auto mt-3 max-w-sm text-[13px] text-muted">
                  {mode === 'online'
                    ? 'Online event — a join link is emailed after you register.'
                    : 'General admission — no assigned seats, first come first served.'}
                </p>
                <div className="mt-4 inline-flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => setQtyClamped(qty - 1)}
                    className="btn-icon bg-line"
                    aria-label="Fewer tickets"
                  >
                    <Icon name="hgi-minus-sign" size={18} />
                  </button>
                  <span className="tnum w-12 text-center text-[26px] font-extrabold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQtyClamped(qty + 1)}
                    className="btn-icon bg-line"
                    aria-label="More tickets"
                  >
                    <Icon name="hgi-add-01" size={18} />
                  </button>
                </div>
                <p className="mt-1 text-[12px] text-muted">tickets · up to 8</p>
              </div>
            </div>
          )}
        </section>

        {/* step 3: payment (paid events only) */}
        {!free && (
          <section className="mt-6">
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">
              3 · Payment
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
              {/* method + card */}
              <div className="card p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { method: 'card' as const, icon: 'hgi-credit-card', title: 'Card', sub: 'Visa · Mastercard' },
                      { method: 'promptpay' as const, icon: 'hgi-qr-code-01', title: 'PromptPay', sub: 'Thai QR · banking app' },
                    ]
                  ).map((m) => {
                    const on = payMethod === m.method
                    return (
                      <button
                        key={m.method}
                        type="button"
                        onClick={() => setPayMethod(m.method)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border bg-surface p-3 text-left transition hover:border-brand/40',
                          on ? 'border-brand ring-1 ring-brand' : 'border-hair',
                        )}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                          <Icon name={m.icon} size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-bold text-ink">{m.title}</span>
                          <span className="block text-[11.5px] text-muted">{m.sub}</span>
                        </span>
                        <span
                          className={cn(
                            'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                            on ? 'border-brand bg-brand text-white' : 'border-hair text-transparent',
                          )}
                        >
                          <Icon name="hgi-tick-02" size={12} />
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Where the card fields were.

                    PCI SAQ-A: this app never renders one. A card number and a
                    CVC used to live in React state here, bound to inputs with
                    `autoComplete="cc-number"` and `cc-csc` — which invites a
                    browser to fill a real stored card into this app's memory on
                    a page anyone can reach. The rule allows exactly two
                    endings, Stripe's hosted fields or nothing, and hosted
                    fields need a payment intent this demo page never creates.
                    So: nothing, until the real checkout lands.

                    The API is already built for it — `POST /payments/intent`
                    answers with a `clientSecret` for Card precisely so the
                    provider's own fields can take over, and never sees a PAN
                    either. */}
                {payMethod === 'card' && (
                  <div className="mt-4 rounded-xl border border-hair p-4">
                    <p className="text-[13px] font-semibold text-ink">
                      Card details are entered on the secure payment step
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      We never handle your card ourselves — it goes straight to our payment
                      provider. Choose PromptPay to complete this booking now.
                    </p>
                  </div>
                )}

                {/* promptpay panel */}
                {payMethod === 'promptpay' && (
                  <div className="mt-4">
                    <div className="rounded-xl border border-hair bg-canvas p-4 text-center">
                      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                        <Icon name="hgi-qr-code-01" size={22} />
                      </span>
                      <p className="mt-2 text-[13px] font-semibold text-ink">Pay with PromptPay</p>
                      <p className="mt-0.5 text-[12px] text-muted">
                        A QR code to scan with your banking app is shown after you continue.
                      </p>
                    </div>
                  </div>
                )}

                <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
                  <Icon name="hgi-square-lock-02" size={14} className="text-brand" />
                  Encrypted checkout · demo — no real payment is taken.
                </p>
              </div>

              {/* order summary */}
              <div className="card h-fit p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Order summary
                </p>
                <div className="mt-3 space-y-2 text-[13px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">{count > 0 ? `${count} × ${tier.name}` : 'Tickets'}</span>
                    <span className="tnum font-semibold text-ink">{money(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">Service fee</span>
                    <span className="tnum font-semibold text-ink">{money(fee)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-hair pt-2">
                    <span className="font-semibold text-ink">Total</span>
                    <span className="tnum text-[16px] font-extrabold text-brand">{money(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ============ sticky summary bar ============ */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hair bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="min-w-0">
            {mode === 'reserved' && count === 0 ? (
              <>
                <p className="truncate text-[13px] font-semibold text-ink">No seats selected</p>
                <p className="text-[12px] text-muted">Select seats to continue</p>
              </>
            ) : (
              <>
                <p className="truncate text-[13px] font-semibold text-ink">
                  {mode === 'reserved'
                    ? `${count} ${count === 1 ? 'seat' : 'seats'} · ${sorted}`
                    : `${count} ${count === 1 ? 'ticket' : 'tickets'} · ${tier.name}`}
                </p>
                <p className="text-[12px] text-muted">
                  {free ? (
                    'Free admission'
                  ) : (
                    <>
                      Total · <span className="font-semibold text-ink">{money(total)}</span>
                    </>
                  )}
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="btn btn-primary shrink-0"
          >
            {free ? (
              <>
                <Icon name="hgi-ticket-02" size={16} />
                Confirm registration
              </>
            ) : (
              <>
                <Icon name="hgi-square-lock-02" size={16} />
                {confirmDisabled ? 'Pay' : 'Pay ' + money(total)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ============ success overlay ============ */}
      <div
        className="fixed inset-0 z-40 place-items-center bg-black/50 p-4"
        style={{ display: done ? 'grid' : 'none' }}
      >
        <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-xl">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
            <Icon name="hgi-checkmark-circle-02" size={30} />
          </span>
          <h3 className="mt-4 text-[18px] font-bold tracking-tight">You're registered!</h3>
          <p className="mt-1 text-[13px] text-muted">
            Your{' '}
            {mode === 'reserved' ? (
              <>
                {tier.name}
                {count === 1 ? ' seat ' : ' seats '}
                <Bold>{sorted}</Bold>
              </>
            ) : (
              <>
                <Bold>{count}</Bold> {tier.name}
                {count === 1 ? ' ticket' : ' tickets'}
              </>
            )}{' '}
            for <Bold>{ev.title || 'the event'}</Bold> {verb} booked.
            {free ? (
              ' Free admission — no payment needed.'
            ) : (
              <>
                {' '}
                You paid <Bold>{money(total)}</Bold> via {payMethod === 'card' ? 'card' : 'PromptPay'}.
              </>
            )}
            {mode === 'online' ? ' A join link will be emailed to you.' : ''}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link to="/portal/my-events" className="btn btn-primary w-full">
              <Icon name="hgi-ticket-02" size={16} />
              View my tickets
            </Link>
            <Link to="/portal/discover" className="btn btn-soft w-full">
              Back to Eventa
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
