import { api, type Query } from '@/lib/api'
import type { MyEventsWire, PaymentSummaryWire, TransactionWire } from './myEvents.types'

/**
 * What an attendee can ask about themselves. Every route is `/me/*` and scoped
 * to the token — there is no id to pass, and none to get wrong.
 */

export interface TransactionQuery extends Query {
  page?: number
  limit?: number
}

export const myEventsApi = {
  /** Upcoming and past in one answer, with the tab counts. */
  registrations: () => api.get<MyEventsWire>('/me/tickets'),

  payments: (query: TransactionQuery) =>
    api.list<TransactionWire>('/me/payments', { query }),

  paymentSummary: () => api.get<PaymentSummaryWire>('/me/payments/summary'),
}
