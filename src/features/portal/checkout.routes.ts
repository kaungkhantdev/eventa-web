import { queryOf, type LoaderArgs } from '@/app/loaders'
import { ApiError, NetworkError, messageOf, session } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import { checkoutApi, type Buyer, type Selection } from './checkout.api'
import {
  prefillsFromProfile,
  toBuyerDefaults,
  toCheckoutView,
  toPaymentStep,
  toPlacedOrder,
  toSummaryLines,
  toWaitlistPlace,
} from './checkout.mapper'
import type {
  BuyerDefaults,
  CheckoutView,
  PaymentStep,
  PlacedOrder,
  SummaryLines,
  WaitlistPlace,
} from './checkout.types'
import { profileApi } from './profile.api'
import type { ProfileWire } from './profile.types'

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
  /**
   * What the buyer boxes start with (US-DISC-11, criterion 5). Empty for a
   * guest, so their page is the one they have today.
   */
  buyer: BuyerDefaults
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

/**
 * Whether the loader has to run again after this route's action.
 *
 * The action answers three different things, and only two of them change the
 * server. A `quote` is arithmetic on an unchanged cart — no hold, no order, no
 * inventory moved — so re-reading the event view and the saved profile after
 * one buys nothing. It costs, though: the quote fetcher fires from a
 * `useEffect` keyed on an undebounced discount-code input, so typing a code
 * was a quote and a full revalidation per keystroke, each one an authenticated
 * round trip on the money path. Nor could the re-read have any effect — the
 * buyer boxes are uncontrolled, so React only ever writes `defaultValue` and
 * never overwrites a dirty input, which is the same property that lets a
 * typed-over value survive to submission.
 *
 * A `book` or a `waitlist` genuinely does move something, so those revalidate.
 * Anything else — a plain navigation, a refused action that says nothing about
 * why — defers to the router rather than guessing.
 */
export function revalidateCheckout({
  actionResult,
  defaultShouldRevalidate = true,
}: {
  actionResult?: { ok?: boolean; intent?: string }
  defaultShouldRevalidate?: boolean
}): boolean {
  const intent = actionResult?.intent
  if (intent === QUOTE_INTENT) return false
  if (intent === BOOK_INTENT || intent === WAITLIST_INTENT) return true
  return defaultShouldRevalidate
}

/** The action's own discriminants, named so the rule above cannot drift. */
const QUOTE_INTENT = 'quote'
const BOOK_INTENT = 'book'
const WAITLIST_INTENT = 'waitlist'

export const checkoutRoute = {
  loader: async ({ request }: LoaderArgs): Promise<CheckoutData> => {
    const slug = slugOf(queryOf(request))
    if (!slug) throw new Response(MISSING_EVENT, { status: 404 })

    // Read once and pass it to both: the same session decides whether the
    // profile is worth fetching and whether what came back may be used.
    const persona = session.persona()
    const [view, profile] = await Promise.all([checkoutApi.view(slug), savedProfile(persona)])

    return {
      slug,
      checkout: toCheckoutView(view),
      buyer: toBuyerDefaults(persona, profile),
    }
  },

  shouldRevalidate: revalidateCheckout,

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
 * The visitor's saved details, when there is an account to read them from
 * (US-DISC-11, criterion 5).
 *
 * `null` for a guest WITHOUT asking: this loader is public, and an
 * unconditional `/me/profile` would 401 for everyone without a token, which a
 * rejected loader turns into an error element where the registration page
 * should be. Nothing about the guest path changes, because for a guest there
 * is no second request at all.
 *
 * WHY A FAILURE IS ABSORBED HERE, against this repo's "errors are surfaced,
 * never swallowed": checkout is the money path and a pre-fill is a
 * convenience, not the page's subject. If the profile cannot be read, the
 * worst outcome is a signed-in attendee typing three fields they should not
 * have had to — the event, the tiers, the seats and the payment are all
 * untouched, and the sale still completes. Failing the page instead would
 * trade a small annoyance for a lost registration. Nor is the failure
 * invisible: the boxes are visibly empty, which is the same thing the person
 * would see if they had never saved a profile.
 *
 * `panel()` from `@/app/panels` is the repo's primitive for a read that
 * degrades on its own, and is deliberately NOT used: it re-throws a 401 so the
 * expired session reaches a loader guard that redirects to sign-in. There is
 * no such guard above a public checkout, so here that re-throw is the very
 * breakage this function exists to prevent — a stale token would take down the
 * page for someone who is still perfectly able to buy as a guest.
 *
 * A fault that is not the API talking still propagates, exactly as `panel()`
 * does it: "retry" must never become the product's answer to a TypeError.
 */
export async function savedProfile(
  persona: Persona | null,
  /**
   * Injected so the rule above is testable without a running API — the two
   * lines below are what keep a guest able to buy, and a loader that reaches
   * for the module directly is a loader whose guard nobody can pin down.
   */
  fetchProfile: () => Promise<ProfileWire> = () => profileApi.profile(),
): Promise<ProfileWire | null> {
  if (!prefillsFromProfile(persona)) return null
  try {
    return await fetchProfile()
  } catch (cause) {
    if (cause instanceof ApiError || cause instanceof NetworkError) return null
    throw cause
  }
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

/**
 * Who is booking, read from the submitted form and from nowhere else.
 *
 * This is what keeps a pre-filled profile a DEFAULT rather than a mirror of it
 * (US-DISC-11, criterion 5). Somebody buying a ticket for a colleague types
 * over the boxes, and the typed values are the ones sent — the saved profile
 * is never consulted at submit time, so it cannot overwrite them.
 */
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
