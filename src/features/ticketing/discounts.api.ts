import { api, type Query } from '@/lib/api'
import type { DiscountWire } from './discounts.types'
import type { DiscountStatus, DiscountType } from './types'

/** Everything the discounts page asks of eventa-api (US-TKT-07..10/12). */

export interface ListDiscountsQuery extends Query {
  page?: number
  limit?: number
  status?: DiscountStatus
  eventId?: string
  search?: string
}

/** What a code is created or edited with — only fields the API accepts. */
export interface DiscountInput {
  code: string
  type: DiscountType
  /** Percent 1–100, or a fixed amount in integer satang. */
  value: number
  /** Null applies the code to every event in the workspace. */
  eventId: string | null
  redemptionLimit?: number
  perPersonLimit?: number
  minOrderSatang?: number
  validFrom?: string
  validUntil?: string
  version?: number
}

export const discountsApi = {
  list: (query: ListDiscountsQuery) => api.list<DiscountWire>('/discounts', { query }),

  /** A code nobody is using yet — the "Generate" button (US-TKT-08). */
  suggest: () => api.get<{ code: string }>('/discounts/suggest'),

  create: (input: DiscountInput) => api.post<DiscountWire>('/discounts', input),

  update: (id: string, input: DiscountInput) => api.patch<DiscountWire>(`/discounts/${id}`, input),

  remove: (id: string) => api.delete<void>(`/discounts/${id}`),

  /** Turning a code off does not delete it — redemptions already made stand. */
  enable: (id: string) => api.post<DiscountWire>(`/discounts/${id}/enable`),

  disable: (id: string) => api.post<DiscountWire>(`/discounts/${id}/disable`),
}
