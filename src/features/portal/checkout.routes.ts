import { queryOf, type LoaderArgs } from '@/app/loaders'
import { ApiError, NetworkError, messageOf } from '@/lib/api'
import { checkoutApi, type Buyer, type Selection } from './checkout.api'
import {
  toCheckoutView,
  toPaymentStep,
  toPlacedOrder,
  toSummaryLines,
  toWaitlistPlace,
} from './checkout.mapper'
import type {
  CheckoutView,
  PaymentStep,
  PlacedOrder,
  SummaryLines,
  WaitlistPlace,
} from './checkout.types'

/**
 * Registering for an event (US-DISC-04/05/06).
 *
 * Public, like Discover: booking never requires an account, and confirming as
 * a guest creates none. The event is named by `?event=<slug>` because the kit's
 * page is reached from a landing template that carries it that way.
 */

export interface CheckoutData {
  slug: string
  checkout: CheckoutView
}

/** What the page gets back from a quote or a booking. */
export type CheckoutResult =
  | { ok: true; intent: 'quote'; summary: SummaryLines }
  | { ok: true; intent: 'book'; order: PlacedOrder; payment: PaymentStep | null }
  | { ok: true; intent: 'waitlist'; place: WaitlistPlace }
  | { ok: false; error: string }

const MISSING_EVENT = 'This registration link does not name an event.'

export function slugOf(params: URLSearchParams): string {
  return params.get('event')?.trim() ?? ''
}

export const checkoutRoute = {
  loader: async ({ request }: LoaderArgs): Promise<CheckoutData> => {
    const slug = slugOf(queryOf(request))
    if (!slug) throw new Response(MISSING_EVENT, { status: 404 })
    return { slug, checkout: toCheckoutView(await checkoutApi.view(slug)) }
  },

  action: async ({ request }: LoaderArgs): Promise<CheckoutResult> => {
    const form = await request.formData()
    try {
      return await (INTENTS[String(form.get('intent'))] ?? quote)(form)
    } catch (cause) {
      // The API's refusal is written for the buyer — a seat taken while they
      // were deciding, a code that has run out. Shown verbatim, beside the
      // control they used, rather than replacing the page with an error.
      if (cause instanceof ApiError || cause instanceof NetworkError) {
        return { ok: false, error: messageOf(cause) }
      }
      throw cause
    }
  },
}

/**
 * Join a sold-out ticket's waitlist (US-REG-04). No hold, no payment: the API
 * puts them in line and says where; an offer comes later, by email.
 */
async function joinWaitlist(form: FormData): Promise<CheckoutResult> {
  const joined = await checkoutApi.joinWaitlist({
    eventId: text(form, 'eventId'),
    ticketTypeId: text(form, 'ticketTypeId'),
    quantity: Number(form.get('quantity') ?? 1),
    buyer: buyerOf(form),
    idempotencyKey: idempotencyKeyOf(form),
  })
  return { ok: true, intent: 'waitlist', place: toWaitlistPlace(joined) }
}

async function quote(form: FormData): Promise<CheckoutResult> {
  const summary = await checkoutApi.quote({
    ...selectionOf(form),
    ...optional('discountCode', form),
  })
  return { ok: true, intent: 'quote', summary: toSummaryLines(summary) }
}

/**
 * Hold the stock, place the order, then start the payment.
 *
 * The hold is released if confirming fails, so a buyer who mistypes an email
 * does not leave seats locked away from everybody else until they expire.
 *
 * Starting a payment is not completing one: the API answers with an intent —
 * a QR to scan, or the provider's hosted fields — and learns separately that
 * the money arrived. Nothing here may claim the order is paid.
 */
async function book(form: FormData): Promise<CheckoutResult> {
  const selection = selectionOf(form)
  const { holdIds } = await checkoutApi.hold(selection)
  const order = await confirmOrRelease(form, selection, holdIds)

  const placed = toPlacedOrder(order)
  if (!order.paymentRequired) return { ok: true, intent: 'book', order: placed, payment: null }

  const intent = await checkoutApi.pay({
    orderId: order.orderId,
    method: form.get('method') === 'PromptPay' ? 'PromptPay' : 'Card',
    idempotencyKey: `${idempotencyKeyOf(form)}-pay`,
  })
  return { ok: true, intent: 'book', order: placed, payment: toPaymentStep(intent) }
}

async function confirmOrRelease(form: FormData, selection: Selection, holdIds: number[]) {
  try {
    return await checkoutApi.confirm({
      ...selection,
      holdIds,
      buyer: buyerOf(form),
      idempotencyKey: idempotencyKeyOf(form),
      ...optional('discountCode', form),
    })
  } catch (cause) {
    await checkoutApi.release(selection.eventId, holdIds).catch(() => undefined)
    throw cause
  }
}

/** What each submit button asks for; anything else is a price check. */
const INTENTS: Record<string, (form: FormData) => Promise<CheckoutResult>> = {
  book,
  waitlist: joinWaitlist,
}

function selectionOf(form: FormData): Selection {
  const seatIds = form
    .getAll('seatId')
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id))
  return {
    eventId: text(form, 'eventId'),
    ticketTypeId: text(form, 'ticketTypeId'),
    ...(seatIds.length > 0 ? { seatIds } : { quantity: Number(form.get('quantity') ?? 1) }),
  }
}

function buyerOf(form: FormData): Buyer {
  const phone = text(form, 'phone')
  return {
    name: text(form, 'name'),
    email: text(form, 'email'),
    ...(phone ? { phone } : {}),
  }
}

/**
 * The key the buyer's browser generated for this attempt.
 *
 * It travels with the form so that a double-submitted booking is recognised by
 * the API as the same one, rather than charging twice.
 */
function idempotencyKeyOf(form: FormData): string {
  return text(form, 'idempotencyKey')
}

/** Absent rather than empty — an empty discount code is not a code. */
function optional(field: 'discountCode', form: FormData) {
  const value = text(form, field)
  return value ? { [field]: value } : {}
}

function text(form: FormData, field: string): string {
  return String(form.get(field) ?? '').trim()
}
