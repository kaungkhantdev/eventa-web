/** The finance module's named constants. */

export const SATANG_PER_BAHT = 100

/** Bank, schedule and tax forms are an Admin's to change (US-FIN-05, US-FIN-14). */
export const PAYOUT_MANAGEMENT = 'finManage'

export const MAX_SEARCH = 120

export const PAYOUT_TABS = ['all', 'scheduled', 'processing', 'paid', 'failed'] as const

export const INVOICE_TABS = ['all', 'issued', 'paid', 'overdue', 'void'] as const

/** How many years back the picker goes. VAT records are kept for five. */
export const YEARS_BACK = 5

export const ALL_EVENTS = 'All events'

export const MAX_SEARCH_LENGTH = 120

export const ALL_METHODS = 'All methods'

/**
 * Where connecting a payout account actually happens.
 *
 * Not a `POST /payouts/settings-link` from here, which is what this page used
 * to offer: for an unconnected workspace that endpoint answers
 * `{connected:false, url:null}` — there is no provider URL to follow in exactly
 * the case the button is shown — and `pageAction` returns `{ok:true}` for
 * anything that is not a `Response`, so the link would never reach the page
 * even when the provider had one. A plain link, as in the kit (payouts.html).
 */
export const PAYOUT_SETTINGS = '/admin/settings-payments'

/** Refunding is its own capability — an Admin's, never an Organizer's (US-FIN-14). */
export const REFUND_PERMISSION = 'finRefund'

export const ADMIN_ONLY = 'Only an Admin can issue refunds.'

export const NOT_ELIGIBLE = 'Not eligible for refund'

export const LEDGER_TABS = ['all', 'paid', 'pending', 'refunded', 'failed'] as const
