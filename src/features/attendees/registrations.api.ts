import { api, type Query } from '@/lib/api'
import type { RegistrationEntry, RegistrationWireStatus } from './registrations.types'

/**
 * Every call the registrations queue makes, and nothing else — no formatting,
 * no view concerns. `GET /registrations` filters, searches and pages
 * server-side, so the page hands its URL parameters straight through rather
 * than fetching the queue and narrowing it locally.
 */

export interface ListRegistrationsQuery extends Query {
  page?: number
  limit?: number
  status?: RegistrationWireStatus
  eventId?: string
  search?: string
}

/** A walk-up or phone booking the organizer is entering (US-REG-03). */
export interface NewRegistration {
  eventId: string
  ticketTypeId: string
  quantity: number
  name: string
  email: string
  phone?: string
  /** Off issues the ticket quietly, for the organizer to deliver themselves. */
  sendConfirmation?: boolean
}

/**
 * What a decision answers with.
 *
 * `already_approved` means a retry found the work done — no second ticket and
 * no second email — which is a success to report, not an error to raise.
 */
export interface DecisionOutcome {
  outcome: 'approved' | 'already_approved' | 'rejected'
  reference: string
  ticketCount: number
}

export interface AddedRegistration {
  orderId: string
  reference: string
  status: string
  amountLabel: string
  ticketCount: number
  /** True when the booking still awaits payment, so no ticket exists yet. */
  paymentRequired: boolean
}

/** A tier the "Add registration" panel can book against, across all events. */
export interface TierWire {
  id: string
  eventId: string
  eventName: string
  name: string
  isFree: boolean
  priceSatang: number
  sold: number
  total: number
}

export const registrationsApi = {
  list: (query: ListRegistrationsQuery) =>
    api.list<RegistrationEntry>('/registrations', { query }),

  /**
   * Every tier in the workspace, so the panel can narrow to the chosen event
   * without a second round trip once it is open.
   */
  tiers: (limit: number) => api.list<TierWire>('/tickets', { query: { limit } }),

  add: (input: NewRegistration) => api.post<AddedRegistration>('/registrations', input),

  approve: (id: string) => api.post<DecisionOutcome>(`/registrations/${id}/approve`, {}),

  /**
   * Rejecting is terminal, so the API refuses without `confirm` rather than
   * letting a mis-click end someone's registration (US-REG-02).
   */
  reject: (id: string, reason: string | null) =>
    api.post<DecisionOutcome>(`/registrations/${id}/reject`, { confirm: true, reason }),
}
