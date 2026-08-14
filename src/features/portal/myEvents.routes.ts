import { attendeeData, queryOf, type LoaderArgs } from '@/app/loaders'
import { authApi } from '@/features/auth/api'
import type { Me } from '@/features/auth/types'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { intParam } from '@/lib/urlFilters'
import { myEventsApi } from './myEvents.api'
import { toMyEventRow, toPaymentTotals, toTransactionRow } from './myEvents.mapper'
import type { MyEventRow, PaymentTotals, TransactionRow } from './myEvents.types'

/**
 * The attendee's own account page (US-DISC-07/09/10).
 *
 * Behind the attendee guard, not the organizer one: these are `/me/*` routes
 * scoped to whoever holds the token.
 */

export interface MyEventsData {
  /** Who is signed in — the header chip and the profile tab read it. */
  me: Me
  upcoming: MyEventRow[]
  past: MyEventRow[]
  transactions: TransactionRow[]
  window: PageWindow
  totals: PaymentTotals
}

/** How many payments a page of the history shows. */
const HISTORY_SIZE = DEFAULT_PAGE_SIZE

export function historyQueryOf(params: URLSearchParams) {
  const limit = intParam(params, 'limit', HISTORY_SIZE)
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : HISTORY_SIZE,
  }
}

export const myEventsRoute = {
  loader: attendeeData(async ({ request }: LoaderArgs): Promise<MyEventsData> => {
    // Independent reads; the page shows every tab at once, so a half-loaded
    // account is not worth rendering.
    const [me, registrations, payments, summary] = await Promise.all([
      authApi.me(),
      myEventsApi.registrations(),
      myEventsApi.payments(historyQueryOf(queryOf(request))),
      myEventsApi.paymentSummary(),
    ])

    return {
      me,
      upcoming: registrations.upcoming.map(toMyEventRow),
      past: registrations.past.map(toMyEventRow),
      transactions: payments.items.map(toTransactionRow),
      window: pageWindow(payments.meta),
      totals: toPaymentTotals(summary),
    }
  }),
}
