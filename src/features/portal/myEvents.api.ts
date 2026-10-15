import { api, type Query } from '@/lib/api'
import type {
  MyEventsWire,
  PaymentSummaryWire,
  TicketPassWire,
  TransactionWire,
} from './myEvents.types'

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

  /** One ticket's pass, with the token its QR encodes. Someone else's is a 404. */
  ticket: (ticketId: string) =>
    api.get<TicketPassWire>(`/me/tickets/${encodeURIComponent(ticketId)}`),

  /**
   * The printable pass, as the SVG the API rendered. A ticket that no longer
   * admits is refused (409) rather than printed.
   */
  printablePass: async (ticketId: string) =>
    (await api.download(`/me/tickets/${encodeURIComponent(ticketId)}/pass.svg`)).text(),

  payments: (query: TransactionQuery) =>
    api.list<TransactionWire>('/me/payments', { query }),

  paymentSummary: () => api.get<PaymentSummaryWire>('/me/payments/summary'),
}
