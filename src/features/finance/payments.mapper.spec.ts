import { describe, expect, it } from 'vitest'
import type { Me } from '@/features/auth/types'
import { refundControl, toPaymentRow } from './payments.mapper'
import type { LedgerEntryWire } from './payments.types'

const BAHT = 100

const wire = (over: Partial<LedgerEntryWire> = {}): LedgerEntryWire => ({
  id: 'p-1',
  txn: 'TXN-10492',
  payerName: 'Anong Pattana',
  eventName: 'Tech Summit 2026',
  method: 'Card',
  amountSatang: 1_250 * BAHT,
  currency: 'THB',
  status: 'paid',
  paidAt: '2026-07-18T03:24:00.000Z',
  canViewInvoice: true,
  canRefund: true,
  refundBlockedReason: null,
  ...over,
})

describe('toPaymentRow', () => {
  it('reads as who paid, for what, how much and when', () => {
    const row = toPaymentRow(wire())

    expect(row).toMatchObject({
      txn: 'TXN-10492',
      payer: 'Anong Pattana',
      initials: 'AP',
      event: 'Tech Summit 2026',
      amount: '฿1,250',
      date: 'Jul 18, 2026',
      time: '10:24',
    })
  })

  // The ledger's amounts are the money that moved. A free registration is a
  // real row with a real total of nothing — "Free", never a blank.
  it('describes a zero charge rather than leaving it blank', () => {
    expect(toPaymentRow(wire({ amountSatang: 0 })).amount).toBe('Free')
  })

  it('labels and tints each status', () => {
    expect(toPaymentRow(wire({ status: 'refunded' })).statusLabel).toBe('Refunded')
    expect(toPaymentRow(wire({ status: 'failed' })).statusTone).toBe('red')
  })

  it('gives each method its own glyph', () => {
    expect(toPaymentRow(wire({ method: 'PromptPay' })).methodIcon).not.toBe(
      toPaymentRow(wire({ method: 'Card' })).methodIcon,
    )
  })

  // Whether a charge can be refunded is the server's decision — it knows the
  // provider's window and what has already been sent back. The row carries the
  // answer AND the reason, so a disabled button can say why.
  it('carries the API’s refusal rather than deciding for itself', () => {
    const row = toPaymentRow(
      wire({ status: 'paid', canRefund: false, refundBlockedReason: 'Already refunded in full.' }),
    )

    expect(row.canRefund).toBe(false)
    expect(row.refundBlockedReason).toBe('Already refunded in full.')
  })
})

/**
 * US-FIN-02 / US-FIN-14: "Given an Organizer (not an Admin), when they view a
 * paid payment, then the Refund action is not available to them." The button
 * followed only the row's refundability, so an Organizer was offered a refund
 * the API then refused with a 403.
 */
describe('refundControl', () => {
  const me = (permissions: string[]): Me => ({
    id: 'u-1',
    name: 'Pim',
    email: 'pim@demo.test',
    persona: 'admin',
    status: 'Active',
    twoFactorEnabled: false,
    organization: {
      id: 1,
      name: 'Demo Workspace',
      slug: 'demo',
      currency: 'THB',
      timezone: 'Asia/Bangkok',
      locale: 'en',
    },
    permissions,
  })
  const admin = me(['finView', 'finRefund'])
  const organizer = me(['finView'])

  it('offers an Admin the refund of a paid charge', () => {
    expect(refundControl(toPaymentRow(wire()), admin)).toEqual({ enabled: true, title: 'Refund' })
  })

  it('does not offer an Organizer the refund, and says who can', () => {
    expect(refundControl(toPaymentRow(wire()), organizer)).toEqual({
      enabled: false,
      title: 'Only an Admin can issue refunds.',
    })
  })

  it('refuses everyone while the session is unknown', () => {
    expect(refundControl(toPaymentRow(wire()), null).enabled).toBe(false)
  })

  it('gives an Admin the API’s reason when the charge cannot be refunded', () => {
    const row = toPaymentRow(
      wire({ status: 'refunded', canRefund: false, refundBlockedReason: 'Already refunded.' }),
    )
    expect(refundControl(row, admin)).toEqual({ enabled: false, title: 'Already refunded.' })
  })

  it('still says why when the API gave no reason', () => {
    const row = toPaymentRow(wire({ canRefund: false, refundBlockedReason: null }))
    expect(refundControl(row, admin).title).toBe('Not eligible for refund')
  })
})
