import { describe, expect, it } from 'vitest'
import { toDiscountRow } from './discounts.mapper'
import type { DiscountWire } from './discounts.types'

const BAHT = 100

const wire = (over: Partial<DiscountWire> = {}): DiscountWire => ({
  id: 'd-1',
  code: 'EARLYBIRD25',
  type: 'percent',
  value: 25,
  status: 'active',
  eventId: 'e-1',
  scopeLabel: 'Tech Summit 2026',
  used: 342,
  redemptionLimit: 500,
  minOrderSatang: 0,
  validFrom: '2026-05-31T17:00:00.000Z',
  validUntil: '2026-07-31T16:59:59.000Z',
  ...over,
})

describe('toDiscountRow', () => {
  it('reads a percentage code as a percentage', () => {
    expect(toDiscountRow(wire()).offer).toBe('25% off')
  })

  // The wire carries a fixed discount in SATANG, like every other amount in
  // this product. Printing `value` straight out would offer ฿20,000 off a
  // ฿200 code — the mistake this mapper exists to make impossible.
  it('converts a fixed discount from satang to baht', () => {
    expect(toDiscountRow(wire({ type: 'fixed', value: 200 * BAHT })).offer).toBe('฿200 off')
  })

  it('names what the code applies to', () => {
    expect(toDiscountRow(wire({ scopeLabel: 'All events' })).appliesTo).toBe('All events')
  })

  it('reads redemptions against the limit, with the share used', () => {
    const row = toDiscountRow(wire())

    expect(row.usedLabel).toBe('342 / 500')
    expect(row.percent).toBe(68)
  })

  // A limit of 0 is the API's "unlimited". A bar against it would read 0%
  // forever, and "342 / 0" is not a ratio.
  it('drops the bar when redemptions are unlimited', () => {
    const row = toDiscountRow(wire({ redemptionLimit: 0 }))

    expect(row.usedLabel).toBe('342 used')
    expect(row.percent).toBeNull()
  })

  it('spells the validity window on the Bangkok calendar', () => {
    // Both instants are the Bangkok day boundary; read in UTC they would be a
    // day early at each end.
    expect(toDiscountRow(wire()).valid).toBe('Jun 1 – Jul 31, 2026')
  })

  it('labels and tints each status', () => {
    expect(toDiscountRow(wire({ status: 'expired' })).statusLabel).toBe('Expired')
    expect(toDiscountRow(wire({ status: 'disabled' })).statusTone).toBe('amber')
  })
})
