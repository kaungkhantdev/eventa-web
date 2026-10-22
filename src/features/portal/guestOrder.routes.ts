import { ApiError, NetworkError, api, messageOf, session } from '@/lib/api'
import type { LoaderArgs } from '@/app/loaders'
import { authApi, type BookingAccount, type BookingClaimLink } from '@/features/auth/api'
import { toGuestOrder } from './guestOrder.mapper'
import type {
  AccountLinkResult,
  AccountOfferContext,
  GuestOrder,
  GuestOrderWire,
} from './guestOrder.types'
import { checkoutApi } from './checkout.api'
import { toPaymentStep } from './checkout.mapper'
import type { PaymentStep } from './checkout.types'
import { ACCOUNT_LINK_INTENT, GUEST_ORDER_METHODS } from '@/lib/constants/portal.constants'

/**
 * The buyer's own copy of their order (US-DISC-06/07).
 *
 * No guard, deliberately. Registration never required an account, so seeing
 * what you bought must not either — the order's id in the URL is the
 * capability, and it is what the confirmation email links to. A wrong id 404s
 * through the route's `errorElement` like any other missing thing.
 */

type Method = (typeof GUEST_ORDER_METHODS)[number]

const isMethod = (value: unknown): value is Method => GUEST_ORDER_METHODS.includes(value as Method)

/** What the pay action reports back: how to pay, or why the API said no. */
export interface PayResult {
  payment?: PaymentStep
  /** The API's own sentence, shown verbatim — it was written for the reader. */
  error?: string
}

/** The order, and what the account offer under it needs to know. */
export interface GuestOrderData extends AccountOfferContext {
  order: GuestOrder
}

/**
 * Whether the buyer already has an account, for the account offer (US-DISC-15).
 *
 * Supplementary, so a failure costs only the precision of the offer, never the
 * order page: it falls back to "Create account", and the API refuses a link for
 * an address that has an account, in a sentence that says to sign in. A
 * programming error is not absorbed.
 */
export async function knownAccount(check: Promise<BookingAccount>): Promise<boolean> {
  try {
    return (await check).accountExists
  } catch (cause) {
    if (cause instanceof ApiError || cause instanceof NetworkError) return false
    throw cause
  }
}

/**
 * Ask for the one-time link that turns this booking into an account
 * (US-DISC-15). It goes to the booking's own inbox, and nothing is created
 * until it is opened there and a password chosen.
 *
 * A refusal — the resend throttle, an account made since the page loaded —
 * comes back as the API's sentence to show beside the button, never thrown: an
 * error screen in place of somebody's tickets is the wrong answer to "not yet".
 */
export async function requestAccountLink(
  orderId: string,
  send: (orderId: string) => Promise<BookingClaimLink> = authApi.requestBookingClaimLink,
): Promise<AccountLinkResult> {
  try {
    return { sentTo: (await send(orderId)).sentTo }
  } catch (cause) {
    if (cause instanceof ApiError || cause instanceof NetworkError) {
      return { error: messageOf(cause) }
    }
    throw cause
  }
}

/**
 * Resume a payment that was never finished.
 *
 * The same endpoint the register page uses — an unpaid order is an unpaid
 * order, whether the buyer abandoned the redirect or closed the tab and came
 * back later. A FRESH idempotency key every time, because this is by
 * definition a new attempt: replaying the old one would hand back the dead
 * session they already walked away from, or a PromptPay code that has since
 * expired.
 *
 * A refusal comes back as a message rather than an exception. The 409 here is
 * the API declining an order it can no longer honour ("this order expired —
 * please book again"), and that belongs beside the button they pressed, not
 * on an error screen in place of their receipt.
 */
async function pay(orderId: string, method: FormDataEntryValue | null): Promise<PayResult> {
  if (!isMethod(method)) return { error: 'Choose a payment method.' }
  try {
    const intent = await checkoutApi.pay({
      orderId,
      method,
      idempotencyKey: crypto.randomUUID(),
    })
    return { payment: toPaymentStep(intent) }
  } catch (cause) {
    if (cause instanceof ApiError || cause instanceof NetworkError) {
      return { error: messageOf(cause) }
    }
    throw cause
  }
}

export const guestOrderRoute = {
  loader: async ({ params }: LoaderArgs): Promise<GuestOrderData> => {
    const orderId = String(params.orderId)
    // Read, never required: the page is open to anybody holding the link.
    const signedIn = session.persona() === 'attendee'
    const [wire, accountExists] = await Promise.all([
      api.get<GuestOrderWire>(`/public/orders/${orderId}`),
      knownAccount(authApi.bookingAccount(orderId)),
    ])
    return { order: toGuestOrder(wire, new Date()), accountExists, signedIn }
  },

  /** The page's two forms — paying, and asking for the account link. */
  action: async ({ params, request }: LoaderArgs): Promise<PayResult | AccountLinkResult> => {
    const form = await request.formData()
    const orderId = String(params.orderId)
    if (form.get('intent') === ACCOUNT_LINK_INTENT) return requestAccountLink(orderId)
    return pay(orderId, form.get('method'))
  },
}
