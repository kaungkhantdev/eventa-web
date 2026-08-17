import { ApiError, NetworkError, api, messageOf } from '@/lib/api'
import type { LoaderArgs } from '@/app/loaders'
import { toGuestOrder } from './guestOrder.mapper'
import type { GuestOrder, GuestOrderWire } from './guestOrder.types'
import { registerApi } from './register.api'
import { toPaymentStep } from './register.mapper'
import type { PaymentStep } from './register.types'

/**
 * The buyer's own copy of their order (US-DISC-06/07).
 *
 * No guard, deliberately. Registration never required an account, so seeing
 * what you bought must not either — the order's id in the URL is the
 * capability, and it is what the confirmation email links to. A wrong id 404s
 * through the route's `errorElement` like any other missing thing.
 */

/** The methods the API will start a payment for (`PayOrderDto`). */
const METHODS = ['Card', 'PromptPay'] as const
type Method = (typeof METHODS)[number]

const isMethod = (value: unknown): value is Method => METHODS.includes(value as Method)

/** What the pay action reports back: how to pay, or why the API said no. */
export interface PayResult {
  payment?: PaymentStep
  /** The API's own sentence, shown verbatim — it was written for the reader. */
  error?: string
}

export const guestOrderRoute = {
  loader: async ({ params }: LoaderArgs): Promise<{ order: GuestOrder }> => {
    const wire = await api.get<GuestOrderWire>(`/public/orders/${params.orderId}`)
    return { order: toGuestOrder(wire, new Date()) }
  },

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
  action: async ({ params, request }: LoaderArgs): Promise<PayResult> => {
    const method = (await request.formData()).get('method')
    if (!isMethod(method)) return { error: 'Choose a payment method.' }
    try {
      const intent = await registerApi.pay({
        orderId: String(params.orderId),
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
  },
}
