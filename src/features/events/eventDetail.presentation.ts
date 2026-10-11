import type { PaymentStatusWire } from './eventDetail.mapper'

/**
 * The event workspace's own visual vocabulary.
 *
 * It lives beside the page rather than inside it because a page that exports
 * anything besides its component breaks Fast Refresh
 * (`react-refresh/only-export-components` says as much), and a lookup no test
 * can import is a lookup nothing stops drifting from the API that feeds it.
 */

/** The word the registrations tab prints: `titleCase` of the stored value. */
type PaymentLabel = Capitalize<PaymentStatusWire>

/**
 * Payment status → pill classes, copied from the kit.
 *
 * Keyed on the printed word rather than the stored value because that is what
 * the row carries; `Capitalize` is what ties the two together, so a fifth
 * `payment_status` is a compile error here rather than a grey pill at runtime.
 *
 * `Failed` had no row: the label survived because the mapper title-cases it
 * instead of looking it up, so a payment that never arrived was shown in the
 * fallback's quiet grey, reading like a refund. The kit never drew one — it
 * borrows the design system's danger tone, as `STATUS_PILL.Cancelled` does.
 */
export const PAYMENT_PILL: Record<PaymentLabel, string> = {
  Paid: 'bg-brand-soft text-brand-dark dark:text-brand',
  Pending: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  Refunded: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
  Failed: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
}

/**
 * For a word this build has never been taught. Kept, but no value the API can
 * send reaches it any more.
 */
export const PAYMENT_PILL_FALLBACK = 'bg-canvas text-muted'

/**
 * The row carries its status as a plain string, so the narrowing happens here:
 * an unrecognised word takes the neutral pill rather than borrowing the colour
 * of whichever status it was nearest.
 */
export function paymentPill(label: string): string {
  return PAYMENT_PILL[label as PaymentLabel] ?? PAYMENT_PILL_FALLBACK
}
