import type { BadgeTone } from '@/components/ui'
import type { DiscountStatus, DiscountType } from './types'

/** What the discount list reads off the wire, and what the table renders. */

export interface DiscountWire {
  id: string
  code: string
  type: DiscountType
  /** A percentage 1–100, or a fixed amount in **satang** — never baht. */
  value: number
  status: DiscountStatus
  eventId: string | null
  /** The event's name, or "All events" for a workspace-wide code. */
  scopeLabel: string
  used: number
  /** 0 means unlimited redemptions. */
  redemptionLimit: number
  minOrderSatang: number
  validFrom: string
  validUntil: string
}

export interface DiscountRow {
  id: string
  code: string
  /** `25% off` or `฿200 off`. */
  offer: string
  offerTone: BadgeTone
  appliesTo: string
  /** `342 / 500`, or `342 used` when redemptions are unlimited. */
  usedLabel: string
  /** Null when unlimited — there is no share of "no limit". */
  percent: number | null
  valid: string
  status: DiscountStatus
  statusLabel: string
  statusTone: BadgeTone
  statusIcon: string
}
