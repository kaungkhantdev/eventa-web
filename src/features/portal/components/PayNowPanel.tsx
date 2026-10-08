import { useEffect, useRef } from 'react'
import { Link, useFetcher, useRevalidator } from 'react-router'
import { Icon } from '@/components/ui'
import type { PayResult } from '../guestOrder.routes'
import type { Remaining } from '../lib/countdown'
import { PaymentHandoff } from './PaymentHandoff'

/**
 * Finishing a payment that was never finished (US-DISC-05).
 *
 * The gap this closes: an order reached from the confirmation email, or by
 * clicking away from the provider's page, showed "awaiting payment" and offered
 * no way to pay. The buyer's only route back was to book again — which, while
 * their own seats were still held, would often fail.
 *
 * The countdown is the honest part. Seats are held for minutes, not forever,
 * and a page that says "awaiting payment" indefinitely is lying by the time
 * anybody reads it twice.
 */

/** How often to re-read the order while a PromptPay code is on screen. */
const POLL_MS = 5_000

interface PayNowProps {
  orderId: string
  total: string
  countdown: Remaining
}

export function PayNowPanel({ orderId, total, countdown }: PayNowProps) {
  const fetcher = useFetcher<PayResult>()
  const result = fetcher.data
  const busy = fetcher.state !== 'idle'

  return (
    <section className="card mt-4 border-amber-300/60 p-5 dark:border-amber-500/30">
      <Deadline countdown={countdown} />
      {result?.payment ? (
        <PaymentHandoff payment={result.payment} />
      ) : (
        <MethodChoice fetcher={fetcher} orderId={orderId} total={total} busy={busy} />
      )}
      {result?.error && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {result.error}
        </p>
      )}
      {/* A scanned code clears out of band, so nothing here would ever change. */}
      {result?.payment?.state === 'scan' && <PollWhileScanning />}
    </section>
  )
}

/** The clock, and what runs out with it. */
function Deadline({ countdown }: { countdown: Remaining }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
        <Icon name="hgi-time-quarter-pass" size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-bold tracking-tight">
          Seats held for{' '}
          <span className="tnum text-amber-700 dark:text-amber-300">{countdown.label}</span>
        </p>
        <p className="text-[12.5px] text-muted">
          Pay before the timer runs out or they go back on sale.
        </p>
      </div>
    </div>
  )
}

/**
 * Card or PromptPay, as two plain submits.
 *
 * A form per method rather than a radio and one button: the choice IS the
 * action, and there is no state worth holding between picking and paying.
 */
interface MethodChoiceProps {
  fetcher: ReturnType<typeof useFetcher<PayResult>>
  orderId: string
  total: string
  busy: boolean
}

function MethodChoice({ fetcher, orderId, total, busy }: MethodChoiceProps) {
  const action = `/my/tickets/orders/${orderId}`
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <fetcher.Form method="post" action={action}>
        <input type="hidden" name="method" value="Card" />
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          <Icon name="hgi-credit-card" size={16} />
          {busy ? 'Starting…' : `Pay ${total} by card`}
        </button>
      </fetcher.Form>
      <fetcher.Form method="post" action={action}>
        <input type="hidden" name="method" value="PromptPay" />
        <button type="submit" disabled={busy} className="btn btn-soft w-full">
          <Icon name="hgi-qr-code" size={16} />
          {busy ? 'Starting…' : 'Pay with PromptPay'}
        </button>
      </fetcher.Form>
    </div>
  )
}

/**
 * Re-read the order while a QR is on screen.
 *
 * A bank transfer settles through the provider's webhook, not through anything
 * this page did — so without this the buyer pays and watches a page that still
 * says they haven't. Revalidating replaces it with their tickets.
 */
function PollWhileScanning() {
  const { revalidate } = useRevalidator()
  // Held in a ref so the interval is set up once. Depending on `revalidate`
  // directly would tear down and rebuild the timer on every revalidation, and
  // it would never survive long enough to fire again.
  const latest = useRef(revalidate)

  useEffect(() => {
    latest.current = revalidate
  }, [revalidate])

  useEffect(() => {
    const timer = setInterval(() => void latest.current(), POLL_MS)
    return () => clearInterval(timer)
  }, [])

  return null
}

/**
 * The end of the line: the hold lapsed and the seats went back on sale.
 *
 * Says what happened and offers the only thing that can still work. Leaving a
 * "Pay now" here would take money for an order the API would then have to
 * refund, because the inventory is genuinely gone.
 */
export function ExpiredNotice({ backTo }: { backTo: string }) {
  return (
    <section className="card mt-4 p-6 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-line text-muted">
        <Icon name="hgi-time-quarter-pass" size={24} />
      </span>
      <p className="mt-3 text-[14px] font-semibold">This order expired</p>
      <p className="mt-1 text-[13px] text-muted">
        The seats were released because the payment was not completed in time. Nothing was charged.
      </p>
      <Link to={backTo} className="btn btn-primary mt-4">
        Browse events
      </Link>
    </section>
  )
}
