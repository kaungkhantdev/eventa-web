import { describe, expect, it } from 'vitest'
import type { Panel } from '@/app/panels'
import { MASKED } from '@/lib/format'
import { qrDataUrl } from './lib/qr'
import {
  passOnShow,
  ticketChoices,
  toMyEventRow,
  toPaymentTotals,
  toTicketPass,
  toTransactionRow,
  type TransactionStatusWire,
} from './myEvents.mapper'
import type {
  MyRegistrationWire,
  PaymentSummaryWire,
  TicketPass,
  TicketPassWire,
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
  ticketIds: ['t-1', 't-2'],
  countdown: 'in 3 days',
  attended: false,
  ...over,
})

const TOKEN = 'K7M2Q9XW4RT8V3NP6JHY5CBD'

const ticketPass = (over: Partial<TicketPassWire> = {}): TicketPassWire => ({
  id: 't-1',
  reference: 'ORD-7K2M9QX4',
  qrToken: TOKEN,
  status: 'issued',
  valid: true,
  holderName: 'Anan Suksawat',
  ticketLabel: 'VIP',
  admissionNumber: '1 of 2',
  eventName: 'Tech Summit 2026',
  eventSlug: 'tech-summit-2026',
  startAt: '2026-07-18T02:00:00.000Z',
  timezone: 'Asia/Bangkok',
  venueName: 'BITEC',
  venueAddress: null,
  city: 'Bangkok',
  isOnline: false,
  seat: null,
  ...over,
})

/** What `GET /me/tickets/{id}/pass.svg` answered. */
const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><text>ORD-7K2M9QX4 · 1 of 2</text></svg>'
const PRINTED: Panel<string> = { ok: true, data: SVG }
const REFUSED: Panel<string> = {
  ok: false,
  error: 'This ticket is no longer valid and cannot be downloaded as a pass.',
}

const transaction = (over: Partial<TransactionWire> = {}): TransactionWire => ({
  paymentId: 'p-1',
  reference: 'PAY-2026-0009',
  invoiceNumber: null,
  eventName: 'Tech Summit 2026',
  method: 'Card',
  // `paid`, not Stripe's `succeeded`: the row carries this product's own
  // `payment_status`, and a fixture using the processor's word let a status
  // nobody checked stand in for the two the endpoint can actually send.
  status: 'paid',
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

  // A ticket is opened by its own id: the order alone cannot say which QR.
  it('carries the order’s ticket ids, so each ticket can be opened', () => {
    expect(toMyEventRow(registration()).ticketIds).toEqual(['t-1', 't-2'])
  })
})

describe('one ticket, opened (US-DISC-07)', () => {
  // The station looks a ticket up by its token and nothing else. The modal used
  // to draw the event's public URL — the same picture for every buyer, and one
  // the door answers "Invalid ticket".
  it('encodes the ticket’s own token in the QR, never the event page', () => {
    const { qr } = toTicketPass(ticketPass(), PRINTED)
    expect(qr).toBe(qrDataUrl(TOKEN))
    expect(qr).not.toBe(qrDataUrl('https://eventa.test/e/tech-summit-2026'))
  })

  it('gives each ticket of an order a QR of its own', () => {
    const first = toTicketPass(ticketPass(), PRINTED)
    const second = toTicketPass(
      ticketPass({ id: 't-2', qrToken: 'Q4V8N2M7K3P9X6R5T1W0YHJC' }),
      PRINTED,
    )
    expect(first.qr).not.toBe(second.qr)
  })

  it('shows its reference and which admission it is', () => {
    expect(toTicketPass(ticketPass(), PRINTED)).toMatchObject({
      id: 't-1',
      reference: 'ORD-7K2M9QX4',
      admission: '1 of 2',
      valid: true,
    })
  })

  // A refunded or voided ticket admits nobody, so it is not drawn as one.
  it('draws no QR for a ticket that is no longer valid', () => {
    const refunded = toTicketPass(ticketPass({ status: 'refunded', valid: false }), REFUSED)
    expect(refunded.valid).toBe(false)
    expect(refunded.qr).toBeNull()
  })
})

describe('the downloadable ticket (US-DISC-07)', () => {
  // The PNG this replaced was painted here, and invented most of what it
  // printed: doors at start minus 30 minutes, VIP from a regex on the tier
  // name, row, seat, gate and admission number hashed from the venue name, and
  // the event's URL as the QR. The API's pass prints the real token, class,
  // seat and admission number, and refuses a ticket that no longer admits.
  it('is the pass the API printed, byte for byte', () => {
    const { printable } = toTicketPass(ticketPass(), PRINTED)
    expect(printable).not.toBeNull()
    expect(printable!.startsWith('data:image/svg+xml')).toBe(true)
    expect(decodeURIComponent(printable!.slice(printable!.indexOf(',') + 1))).toBe(SVG)
  })

  it('is saved under the ticket’s own name', () => {
    expect(toTicketPass(ticketPass(), PRINTED).filename).toBe('eventa-ticket-t-1.svg')
  })

  it('is not offered for a ticket the API will not print, and says why', () => {
    const refused = toTicketPass(ticketPass({ status: 'void', valid: false }), REFUSED)
    expect(refused.printable).toBeNull()
    expect(refused.printRefusal).toBe(
      'This ticket is no longer valid and cannot be downloaded as a pass.',
    )
  })

  it('has nothing to explain when it can be downloaded', () => {
    expect(toTicketPass(ticketPass(), PRINTED).printRefusal).toBeNull()
  })
})

describe('choosing among an order’s tickets', () => {
  it('numbers them in admission order', () => {
    expect(ticketChoices(['t-1', 't-2'])).toEqual([
      { value: 't-1', label: 'Ticket 1' },
      { value: 't-2', label: 'Ticket 2' },
    ])
  })

  // One ticket needs no switcher.
  it('offers no choice when there is only one', () => {
    expect(ticketChoices(['t-1'])).toEqual([])
  })
})

describe('the pass on show while switching tickets (US-DISC-07)', () => {
  const first: Panel<TicketPass> = { ok: true, data: toTicketPass(ticketPass(), PRINTED) }

  it('is the pass that was loaded for the ticket asked for', () => {
    expect(passOnShow('t-1', first)).toBe(first)
  })

  // The router publishes a fetcher's "loading" a render after the switch, so
  // for that render the last ticket's pass is still the one loaded. Its QR
  // must not be shown as the next ticket's — the door would admit the wrong one.
  it('is never the last ticket’s pass, shown as another', () => {
    expect(passOnShow('t-2', first)).toBeNull()
  })

  // A registration with nothing to open must not inherit the last one's
  // download link.
  it('is nothing when no ticket is asked for', () => {
    expect(passOnShow(null, first)).toBeNull()
  })

  it('carries a refusal through, so it can be read', () => {
    const refused: Panel<TicketPass> = { ok: false, error: "This ticket isn't available." }
    expect(passOnShow('t-1', refused)).toBe(refused)
  })
})

describe('a payment in the attendee’s history', () => {
  /**
   * US-DISC-10: "Given a transaction row, when I view it, then I see the
   * event, invoice number, …". The row showed the order reference even when
   * the organizer had issued an invoice for the order.
   */
  it('shows the number of the invoice the organizer issued', () => {
    const row = toTransactionRow(transaction({ invoiceNumber: 'INV-2026-0001' }))
    expect(row.number).toBe('INV-2026-0001')
  })

  it('shows the order reference when no invoice was issued', () => {
    expect(toTransactionRow(transaction()).number).toBe('PAY-2026-0009')
  })

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

  /**
   * The only two statuses this endpoint can send. `payment_status` holds four
   * (`paid`, `pending`, `refunded`, `failed`), but the repository filters the
   * history to the settled two (`attendee-payments.repository.ts` `SETTLED`)
   * and `TransactionDto.status` republishes just those — `enum: ['paid',
   * 'refunded']`.
   *
   * Literals rather than a list derived from `TransactionStatusWire`, because
   * that union is the thing that drifts from the API — derived from it, this
   * list would only ever test itself. `satisfies` ties the two together, so a
   * status the endpoint starts sending cannot be listed here without the union
   * being widened, and widening it turns the mapper's own map red in `tsc`.
   */
  const API_TRANSACTION_STATUSES = [
    'paid',
    'refunded',
  ] as const satisfies readonly TransactionStatusWire[]

  // The history is a binary on screen — struck through and badged "Refunded",
  // or badged "Paid" — so every status the endpoint can send has to land on the
  // right side of it, not merely fail to be a refund.
  const CAME_BACK: Record<TransactionStatusWire, boolean> = { paid: false, refunded: true }

  it.each(API_TRANSACTION_STATUSES)('places %s on the right side of the badge', (status) => {
    expect(toTransactionRow(transaction({ status })).refunded).toBe(CAME_BACK[status])
  })

  // `partially_refunded` was invented here and has never been a `payment_status`
  // value. A reversal is a row of its own in the `refunds` table, carrying the
  // amount and a `refund_status` of its own, and the payment it reverses flips
  // to plain `refunded` — so there is no partial status for this row to wear.
  // It survived because the lookup it sat in was a `Set<string>`, which `tsc`
  // cannot check; the typed map in the mapper is what stops the next one, and
  // that pin lives in `tsc -b` rather than in this suite.
  it('does not read the invented partially_refunded as money coming back', () => {
    expect(toTransactionRow(transaction({ status: 'partially_refunded' })).refunded).toBe(false)
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
