import { useEffect, useId, useRef, useState } from 'react'
import { Link, useFetcher, useLoaderData } from 'react-router'
import { Icon, Input, Label } from '@/components/ui'
import { useTheme } from '@/lib/useTheme'
import { cn } from '@/lib/cn'
import { qrDataUrl } from '../lib/qr'
import type { RegisterData, RegisterResult } from '../register.routes'
import type {
  CheckoutView,
  PaymentStep,
  PlacedOrder,
  SeatRow,
  SummaryLines,
  TierOption,
} from '../register.types'

/**
 * Registering for an event (portal/register.html), on the public checkout.
 *
 * The kit invented its own second tier at 2.5× the first, a seat map with
 * hard-coded booked seats, and a 5% service fee computed in the browser. All
 * three are now the API's: the tiers it sells, the seats it actually has, and
 * a total it worked out — because the total charged is the one that counts.
 *
 * PCI SAQ-A: no card field appears here or anywhere in this app. Choosing Card
 * hands off to the payment provider, which owns the fields and the card number;
 * this page never holds either.
 */

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

export default function PortalRegisterPage() {
  const { checkout } = useLoaderData() as RegisterData
  const [tierId, setTierId] = useState(() => firstSellable(checkout.tiers))
  const [quantity, setQuantity] = useState(1)
  const [seatIds, setSeatIds] = useState<number[]>([])
  const [method, setMethod] = useState<'Card' | 'PromptPay'>('Card')
  const [discountCode, setDiscountCode] = useState('')

  const { eventId, mode } = checkout
  const tier = checkout.tiers.find((option) => option.id === tierId) ?? null
  const count = mode === 'reserved' ? seatIds.length : quantity

  const quote = useFetcher<RegisterResult>()
  const booking = useFetcher<RegisterResult>()

  const summary = quote.data?.ok && quote.data.intent === 'quote' ? quote.data.summary : null
  const booked = booking.data?.ok && booking.data.intent === 'book' ? booking.data : null
  const error = errorOf(booking.data) ?? errorOf(quote.data)

  // `quote` is a fresh object on every render, and this page re-renders on each
  // of the fetcher's own state changes. Held in a ref rather than listed as a
  // dependency, because otherwise asking for a total would re-arm the effect
  // that asked for it — see `useSearchBox`, which has the same shape.
  const ask = useRef(quote.submit)
  useEffect(() => {
    ask.current = quote.submit
  })

  // Ask the API what this costs whenever the order changes. Never worked out
  // here: the fee, any discount and the VAT are the server's arithmetic.
  const chosenTierId = tier?.id
  useEffect(() => {
    if (!chosenTierId || count < 1) return
    ask.current(quoteBody(eventId, mode, chosenTierId, quantity, seatIds, discountCode), {
      method: 'post',
    })
  }, [eventId, mode, chosenTierId, quantity, seatIds, discountCode, count])

  return (
    <div className="h-full bg-canvas font-sans text-ink antialiased">
      <style>{SEAT_CSS}</style>
      <TopBar backTo={checkout.header.backTo} />

      <main className="mx-auto max-w-4xl px-4 pb-36 pt-6 lg:px-6">
        <EventHeading header={checkout.header} />

        <section className="mb-6">
          <StepHeading>1 · Ticket type</StepHeading>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {checkout.tiers.map((option) => (
              <TierButton
                key={option.id}
                tier={option}
                selected={option.id === tierId}
                onSelect={() => setTierId(option.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <StepHeading>
            {checkout.mode === 'reserved' ? '2 · Choose your seats' : '2 · How many tickets?'}
          </StepHeading>
          {checkout.mode === 'reserved' ? (
            <SeatPicker
              rows={checkout.rows}
              selected={seatIds}
              max={tier?.maxPerOrder ?? checkout.maxPerBooking}
              onToggle={(id) => setSeatIds(toggleSeat(seatIds, id, tier?.maxPerOrder ?? 0))}
            />
          ) : (
            <QuantityPicker
              mode={checkout.mode}
              quantity={quantity}
              min={tier?.minPerOrder ?? 1}
              max={tier?.maxPerOrder ?? checkout.maxPerBooking}
              onChange={setQuantity}
            />
          )}
          {checkout.notes.map((note) => (
            <p key={note} className="mt-2 text-center text-[12px] text-muted">
              {note}
            </p>
          ))}
        </section>

        <section className="mt-6">
          <StepHeading>3 · Your details</StepHeading>
          <BuyerFields />
        </section>

        {checkout.paymentRequired && (
          <section className="mt-6">
            <StepHeading>4 · Payment</StepHeading>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
              <PaymentMethods
                method={method}
                onChange={setMethod}
                discountCode={discountCode}
                onDiscountCode={setDiscountCode}
              />
              <OrderSummary summary={summary} pending={quote.state !== 'idle'} />
            </div>
          </section>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </main>

      <StickyBar
        checkout={checkout}
        tier={tier}
        count={count}
        quantity={quantity}
        seatIds={seatIds}
        method={method}
        discountCode={discountCode}
        summary={summary}
        fetcher={booking}
      />

      {booked && <SuccessOverlay order={booked.order} payment={booked.payment} />}
    </div>
  )
}

/* ── the order, as form fields ────────────────────────────────────────── */

/**
 * The one description of an order, shared by the quote and the booking.
 *
 * A `FormData` rather than an object so `seatId` can repeat — the action reads
 * the seats with `getAll`, exactly as the booking form submits them. Seats and
 * a quantity are alternatives, never both: sending a quantity for a reserved
 * event would ask the API for tickets to seats nobody picked.
 */
function quoteBody(
  eventId: string,
  mode: CheckoutView['mode'],
  ticketTypeId: string,
  quantity: number,
  seatIds: number[],
  discountCode: string,
): FormData {
  const body = new FormData()
  body.set('intent', 'quote')
  body.set('eventId', eventId)
  body.set('ticketTypeId', ticketTypeId)
  body.set('discountCode', discountCode)
  if (mode === 'reserved') seatIds.forEach((id) => body.append('seatId', String(id)))
  else body.set('quantity', String(quantity))
  return body
}

function errorOf(result: RegisterResult | undefined): string | null {
  return result && !result.ok ? result.error : null
}

function firstSellable(tiers: TierOption[]): string {
  return (tiers.find((tier) => tier.selectable) ?? tiers[0])?.id ?? ''
}

function toggleSeat(selected: number[], id: number, max: number): number[] {
  if (selected.includes(id)) return selected.filter((seat) => seat !== id)
  return selected.length >= max ? selected : [...selected, id]
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function StepHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">{children}</h2>
  )
}

function TopBar({ backTo }: { backTo: string }) {
  const { dark, toggle } = useTheme()

  return (
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
  )
}

function EventHeading({ header }: { header: CheckoutView['header'] }) {
  return (
    <div className="mb-5">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-brand">Register</p>
      <h1 className="mt-1 text-[24px] font-extrabold tracking-tight sm:text-[28px]">
        {header.name}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="hgi-calendar-03" size={15} />
          {header.when}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="hgi-location-01" size={15} />
          {header.where}
        </span>
        <span className="inline-flex items-center gap-1.5">by {header.organizer}</span>
      </p>
    </div>
  )
}

function TierButton({
  tier,
  selected,
  onSelect,
}: {
  tier: TierOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!tier.selectable}
      className={cn(
        'flex items-center justify-between rounded-xl border p-3.5 text-left transition',
        selected
          ? 'border-brand bg-brand-soft ring-1 ring-brand'
          : 'border-hair bg-surface hover:border-brand/40',
        !tier.selectable && 'cursor-not-allowed opacity-55 hover:border-hair',
      )}
    >
      <span>
        <span className="block text-[14px] font-bold text-ink">{tier.name}</span>
        <span className="block text-[12px] text-muted">
          {tier.unavailableReason ?? `Up to ${tier.maxPerOrder} per booking`}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span className={cn('text-[15px] font-bold', selected ? 'text-brand' : 'text-ink')}>
          {tier.price}
        </span>
        <span
          className={cn(
            'grid h-5 w-5 place-items-center rounded-full border',
            selected ? 'border-brand bg-brand text-white' : 'border-hair text-transparent',
          )}
        >
          <Icon name="hgi-tick-02" size={12} />
        </span>
      </span>
    </button>
  )
}

function QuantityPicker({
  mode,
  quantity,
  min,
  max,
  onChange,
}: {
  mode: CheckoutView['mode']
  quantity: number
  min: number
  max: number
  onChange: (step: (current: number) => number) => void
}) {
  // Stepped from the current value rather than from the rendered one: two taps
  // in quick succession both read the same render's `quantity`, and would land
  // on the same number.
  const step = (by: number) => onChange((current) => Math.max(min, Math.min(max, current + by)))

  return (
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
          onClick={() => step(-1)}
          disabled={quantity <= min}
          className="btn-icon bg-line"
          aria-label="Fewer tickets"
        >
          <Icon name="hgi-minus-sign" size={18} />
        </button>
        <span className="tnum w-12 text-center text-[26px] font-extrabold">{quantity}</span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={quantity >= max}
          className="btn-icon bg-line"
          aria-label="More tickets"
        >
          <Icon name="hgi-add-01" size={18} />
        </button>
      </div>
      <p className="mt-1 text-[12px] text-muted">tickets · up to {max}</p>
    </div>
  )
}

function SeatPicker({
  rows,
  selected,
  max,
  onToggle,
}: {
  rows: SeatRow[]
  selected: number[]
  max: number
  onToggle: (id: number) => void
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-hair bg-surface p-6 text-center text-[13px] text-muted">
        Seats for this event are not on sale yet.
      </div>
    )
  }

  return (
    <div>
      <div className="house overflow-hidden rounded-2xl p-5 sm:p-7">
        <div className="mb-6 flex flex-col items-center">
          <svg viewBox="0 0 400 34" className="w-full max-w-md" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="stageg" x1="0" x2="1">
                <stop offset="0" stopColor="#1ba770" stopOpacity="0" />
                <stop offset=".5" stopColor="#1ba770" />
                <stop offset="1" stopColor="#1ba770" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M8 30 Q200 2 392 30" fill="none" stroke="url(#stageg)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="mt-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-white/45">
            Stage
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 overflow-x-auto">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-1.5 sm:gap-2">
              <span className="rowlab">{row.label}</span>
              {row.seats.map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  disabled={!seat.available}
                  aria-pressed={selected.includes(seat.id)}
                  aria-label={`Seat ${row.label}${seat.label}`}
                  className={cn(
                    'seat',
                    !seat.available
                      ? 'seat-booked'
                      : selected.includes(seat.id)
                        ? 'seat-sel'
                        : 'seat-avail',
                  )}
                  onClick={() => onToggle(seat.id)}
                >
                  {seat.label}
                </button>
              ))}
              <span className="rowlab">{row.label}</span>
            </div>
          ))}
        </div>

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
        Tap a seat to select. Up to {max} seats per booking.
      </p>
    </div>
  )
}

/**
 * Who is booking.
 *
 * The API needs a name and an email to issue a ticket, and confirming here
 * creates no account — this is a guest checkout. The fields are uncontrolled
 * and read straight off the submitted form, so nothing typed is held in this
 * app's state for longer than the request.
 */
function BuyerFields() {
  const id = useId()

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-hair bg-surface p-4 sm:grid-cols-3 sm:p-5">
      <div>
        <Label htmlFor={`${id}-name`}>Full name</Label>
        <Input
          id={`${id}-name`}
          form="booking"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Anan Suksawat"
        />
      </div>
      <div>
        <Label htmlFor={`${id}-email`}>Email</Label>
        <Input
          id={`${id}-email`}
          form="booking"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor={`${id}-phone`}>Phone (optional)</Label>
        <Input
          id={`${id}-phone`}
          form="booking"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+66 81 234 5678"
        />
      </div>
    </div>
  )
}

const METHODS = [
  { method: 'Card' as const, icon: 'hgi-credit-card', title: 'Card', sub: 'Visa · Mastercard' },
  { method: 'PromptPay' as const, icon: 'hgi-qr-code-01', title: 'PromptPay', sub: 'Thai QR · banking app' },
]

function PaymentMethods({
  method,
  onChange,
  discountCode,
  onDiscountCode,
}: {
  method: 'Card' | 'PromptPay'
  onChange: (next: 'Card' | 'PromptPay') => void
  discountCode: string
  onDiscountCode: (next: string) => void
}) {
  const id = useId()

  return (
    <div className="card p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        {METHODS.map((option) => {
          const on = method === option.method
          return (
            <button
              key={option.method}
              type="button"
              onClick={() => onChange(option.method)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border bg-surface p-3 text-left transition hover:border-brand/40',
                on ? 'border-brand ring-1 ring-brand' : 'border-hair',
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                <Icon name={option.icon} size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-ink">{option.title}</span>
                <span className="block text-[11.5px] text-muted">{option.sub}</span>
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

      {/* PCI SAQ-A: no card field, here or anywhere in this app. A card number
          and a CVC once lived in React state on this page, bound to inputs with
          `autoComplete="cc-number"` — which invites a browser to fill a real
          stored card into this app's memory on a page anyone can reach. The
          rule allows two endings, the provider's own hosted fields or nothing,
          and the hand-off happens after the order exists. */}
      {method === 'Card' && (
        <div className="mt-4 rounded-xl border border-hair p-4">
          <p className="text-[13px] font-semibold text-ink">
            Card details are entered on the secure payment step
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            We never handle your card ourselves — it goes straight to our payment provider.
          </p>
        </div>
      )}

      {method === 'PromptPay' && (
        <div className="mt-4 rounded-xl border border-hair bg-canvas p-4 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
            <Icon name="hgi-qr-code-01" size={22} />
          </span>
          <p className="mt-2 text-[13px] font-semibold text-ink">Pay with PromptPay</p>
          <p className="mt-0.5 text-[12px] text-muted">
            A QR code to scan with your banking app is shown after you continue.
          </p>
        </div>
      )}

      <div className="mt-4">
        <Label htmlFor={`${id}-code`}>Discount code</Label>
        <Input
          id={`${id}-code`}
          value={discountCode}
          onChange={(e) => onDiscountCode(e.target.value.toUpperCase())}
          type="text"
          placeholder="EARLYBIRD"
          autoComplete="off"
        />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
        <Icon name="hgi-square-lock-02" size={14} className="text-brand" />
        Encrypted checkout · your card never reaches Eventa.
      </p>
    </div>
  )
}

/** Every figure here is the API's. Nothing on this page adds up money. */
function OrderSummary({ summary, pending }: { summary: SummaryLines | null; pending: boolean }) {
  return (
    <div className="card h-fit p-4 sm:p-5" aria-busy={pending}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Order summary</p>
      {summary === null ? (
        <p className="mt-3 text-[13px] text-muted">
          {pending ? 'Working out your total…' : 'Choose your tickets to see the total.'}
        </p>
      ) : (
        <div className="mt-3 space-y-2 text-[13px]">
          <SummaryRow label={summary.ticketsLabel} value={summary.subtotal} />
          {summary.discount && <SummaryRow label="Discount" value={summary.discount} />}
          <SummaryRow label="Service fee" value={summary.serviceFee} />
          <div className="flex items-center justify-between gap-2 border-t border-hair pt-2">
            <span className="font-semibold text-ink">Total</span>
            <span className="tnum text-[16px] font-extrabold text-brand">{summary.total}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="tnum font-semibold text-ink">{value}</span>
    </div>
  )
}

function StickyBar({
  checkout,
  tier,
  count,
  quantity,
  seatIds,
  method,
  discountCode,
  summary,
  fetcher,
}: {
  checkout: CheckoutView
  tier: TierOption | null
  count: number
  quantity: number
  seatIds: number[]
  method: 'Card' | 'PromptPay'
  discountCode: string
  summary: SummaryLines | null
  fetcher: ReturnType<typeof useFetcher<RegisterResult>>
}) {
  // One key per attempt, so a double-submitted booking is recognised by the
  // API as the same one rather than charged twice.
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const booking = fetcher.state !== 'idle'
  const ready = tier !== null && tier.selectable && count >= tier.minPerOrder

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hair bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">
            {ready && tier
              ? `${count} ${count === 1 ? 'ticket' : 'tickets'} · ${tier.name}`
              : checkout.mode === 'reserved'
                ? 'No seats selected'
                : 'Choose a ticket type'}
          </p>
          <p className="text-[12px] text-muted">
            {checkout.paymentRequired ? (
              summary ? (
                <>
                  Total · <span className="font-semibold text-ink">{summary.total}</span>
                </>
              ) : (
                'Working out your total…'
              )
            ) : (
              'Free admission'
            )}
          </p>
        </div>

        <fetcher.Form method="post" id="booking" className="shrink-0">
          <input type="hidden" name="intent" value="book" />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <input type="hidden" name="method" value={method} />
          <input type="hidden" name="discountCode" value={discountCode} />
          <input type="hidden" name="eventId" value={checkout.eventId} />
          <input type="hidden" name="ticketTypeId" value={tier?.id ?? ''} />
          {checkout.mode === 'reserved' ? (
            seatIds.map((id) => <input key={id} type="hidden" name="seatId" value={id} />)
          ) : (
            <input type="hidden" name="quantity" value={quantity} />
          )}
          <button type="submit" disabled={!ready || booking} className="btn btn-primary">
            <Icon name={checkout.paymentRequired ? 'hgi-square-lock-02' : 'hgi-ticket-02'} size={16} />
            {booking
              ? 'Booking…'
              : checkout.paymentRequired
                ? `Pay ${summary?.total ?? ''}`.trim()
                : 'Confirm registration'}
          </button>
        </fetcher.Form>
      </div>
    </div>
  )
}

/**
 * What happened, once the order exists.
 *
 * "Registered" and "paid" are separate facts, and this never conflates them: a
 * free registration is finished, a PromptPay one ends in a QR somebody still
 * has to scan, and a card one is completed by the provider's own fields.
 */
function SuccessOverlay({ order, payment }: { order: PlacedOrder; payment: PaymentStep | null }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-xl">
        <span
          className={cn(
            'mx-auto grid h-14 w-14 place-items-center rounded-full',
            payment?.state === 'failed' ? 'bg-red-100 text-red-600' : 'bg-brand-soft text-brand',
          )}
        >
          <Icon
            name={payment?.state === 'failed' ? 'hgi-alert-02' : 'hgi-checkmark-circle-02'}
            size={30}
          />
        </span>
        <h3 className="mt-4 text-[18px] font-bold tracking-tight">
          {payment?.state === 'failed' ? 'Payment could not be started' : "You're registered!"}
        </h3>
        {/* No claim about an email: whether one is actually delivered is the
            worker's business and not something this screen can know. The order
            link below is the thing that always works. */}
        <p className="mt-1 text-[13px] text-muted">
          {order.ticketCount} {order.ticketCount === 1 ? 'ticket' : 'tickets'} for{' '}
          <span className="font-semibold text-ink">{order.eventName}</span>, held under{' '}
          <span className="font-semibold text-ink">{order.reference}</span>.
        </p>

        <PaymentNext order={order} payment={payment} />

        <div className="mt-5 flex flex-col gap-2">
          {/* The guest's own copy — reached by the order id, so somebody who
              registered without an account is not sent to sign in to one. */}
          <Link to={`/my/tickets/orders/${order.orderId}`} className="btn btn-primary w-full">
            <Icon name="hgi-ticket-02" size={16} />
            View my tickets
          </Link>
          <Link to="/portal/discover" className="btn btn-soft w-full">
            Back to Eventa
          </Link>
        </div>
      </div>
    </div>
  )
}

function PaymentNext({ order, payment }: { order: PlacedOrder; payment: PaymentStep | null }) {
  if (!order.paymentRequired || payment === null) {
    return <p className="mt-2 text-[13px] text-brand">Free admission — there is nothing to pay.</p>
  }

  if (payment.state === 'failed') {
    return (
      <p role="alert" className="mt-2 text-[13px] text-red-500">
        {payment.declineReason ?? 'The payment could not be started. Please try again.'}
      </p>
    )
  }

  if (payment.state === 'scan' && payment.promptPayQr) {
    // The API sends the EMV payload a Thai banking app expects, not a picture.
    // Drawing it is this app's job; its contents are never invented here.
    const qr = qrDataUrl(payment.promptPayQr)
    return (
      <div className="mt-3">
        <p className="text-[13px] text-muted">
          Scan this with your banking app to pay{' '}
          <span className="font-semibold text-ink">{payment.amount}</span>. Your tickets are issued
          the moment it clears.
        </p>
        {qr ? (
          <img
            src={qr}
            alt={`PromptPay QR code for ${payment.amount}`}
            className="mx-auto mt-3 h-44 w-44 rounded-xl bg-white p-2"
          />
        ) : (
          <p role="alert" className="mt-2 text-[13px] text-red-500">
            The QR code could not be drawn. Check your email to finish paying.
          </p>
        )}
      </div>
    )
  }

  // Card: the provider owns the fields and the card number, so the buyer
  // finishes there. This app has never seen either (PCI SAQ-A).
  return (
    <p className="mt-2 text-[13px] text-muted">
      {payment.amount} is being taken by our payment provider — check your email to finish it. Your
      tickets are issued the moment it clears.
    </p>
  )
}
