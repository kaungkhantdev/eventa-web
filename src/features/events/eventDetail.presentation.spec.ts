import { describe, expect, it } from 'vitest'
import { PAYMENT_PILL_FALLBACK, paymentPill } from './eventDetail.presentation'
import { toRegistrationRow, type PaymentStatusWire } from './eventDetail.mapper'
import type { EventRegistrationWire } from './eventDetail.api'

const ENTRY: EventRegistrationWire = {
  reference: 'ORD-2026-000045',
  attendeeName: 'Somchai Prasert',
  tickets: 2,
  amountSatang: 89_000,
  paymentStatus: 'paid',
  registeredAt: '2026-07-08T03:15:00.000Z',
}

/** The real chain: the API's stored value → the mapper's word → the pill. */
const rowFor = (paymentStatus: string) => toRegistrationRow({ ...ENTRY, paymentStatus })

/**
 * Every value the `payment_status` pgEnum (`eventa-api/src/db/schema/enums.ts`)
 * can put on the wire, copied verbatim from it and republished by
 * `RegistrationRowDto` as `@ApiProperty({ enum: paymentStatusEnum.enumValues })`.
 *
 * Literals rather than a list derived from this repo's own union, because the
 * union is the thing that drifted — derived from it, this test would only test
 * itself. `satisfies` ties the two together, so a value the API adds cannot be
 * listed here without being added to the union as well.
 */
const API_PAYMENT_STATUSES = [
  'paid',
  'pending',
  'refunded',
  'failed',
] as const satisfies readonly PaymentStatusWire[]

/** What the registrations tab prints for each — the mapper title-cases it. */
const LABEL: Record<PaymentStatusWire, string> = {
  paid: 'Paid',
  pending: 'Pending',
  refunded: 'Refunded',
  failed: 'Failed',
}

describe('the registrations tab’s payment pill', () => {
  it.each(API_PAYMENT_STATUSES)('reads %s back as a word', (status) => {
    expect(rowFor(status).status).toBe(LABEL[status])
  })

  // `failed` had no row of its own, and the label survived only because it is
  // title-cased rather than looked up — so the cell read "Failed" in the
  // fallback's quiet grey.
  it.each(API_PAYMENT_STATUSES)('has a pill of its own for %s', (status) => {
    expect(paymentPill(rowFor(status).status)).not.toBe(PAYMENT_PILL_FALLBACK)
  })

  // A payment that never arrived and one that was sent back are opposite
  // facts about the money; they must not be the same colour.
  it('does not paint a failed payment like a refunded one', () => {
    expect(paymentPill(rowFor('failed').status)).not.toBe(paymentPill(rowFor('refunded').status))
  })

  // The fallback stays for a word this build has never been taught, which is
  // now the only thing that can reach it.
  it('keeps a neutral pill for a label it does not know', () => {
    expect(paymentPill('Chargeback')).toBe(PAYMENT_PILL_FALLBACK)
  })
})
