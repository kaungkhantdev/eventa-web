import { useEffect } from 'react'
import { Icon } from '@/components/ui'
import { qrDataUrl } from '../lib/qr'
import type { PaymentStep } from '../checkout.types'

/**
 * How the buyer actually pays, once the API has started a payment.
 *
 * Shared by the register page and the order page because it is the same moment
 * in both: the money is owed, the API has said how to collect it, and the only
 * question is whether that is a code to scan or a page to visit. The two used
 * to diverge — an order reached from the confirmation email offered no way to
 * pay at all.
 *
 * PCI SAQ-A: no card field appears here or anywhere in this app. Card hands off
 * to the provider, which owns the fields and the card number; this component
 * only ever holds a URL.
 */

/** Long enough to read what was booked, short enough not to feel stuck. */
const HANDOFF_MS = 1_200

export function PaymentHandoff({ payment }: { payment: PaymentStep }) {
  if (payment.state === 'failed') {
    return (
      <p role="alert" className="mt-2 text-[13px] text-red-500">
        {payment.declineReason ?? 'The payment could not be started. Please try again.'}
      </p>
    )
  }
  if (payment.state === 'scan' && payment.promptPayQr) {
    return <PromptPayScan payment={payment} />
  }
  return <CardHandoff payment={payment} />
}

/**
 * The PromptPay code, drawn here.
 *
 * The API sends the EMV payload a Thai banking app expects, not a picture.
 * Rendering it is this app's job; inventing its contents never is.
 */
function PromptPayScan({ payment }: { payment: PaymentStep }) {
  const qr = payment.promptPayQr ? qrDataUrl(payment.promptPayQr) : null

  if (!qr) {
    return (
      <p role="alert" className="mt-2 text-[13px] text-red-500">
        The QR code could not be drawn. Check your email to finish paying.
      </p>
    )
  }
  return (
    <div className="mt-3">
      <p className="text-[13px] text-muted">
        Scan this with your banking app to pay{' '}
        <span className="font-semibold text-ink">{payment.amount}</span>. Your tickets are issued the
        moment it clears.
      </p>
      <img
        src={qr}
        alt={`PromptPay QR code for ${payment.amount}`}
        className="mx-auto mt-3 h-44 w-44 rounded-xl bg-white p-2"
      />
    </div>
  )
}

/**
 * Off to the provider's own payment page.
 *
 * Auto-forwarded after a beat AND given a visible link: a redirect nobody asked
 * for is disorienting on its own, and a link alone is a step somebody will
 * miss. The link is also the way out if the redirect is blocked.
 *
 * There is nothing to fall back to if the provider gave us no page — saying so
 * beats sending somebody to a blank screen.
 */
function CardHandoff({ payment }: { payment: PaymentStep }) {
  const url = payment.checkoutUrl

  useEffect(() => {
    if (!url) return
    const timer = window.setTimeout(() => window.location.assign(url), HANDOFF_MS)
    return () => window.clearTimeout(timer)
  }, [url])

  if (!url) {
    return (
      <p role="alert" className="mt-2 text-[13px] text-red-500">
        The payment page could not be opened. Your order is saved — try again in a moment.
      </p>
    )
  }
  return (
    <div className="mt-3">
      <p className="text-[13px] text-muted">
        Taking you to our payment provider to pay{' '}
        <span className="font-semibold text-ink">{payment.amount}</span> securely. Your tickets are
        issued the moment it clears.
      </p>
      <a href={url} className="btn btn-primary mt-2 w-full">
        <Icon name="hgi-lock" size={16} />
        Continue to payment
      </a>
    </div>
  )
}
