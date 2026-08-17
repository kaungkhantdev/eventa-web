import { Link, useLoaderData } from 'react-router'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useTheme } from '@/lib/useTheme'
import type { GuestOrder, GuestTicket, OrderState } from '../guestOrder.types'

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
 * asking about.
 */

const TONES: Record<OrderState['tone'], string> = {
  green: 'bg-brand-soft text-brand',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  gray: 'bg-line text-muted',
}

export default function GuestOrderPage() {
  const { order } = useLoaderData() as { order: GuestOrder }
  const { dark, toggle } = useTheme()

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
        <Summary order={order} />

        {order.tickets.length > 0 ? (
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
        ) : (
          <NoTicketsYet awaiting={order.awaitingPayment} />
        )}

        <Receipt order={order} />
        <KeepThem order={order} />

        <p className="mt-8 text-center text-[11px] text-muted/70">
          Keep this link — it is how you get back to these tickets.
        </p>
      </main>
    </div>
  )
}

function Summary({ order }: { order: GuestOrder }) {
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
            TONES[order.state.tone],
          )}
        >
          {order.state.label}
        </span>
      </div>
      <p className="mt-3 text-[13px] text-muted">{order.state.detail}</p>
    </section>
  )
}

/**
 * The code, as text.
 *
 * Not a rendered QR: this app has no encoder, and drawing a plausible-looking
 * square that scans as nothing would be worse than printing the token the door
 * can be told. The station accepts a typed code for exactly this reason.
 */
function TicketCard({ ticket }: { ticket: GuestTicket }) {
  return (
    <div className="card flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-ink">{ticket.holder}</p>
        <p className="text-[12px] text-muted">{ticket.label}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] uppercase tracking-wider text-muted">Code</p>
        <code className="tnum text-[15px] font-bold tracking-wide text-ink">{ticket.qrToken}</code>
      </div>
    </div>
  )
}

function NoTicketsYet({ awaiting }: { awaiting: boolean }) {
  return (
    <section className="card mt-4 p-6 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-line text-muted">
        <Icon name="hgi-ticket-02" size={24} />
      </span>
      <p className="mt-3 text-[14px] font-semibold">
        {awaiting ? 'No tickets yet' : 'Nothing to show'}
      </p>
      <p className="mt-1 text-[13px] text-muted">
        {awaiting
          ? 'They appear here as soon as the payment clears — no need to book again.'
          : 'This order has no tickets attached to it.'}
      </p>
    </section>
  )
}

function Receipt({ order }: { order: GuestOrder }) {
  return (
    <section className="card mt-4 p-5">
      <h2 className="text-[15px] font-bold tracking-tight">What you paid</h2>
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
 * The account offer, at the one moment it is worth making.
 *
 * They have already given their name and email, so signing up is a password —
 * and their saved events merge on the way in, which is why the shortlist kept
 * locally while browsing is not lost.
 */
function KeepThem({ order }: { order: GuestOrder }) {
  return (
    <section className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold tracking-tight">Keep these tickets</h2>
        <p className="mt-0.5 text-[12.5px] text-muted">
          Create an account for {order.buyerEmail} and every booking is in one place.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          to={`/portal/login?from=${encodeURIComponent(`/my/tickets/orders/${order.orderId}`)}`}
          className="btn btn-soft"
        >
          Sign in
        </Link>
        <Link to="/auth/register" className="btn btn-primary">
          Create account
        </Link>
      </div>
    </section>
  )
}
