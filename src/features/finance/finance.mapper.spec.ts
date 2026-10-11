import { withholdingSatangOf } from './finance.routes'
import { describe, expect, it } from 'vitest'
import { toBalances, toInvoiceRow, toPayoutRow, toTaxRow } from './finance.mapper'
import type { InvoiceWire, PayoutWire, TaxPeriodWire } from './finance.types'

const BAHT = 100

const payout = (over: Partial<PayoutWire> = {}): PayoutWire => ({
  reference: 'PO-2026-07',
  amountSatang: 48_290 * BAHT,
  currency: 'THB',
  bankAccount: '•••• 4821',
  status: 'paid',
  periodCovered: 'Jul 1 – Jul 15, 2026',
  requestedAt: '2026-07-16T02:00:00.000Z',
  completedAt: '2026-07-18T04:00:00.000Z',
  failureReason: null,
  canRetry: false,
  ...over,
})

describe('toPayoutRow', () => {
  it('reads as a reference, an amount and where it went', () => {
    const row = toPayoutRow(payout())

    expect(row).toMatchObject({
      reference: 'PO-2026-07',
      amount: '฿48,290',
      bankAccount: '•••• 4821',
      completed: 'Jul 18, 2026',
    })
  })

  // A payout that has not landed has no completion date. A blank cell reads as
  // a bug; a dash says "not yet", which is the fact.
  it('marks a payout that has not landed', () => {
    const row = toPayoutRow(payout({ status: 'processing', completedAt: null }))

    expect(row.completed).toBe('—')
  })

  it('carries a failure and whether it may be retried', () => {
    const row = toPayoutRow(
      payout({ status: 'failed', failureReason: 'Bank rejected the transfer.', canRetry: true }),
    )

    expect(row.statusTone).toBe('red')
    expect(row.failureReason).toBe('Bank rejected the transfer.')
    expect(row.canRetry).toBe(true)
  })
})

describe('toBalances', () => {
  it('shows the three figures once an account is connected', () => {
    const balances = toBalances({
      availableSatang: 12_000 * BAHT,
      pendingSatang: 0,
      paidOutSatang: 48_290 * BAHT,
      payoutsConnected: true,
    })

    expect(balances.available).toBe('฿12,000')
    // A balance of nothing is ฿0. "Free" is a price; this is money.
    expect(balances.pending).toBe('฿0')
    expect(balances.connected).toBe(true)
  })

  // Not connected is not zero. The provider holds the money and has not been
  // asked; "฿0" would tell an organizer they have earned nothing.
  it('masks every figure until a payout account exists', () => {
    const balances = toBalances({
      availableSatang: null,
      pendingSatang: null,
      paidOutSatang: null,
      payoutsConnected: false,
    })

    expect(balances.available).toBe('—')
    expect(balances.pending).toBe('—')
    expect(balances.paidOut).toBe('—')
    expect(balances.connected).toBe(false)
  })
})

const invoice = (over: Partial<InvoiceWire> = {}): InvoiceWire => ({
  id: 1,
  number: 'INV-2026-0042',
  orderReference: 'ORD-GAZJG4J0',
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  buyerName: 'Nimble Works Co., Ltd.',
  buyerEmail: 'accounts@nimble.co',
  issuedAt: '2026-07-08T03:00:00.000Z',
  dueAt: '2026-07-22T03:00:00.000Z',
  daysUntilDue: 6,
  subtotalSatang: 10_000 * BAHT,
  vatAmountSatang: 700 * BAHT,
  amountSatang: 10_700 * BAHT,
  currency: 'THB',
  status: 'issued',
  paidVia: null,
  paidOn: null,
  canVoid: true,
  voidBlockedReason: null,
  ...over,
})

describe('toInvoiceRow', () => {
  it('separates the VAT from the total it is inside', () => {
    const row = toInvoiceRow(invoice())

    expect(row.amount).toBe('฿10,700')
    expect(row.vat).toBe('฿700')
  })

  it('counts down to the due date', () => {
    expect(toInvoiceRow(invoice({ daysUntilDue: 6 })).dueNote).toBe('Due in 6 days')
    expect(toInvoiceRow(invoice({ daysUntilDue: 1 })).dueNote).toBe('Due tomorrow')
    expect(toInvoiceRow(invoice({ daysUntilDue: 0 })).dueNote).toBe('Due today')
  })

  // Overdue is the fact an organizer is chasing. Saying "Due in -3 days" is
  // arithmetic leaking onto the screen.
  it('says how late an overdue invoice is', () => {
    expect(toInvoiceRow(invoice({ status: 'overdue', daysUntilDue: -3 })).dueNote).toBe(
      'Overdue by 3 days',
    )
  })

  it('stops counting once it is settled or void', () => {
    expect(toInvoiceRow(invoice({ status: 'paid', daysUntilDue: -9 })).dueNote).toBe('Paid')
    expect(toInvoiceRow(invoice({ status: 'void', daysUntilDue: -9 })).dueNote).toBe('Void')
  })
})

const period = (over: Partial<TaxPeriodWire> = {}): TaxPeriodWire => ({
  year: 2026,
  month: 7,
  period: 'Jul',
  dueAt: '2026-08-15',
  salesSatang: 100_000 * BAHT,
  vatSatang: 7_000 * BAHT,
  whtSatang: 0,
  remittedSatang: 0,
  status: 'due',
  filedAt: null,
  late: false,
  canFile: true,
  ...over,
})

describe('toTaxRow', () => {
  it('reads as a month, what was sold and the VAT on it', () => {
    const row = toTaxRow(period())

    expect(row).toMatchObject({
      period: 'Jul',
      sales: '฿100,000',
      vat: '฿7,000',
      due: 'Aug 15, 2026',
    })
  })

  it('keys a period by year and month, so two Julys never collide', () => {
    expect(toTaxRow(period()).key).toBe('2026-7')
  })

  // Filing late is recorded rather than hidden: the Revenue Department's
  // surcharge depends on it, and an organizer needs to know it happened.
  it('marks a late filing', () => {
    expect(toTaxRow(period({ status: 'filed', late: true })).lateNote).toContain('late')
    expect(toTaxRow(period({ status: 'filed', late: false })).lateNote).toBeNull()
  })
})

/**
 * The one figure a PP30 filing carries.
 *
 * `FileTaxPeriodDto` declares `whtSatang` and nothing else — the remitted
 * amount is the period's own VAT (US-FIN-12), derived rather than typed. The
 * ledger has shown a Withholding headline since it was built (US-FIN-11:
 * "the withholding headline sums those figures and is tracked separately
 * from VAT payable"), but nothing ever wrote one, so it could only read zero.
 */
describe('withholdingSatangOf', () => {
  it('converts baht to integer satang', () => {
    expect(withholdingSatangOf('1250')).toBe(125_000)
  })

  it('rounds rather than truncating a fractional baht', () => {
    expect(withholdingSatangOf('10.555')).toBe(1056)
  })

  /**
   * Blank is "none withheld", which is an ABSENCE. Sending 0 would record a
   * filing that explicitly withheld nothing, and a headline summing those
   * cannot tell that from never having been told.
   */
  it('reads an empty box as nothing to send', () => {
    expect(withholdingSatangOf('')).toBeNull()
    expect(withholdingSatangOf('   ')).toBeNull()
  })

  it('refuses a zero or a negative rather than sending it', () => {
    expect(withholdingSatangOf('0')).toBeNull()
    expect(withholdingSatangOf('-5')).toBeNull()
  })

  it('refuses anything that is not a number', () => {
    expect(withholdingSatangOf('about ฿500')).toBeNull()
  })
})
