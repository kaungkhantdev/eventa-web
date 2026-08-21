import { describe, expect, it } from 'vitest'
import { MASKED } from '@/lib/format'
import { toMyEventRow, toPaymentTotals, toTransactionRow } from './myEvents.mapper'
import type {
  MyRegistrationWire,
  PaymentSummaryWire,
  TransactionWire,
} from './myEvents.types'

const registration = (over: Partial<MyRegistrationWire> = {}): MyRegistrationWire => ({
  orderId: 'o-1',
  reference: 'ORD-2026-0009',
  eventId: 'e-1',
  eventSlug: 'tech-summit-2026',
  eventName: 'Tech Summit 2026',
  startAt: '2026-07-18T02:00:00.000Z',
  timezone: 'Asia/Bangkok',
  venueName: 'BITEC',
  city: 'Bangkok',
  isOnline: false,
  coverImage: null,
  ticketTypeName: 'VIP',
  ticketCount: 2,
  countdown: 'in 3 days',
  attended: false,
  ...over,
})

const transaction = (over: Partial<TransactionWire> = {}): TransactionWire => ({
  paymentId: 'p-1',
  reference: 'PAY-2026-0009',
  eventName: 'Tech Summit 2026',
  method: 'Card',
  status: 'succeeded',
  amountSatang: 240_000,
  amountLabel: '฿2,400',
  paidAt: '2026-07-08T03:00:00.000Z',
  ...over,
})

describe('an event the attendee is registered for', () => {
  it('names the event and what they hold', () => {
    const row = toMyEventRow(registration())
    expect(row.title).toBe('Tech Summit 2026')
    expect(row.ticket).toBe('VIP')
    expect(row.ticketCount).toBe(2)
  })

  it('shows a dash when the tier has since been deleted', () => {
    // The booking is still real; losing the column would be worse than saying
    // nothing about it.
    expect(toMyEventRow(registration({ ticketTypeName: null })).ticket).toBe(MASKED)
  })

  it('dates the event in ITS timezone, not the reader’s', () => {
    // Someone checks their ticket from another country. The fact is where and
    // when the event happens, not what their own clock says.
    const row = toMyEventRow(registration({ startAt: '2026-07-18T17:00:00.000Z' }))
    expect(row.when).toContain('Jul 19')
  })

  it('joins the venue and city', () => {
    expect(toMyEventRow(registration()).where).toBe('BITEC, Bangkok')
  })

  it('says an online event is online rather than leaving the place blank', () => {
    const row = toMyEventRow(registration({ isOnline: true, venueName: null, city: null }))
    expect(row.where).toBe('Online event')
  })

  it('falls back to whichever of venue or city it has', () => {
    expect(toMyEventRow(registration({ venueName: null })).where).toBe('Bangkok')
    expect(toMyEventRow(registration({ city: null })).where).toBe('BITEC')
  })

  it('carries the API’s countdown phrase, and nothing once it has passed', () => {
    expect(toMyEventRow(registration()).countdown).toBe('in 3 days')
    expect(toMyEventRow(registration({ countdown: null })).countdown).toBe('')
  })

  it('records whether they actually turned up', () => {
    expect(toMyEventRow(registration({ attended: true })).attended).toBe(true)
  })
})

describe('a payment in the attendee’s history', () => {
  it('shows the amount the API formatted', () => {
    expect(toTransactionRow(transaction()).amount).toBe('฿2,400')
  })

  it('says Free rather than ฿0 when nothing was charged', () => {
    const row = toTransactionRow(transaction({ amountSatang: 0, amountLabel: 'Free' }))
    expect(row.amount).toBe('Free')
    expect(row.amount).not.toBe('฿0')
  })

  it('dates it in Bangkok, the product’s own zone', () => {
    expect(toTransactionRow(transaction()).date).toBe('Jul 8, 2026')
  })

  it('shows a dash for a payment that was never completed', () => {
    // A pending payment has no paid date; printing today's would be a lie.
    expect(toTransactionRow(transaction({ paidAt: null })).date).toBe(MASKED)
  })

  it('marks a refund, so the table can show money coming back', () => {
    expect(toTransactionRow(transaction({ status: 'refunded' })).refunded).toBe(true)
    expect(toTransactionRow(transaction()).refunded).toBe(false)
  })
})

describe('what the attendee has spent', () => {
  const summary = (over: Partial<PaymentSummaryWire> = {}): PaymentSummaryWire => ({
    totalSpentSatang: 500_000,
    totalSpentLabel: '฿5,000',
    totalRefundedSatang: 0,
    totalRefundedLabel: 'Free',
    transactionCount: 14,
    ...over,
  })

  it('reports the totals the API added up', () => {
    const totals = toPaymentTotals(summary())
    expect(totals.spent).toBe('฿5,000')
    expect(totals.count).toBe(14)
  })

  it('shows nothing refunded as ฿0, not as Free', () => {
    // "Free" is a price. A refund total of zero is an amount, and reading
    // "Refunded: Free" would be nonsense.
    expect(toPaymentTotals(summary()).refunded).toBe('฿0')
  })

  it('shows a real refund total as the API formatted it', () => {
    const totals = toPaymentTotals(
      summary({ totalRefundedSatang: 120_000, totalRefundedLabel: '฿1,200' }),
    )
    expect(totals.refunded).toBe('฿1,200')
  })

  it('reports having spent nothing as ฿0 rather than Free', () => {
    expect(toPaymentTotals(summary({ totalSpentSatang: 0, totalSpentLabel: 'Free' })).spent).toBe(
      '฿0',
    )
  })
})
