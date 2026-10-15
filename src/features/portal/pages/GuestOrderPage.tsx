import { useEffect, useRef, useState } from 'react'
import { Link, useFetcher, useLoaderData, type FetcherWithComponents } from 'react-router'
import { EmptyState, Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useTheme } from '@/lib/useTheme'
import { ExpiredNotice, PayNowPanel } from '../components/PayNowPanel'
import {
  EXPIRED_STATE,
  accountOfferFor,
  guestOrderPath,
  receiptHeading,
} from '../guestOrder.mapper'
import { ACCOUNT_LINK_INTENT, type GuestOrderData } from '../guestOrder.routes'
import type {
  AccountLinkResult,
  AccountOffer,
  AccountOfferContext,
  GuestOrder,
  GuestTicket,
  OrderState,
} from '../guestOrder.types'
import { useCountdown } from '../lib/countdown'

/**
 * What a guest sees after registering (US-DISC-06/07).
 *
 * Reached by the order's id alone — the link in the confirmation email, and
 * where "You're registered!" now sends people. Before this existed the button
 * went to the attendee portal, which bounced a guest to a sign-in for an
 * account nobody had created.
 *
 * The account offer sits at the bottom rather than in the way: they have their
 * tickets either way, and this is the one moment when keeping them is worth
 * asking about. Only once there is a ticket to keep — see `accountOfferFor`.
 */

const TONES: Record<OrderState['tone'], string> = {
  green: 'bg-brand-soft text-brand',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  gray: 'bg-line text-muted',
}

/** Where somebody whose order lapsed can start again. */
const DISCOVER = '/portal/discover'

export default function GuestOrderPage() {
  const { order, ...account } = useLoaderData() as GuestOrderData
  const { dark, toggle } = useTheme()
  // The hold can lapse while this page is open, so the clock — not the status
  // the loader fetched — decides whether paying is still on offer.
  const countdown = useCountdown(order.holdExpiresAt)
  const canPay = order.payable && !countdown.lapsed
  const lapsed = order.awaitingPayment && !canPay
  const state = lapsed ? EXPIRED_STATE : order.state

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <header className="border-b border-hair bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 lg:px-6">
          <Link to="/portal/discover" className="flex items-center gap-2.5">
            <span className="brand-logo text-brand h-[17px] w-[31px]" />
            <span className="text-[15px] font-extrabold tracking-tight">Eventa</span>
          </Link>
          <button type="button" onClick={toggle} className="btn-icon" title="Toggle theme">
            <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
        <Summary order={order} state={state} />

        {canPay && (
          <PayNowPanel orderId={order.orderId} total={order.total} countdown={countdown} />
        )}
        {lapsed && <ExpiredNotice backTo={DISCOVER} />}

        {order.tickets.length > 0 && (
          <section className="mt-4">
            <h2 className="text-[15px] font-bold tracking-tight">
              {order.tickets.length === 1 ? 'Your ticket' : 'Your tickets'}
            </h2>
            <div className="mt-2 space-y-2">
              {order.tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </section>
        )}
        {/* Only the genuinely odd case. An unpaid, waiting or turned-down
            order is explained by the banner and panel above it, and saying
            "no tickets yet" underneath would be a second, vaguer answer to a
            question already answered. */}
        {order.tickets.length === 0 && !order.ticketsExplained && <NothingToShow />}

        <Receipt order={order} heading={receiptHeading({ canPay, paid: order.paid })} />
        <KeepThem order={order} account={account} />

        <p className="mt-8 text-center text-[11px] text-muted/70">
          Keep this link — it is how you get back to these tickets.
        </p>
      </main>
    </div>
  )
}

function Summary({ order, state }: { order: GuestOrder; state: OrderState }) {
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Order {order.reference}
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold tracking-tight">{order.eventName}</h1>
          <p className="mt-1 text-[12.5px] text-muted">
            Booked by {order.buyerName} · {order.placedOn}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold',
            TONES[state.tone],
          )}
        >
          {state.label}
        </span>
      </div>
      <p className="mt-3 text-[13px] text-muted">{state.detail}</p>
    </section>
  )
}

/**
 * One ticket: its scannable QR, a download of it, and the code as text.
 *
 * The QR encodes the ticket's own token, which is all the check-in station
 * scans. This is the page the confirmation email links to, so for a guest it
 * is the only place the ticket exists — no account, no sign-in (US-DISC-06).
 * A ticket that no longer admits is not drawn.
 */
function TicketCard({ ticket }: { ticket: GuestTicket }) {
  return (
    <div className="card flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-ink">{ticket.holder}</p>
        <p className="text-[12px] text-muted">{ticket.label}</p>
        <p className="mt-2 text-[11px] uppercase tracking-wider text-muted">Code</p>
        <code className="tnum text-[15px] font-bold tracking-wide text-ink">{ticket.qrToken}</code>
      </div>
      <TicketQr ticket={ticket} />
    </div>
  )
}

function TicketQr({ ticket }: { ticket: GuestTicket }) {
  if (!ticket.valid) {
    return <p className="shrink-0 text-[12px] font-semibold text-muted">No longer valid</p>
  }
  if (!ticket.qr) return null
  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <img
        src={ticket.qr}
        alt={`QR code for ${ticket.holder}'s ticket`}
        className="h-32 w-32 rounded-lg bg-white p-1.5 ring-1 ring-hair"
      />
      <a href={ticket.qr} download={ticket.download} className="btn btn-soft btn-sm">
        <Icon name="hgi-download-04" size={14} />
        Download
      </a>
    </div>
  )
}

/**
 * The shared empty block, not a hand-rolled copy of it.
 *
 * No action: the state banner at the top of the page has already said why an
 * order has no tickets — cancelled, refunded — and repeating it here would be
 * a second answer to a question already answered.
 */
function NothingToShow() {
  return (
    <section className="card mt-4">
      <EmptyState compact icon="hgi-ticket-02" title="Nothing to show">
        This order has no tickets attached to it.
      </EmptyState>
    </section>
  )
}

/**
 * The figures, under a heading that is actually true.
 *
 * Three different facts wear the same numbers: money that changed hands, money
 * still due, and money that never will because the order died. "What you paid"
 * above an unpaid order — which is what this said — is the kind of small lie
 * that makes somebody check their bank statement.
 */
function Receipt({ order, heading }: { order: GuestOrder; heading: string }) {
  return (
    <section className="card mt-4 p-5">
      <h2 className="text-[15px] font-bold tracking-tight">{heading}</h2>
      <dl className="mt-3 space-y-1.5 text-[13px]">
        {order.lines.map((line) => (
          <div key={line.name} className="flex justify-between gap-4">
            <dt className="text-muted">
              {line.name} × {line.quantity}
            </dt>
            <dd className="tnum text-ink">{line.total}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-hair pt-1.5">
          <dt className="text-muted">Subtotal</dt>
          <dd className="tnum text-ink">{order.subtotal}</dd>
        </div>
        {/* Absent, not zero: a discount nobody had is not a discount of ฿0. */}
        {order.discount && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Discount</dt>
            <dd className="tnum text-brand">−{order.discount}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-muted">VAT included</dt>
          <dd className="tnum text-muted">{order.vat}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-hair pt-1.5 text-[15px] font-bold">
          <dt>Total</dt>
          <dd className="tnum text-brand">{order.total}</dd>
        </div>
      </dl>
    </section>
  )
}

/**
 * The account offer, at the one moment it is worth making (US-DISC-15).
 *
 * An upsell, never a step: it can be dismissed, and the tickets above are the
 * same either way. Their saved events merge into the account on the way in,
 * which is why the shortlist kept locally while browsing is not lost.
 *
 * "Create account" makes no account and asks for no password here. Anybody
 * who books can type any address, and this page's link is in the booker's
 * own browser before anybody reads that inbox — so it proves nothing about
 * whose address it is. The button asks the API to email the booking's
 * address a one-time link, and the account is made only from that link.
 * Whether to make an offer at all, which one, and what the card says after,
 * is `accountOfferFor`'s call.
 */
function KeepThem({ order, account }: { order: GuestOrder; account: AccountOfferContext }) {
  const [dismissed, setDismissed] = useState(false)
  const link = useFetcher<AccountLinkResult>()
  const offer = accountOfferFor(order, account, link.data)
  if (dismissed || !offer) return null
  if (offer.kind === 'sent') return <LinkSent message={offer.message} />
  if (offer.kind === 'signed-in') return <AllBookings offer={offer} />

  return (
    <section className="card mt-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight">Keep these tickets</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">{offer.prompt}</p>
        </div>
        <OfferActions offer={offer} orderId={order.orderId} link={link} />
      </div>
      {offer.error && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {offer.error}
        </p>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-3 text-[12px] font-medium text-muted hover:text-ink"
      >
        {offer.dismiss}
      </button>
    </section>
  )
}

/**
 * "Sign in", always — the primary button when the address already has an
 * account — and "Create account" only when it does not, which asks for the
 * emailed link rather than opening a form.
 */
function OfferActions({
  offer,
  orderId,
  link,
}: {
  offer: Extract<AccountOffer, { kind: 'create' | 'sign-in' }>
  orderId: string
  link: FetcherWithComponents<AccountLinkResult>
}) {
  const sending = link.state !== 'idle'

  return (
    <div className="flex shrink-0 gap-2">
      <Link
        to={offer.signInTo}
        className={offer.kind === 'create' ? 'btn btn-soft' : 'btn btn-primary'}
      >
        Sign in
      </Link>
      {offer.kind === 'create' && (
        <link.Form method="post" action={guestOrderPath(orderId)}>
          <button
            type="submit"
            name="intent"
            value={ACCOUNT_LINK_INTENT}
            className="btn btn-primary"
            disabled={sending}
          >
            {sending ? 'Sending…' : 'Create account'}
          </button>
        </link.Form>
      )}
    </div>
  )
}

/**
 * Already signed in — back from signing in through the offer, or booked that
 * way — so there is nothing left to create or sign in to, only the place
 * every booking made with their address is listed.
 */
function AllBookings({ offer }: { offer: Extract<AccountOffer, { kind: 'signed-in' }> }) {
  return (
    <section className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold tracking-tight">Every booking in one place</h2>
        <p className="mt-0.5 text-[12.5px] text-muted">{offer.prompt}</p>
      </div>
      <Link to={offer.myEventsTo} className="btn btn-primary shrink-0">
        See all your bookings
      </Link>
    </section>
  )
}

/**
 * The link is on its way. This replaces the card, taking the focused button
 * with it, so focus moves to the sentence: a keyboard user keeps their place
 * and a screen reader reads it — a live region that arrives already holding
 * its text is often not announced.
 */
function LinkSent({ message }: { message: string }) {
  const sentence = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    sentence.current?.focus()
  }, [])

  return (
    <section className="card mt-4 flex items-start gap-3 p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon name="hgi-mail-send-01" size={20} />
      </span>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold tracking-tight">Check your email</h2>
        <p ref={sentence} tabIndex={-1} className="mt-0.5 text-[12.5px] text-muted">
          {message}
        </p>
      </div>
    </section>
  )
}
