import { describe, expect, it } from 'vitest'
import { toPaymentRow } from './payments.mapper'
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
