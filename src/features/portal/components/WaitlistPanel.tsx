import { useState } from 'react'
import { Link, type useFetcher } from 'react-router'
import { Icon } from '@/components/ui'
import type { CheckoutResult } from '../checkout.routes'
import type { TierOption, WaitlistPlace } from '../checkout.types'

/*
 * Joining a sold-out ticket's waitlist (US-REG-04), on the register page.
 *
 * The kit has no waitlist screen, so these are built from the page's own
 * pieces — its sticky bar, its success overlay — rather than a new look. What
 * they must say is the difference from booking: nothing is held, nothing is
 * charged, and a place comes later, by email, with a deadline to pay for it.
 */

/** Under the ticket types, once a sold-out one is chosen. */
export function WaitlistNote() {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-2xl border border-hair bg-surface p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon name="hgi-hourglass" size={18} />
      </span>
      <div className="min-w-0 text-[13px]">
        <p className="font-semibold text-ink">This ticket is sold out — join the waitlist</p>
        <p className="mt-0.5 text-muted">
          Nothing is charged now. If a place opens up we'll email you, and hold it for a limited
          time while you pay for it.
        </p>
      </div>
    </div>
  )
}

export function WaitlistBar({
  eventId,
  tier,
  quantity,
  fetcher,
}: {
  eventId: string
  tier: TierOption
  quantity: number
  fetcher: ReturnType<typeof useFetcher<CheckoutResult>>
}) {
  // One key per attempt: a double-tap finds the place it already took.
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const joining = fetcher.state !== 'idle'

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hair bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">
            {quantity} {quantity === 1 ? 'ticket' : 'tickets'} · {tier.name}
          </p>
          <p className="text-[12px] text-muted">Waitlist · nothing to pay now</p>
        </div>
        {/* `id="booking"`: the buyer's details are fields of this form, as
            they are of the booking form this replaces. */}
        <fetcher.Form method="post" id="booking" className="shrink-0">
          <input type="hidden" name="intent" value="waitlist" />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="ticketTypeId" value={tier.id} />
          <input type="hidden" name="quantity" value={quantity} />
          <button type="submit" disabled={joining} className="btn btn-primary">
            <Icon name="hgi-hourglass" size={16} />
            {joining ? 'Joining…' : 'Join the waitlist'}
          </button>
        </fetcher.Form>
      </div>
    </div>
  )
}

export function WaitlistOverlay({ place }: { place: WaitlistPlace }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-labelledby="waitlist-joined"
        className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-xl"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="hgi-hourglass" size={30} />
        </span>
        <h3 id="waitlist-joined" className="mt-4 text-[18px] font-bold tracking-tight">
          You're on the waitlist
        </h3>
        <p className="mt-1 text-[13px] font-semibold text-brand">{place.place}</p>
        <p className="mt-2 text-[13px] text-muted">
          {place.ticketsLabel} for <span className="font-semibold text-ink">{place.eventName}</span>
          , under <span className="font-semibold text-ink">{place.reference}</span>. If a place opens
          up we'll email you a link to pay for it.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {/* The same page the offer will link to — no account needed. */}
          <Link to={`/my/tickets/orders/${place.orderId}`} className="btn btn-soft w-full">
            <Icon name="hgi-ticket-02" size={16} />
            View my place
          </Link>
          <Link to="/portal/discover" className="btn btn-soft w-full">
            Back to Eventa
          </Link>
        </div>
      </div>
    </div>
  )
}
