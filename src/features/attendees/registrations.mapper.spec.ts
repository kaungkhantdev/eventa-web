import { describe, expect, it } from 'vitest'
import { MASKED } from '@/lib/format'
import { toRegistrationRow } from './registrations.mapper'
import { STATUS_BADGE } from './registrations.presentation'
import type { RegistrationEntry, RegistrationWireStatus } from './registrations.types'

/**
 * Every value the API can put on the wire for `order_status`, copied verbatim
 * from the `orderStatusEnum` pgEnum in `eventa-api/src/db/schema/enums.ts`,
 * which `RegistrationEntryDto` republishes as
 * `@ApiProperty({ enum: orderStatusEnum.enumValues })` and which the
 * registrations service hands back unmapped (`status: row.status`).
 *
 * They are written out as literals rather than derived from this repo's own
 * union, because that union is the thing that drifted: a list taken from it
 * would only ever test itself, which is exactly how `expired` reached the admin
 * queue as a thrown TypeError while both repos type-checked clean. The
 * `satisfies` clause ties the two together in the other direction, so a future
 * seventh API value cannot be added here without widening the union first.
 */
const API_ORDER_STATUSES = [
  'confirmed',
  'pending',
  'waitlisted',
  'cancelled',
  'rejected',
  'expired',
] as const satisfies readonly RegistrationWireStatus[]

const entry = (o: Partial<RegistrationEntry> = {}): RegistrationEntry => ({
  id: 'o-1',
  reference: 'ORD-2026-0009',
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  buyerName: 'Anong Pattana',
  buyerEmail: 'anong.p@gmail.com',
  status: 'confirmed',
  paymentStatus: 'paid',
  seats: 2,
  ticketTypeName: 'VIP',
  totalSatang: 240_000,
  amountLabel: '฿2,400',
  registeredAt: '2026-07-08T03:00:00Z',
  confirmedAt: '2026-07-08T03:01:00Z',
  rejectedAt: null,
  cancelledAt: null,
  canApprove: false,
  approveBlockedReason: null,
  canReject: false,
  rejectBlockedReason: null,
  canOffer: false,
  waitlistPosition: null,
  offerExpiresAt: null,
  awaitingApproval: false,
  rejectRefunds: false,
  ...o,
})

describe('a registration row, as the queue shows it (US-REG-01)', () => {
  it('carries the id, so an action knows which registration it acts on', () => {
    expect(toRegistrationRow(entry()).id).toBe('o-1')
  })

  it('names the attendee and their event', () => {
    const row = toRegistrationRow(entry())
    expect(row.name).toBe('Anong Pattana')
    expect(row.email).toBe('anong.p@gmail.com')
    expect(row.event).toBe('Tech Summit 2026')
  })

  it('derives the avatar initials from the name', () => {
    expect(toRegistrationRow(entry()).initials).toBe('AP')
  })

  it('shows the registration date in Bangkok', () => {
    expect(toRegistrationRow(entry()).date).toBe('Jul 8, 2026')
  })

  describe('the tier they bought', () => {
    it('names it', () => {
      expect(toRegistrationRow(entry()).ticket).toBe('VIP')
    })

    it('lists every tier of a mixed order, as the API joined them', () => {
      const row = toRegistrationRow(entry({ ticketTypeName: 'Early Bird, VIP' }))
      expect(row.ticket).toBe('Early Bird, VIP')
    })

    it('shows a dash when the tier no longer exists, never an empty cell', () => {
      // The API answers null once a tier has been hard-deleted; the order is
      // still real, so the row must stay readable rather than losing a column.
      expect(toRegistrationRow(entry({ ticketTypeName: null })).ticket).toBe(MASKED)
    })
  })

  describe('the amount', () => {
    it('formats a paid registration in baht', () => {
      expect(toRegistrationRow(entry()).amount).toBe('฿2,400')
    })

    it('says "Free" when nothing was owed', () => {
      expect(toRegistrationRow(entry({ totalSatang: 0 })).amount).toBe('Free')
    })

    it('shows a dash — never ฿0 — when the caller may not see money', () => {
      // US-REG-01 masks the figure to null for a caller without `finView`.
      const row = toRegistrationRow(entry({ totalSatang: null, amountLabel: null }))
      expect(row.amount).toBe(MASKED)
      expect(row.amount).not.toBe('฿0')
      expect(row.amount).not.toBe('Free')
    })

    it('is derived from the NUMBER, not the API label', () => {
      // The label is a convenience; deriving from `totalSatang` keeps the
      // null-vs-zero rule in one tested place rather than trusting the string.
      const row = toRegistrationRow(entry({ totalSatang: 0, amountLabel: 'anything' }))
      expect(row.amount).toBe('Free')
    })
  })

  describe('the status', () => {
    it.each([
      ['confirmed', 'Confirmed'],
      ['pending', 'Pending'],
      ['waitlisted', 'Waitlisted'],
      ['cancelled', 'Cancelled'],
      ['rejected', 'Rejected'],
      ['expired', 'Expired'],
    ] as const)('renders %s as %s', (wire, shown) => {
      expect(toRegistrationRow(entry({ status: wire })).status).toBe(shown)
    })

    // `STATUS_LABEL` has no fallback, so a wire value missing from it does not
    // degrade — it yields `undefined`, which the page then uses as a key into
    // `STATUS_BADGE` and throws on. Asserting a non-empty string here catches
    // that one step before the crash, for every value the API can send.
    it.each(API_ORDER_STATUSES)('has a label of its own for %s', (status) => {
      const shown = toRegistrationRow(entry({ status })).status
      expect(shown).toBeTypeOf('string')
      expect(shown).not.toBe('')
    })

    // Six statuses are six different facts for whoever reconciles the queue.
    // Collapsing any two onto one word would lose the distinction the API's
    // own enum comments insist on (a lapse is not a decision).
    it('gives every API status a label no other status shares', () => {
      const labels = API_ORDER_STATUSES.map((status) => toRegistrationRow(entry({ status })).status)
      expect(new Set(labels).size).toBe(API_ORDER_STATUSES.length)
    })

    // The defect lived in the seam between the mapper and the badge map, where
    // neither file was wrong on its own: the mapper returned `undefined` for a
    // status it had no row for, and the page used that as a key. This walks the
    // same two steps the page does, so the seam itself is covered rather than
    // each half separately.
    it.each(API_ORDER_STATUSES)('reaches a renderable badge for %s', (status) => {
      const badge = STATUS_BADGE[toRegistrationRow(entry({ status })).status]
      expect(badge).toBeDefined()
      expect(badge.cls).not.toBe('')
    })
  })

  describe('what the organizer may do (US-REG-02)', () => {
    it('offers approve and reject when the API allows them', () => {
      const row = toRegistrationRow(
        entry({ status: 'pending', canApprove: true, canReject: true }),
      )
      expect(row.canApprove).toBe(true)
      expect(row.canReject).toBe(true)
    })

    it('carries the API’s OWN reason for refusing, to show verbatim', () => {
      // The API writes these for the person reading them; inventing our own
      // wording would lose the instruction ("cancel and refund it instead").
      const row = toRegistrationRow(
        entry({
          canApprove: false,
          approveBlockedReason: "Payment isn't complete yet, so this registration can't be approved.",
          canReject: false,
          rejectBlockedReason: 'Money has been captured — cancel and refund it instead.',
        }),
      )
      expect(row.approveBlockedReason).toMatch(/payment isn't complete/i)
      expect(row.rejectBlockedReason).toMatch(/refund/i)
    })

    it('offers neither on a decided registration', () => {
      const row = toRegistrationRow(entry({ status: 'confirmed' }))
      expect(row.canApprove).toBe(false)
      expect(row.canReject).toBe(false)
    })
  })
})

describe('a registration awaiting approval (US-REG-02 — pay first)', () => {
  const waiting = (o: Partial<RegistrationEntry> = {}) =>
    entry({
      status: 'pending',
      paymentStatus: 'paid',
      confirmedAt: null,
      awaitingApproval: true,
      canApprove: true,
      canReject: true,
      rejectRefunds: true,
      ...o,
    })

  it('says it has been paid for and waits for a decision', () => {
    expect(toRegistrationRow(waiting()).statusNote).toBe('Paid · awaiting approval')
  })

  it('says a free one simply waits for a decision', () => {
    const free = waiting({ paymentStatus: 'pending', totalSatang: 0, rejectRefunds: false })
    expect(toRegistrationRow(free).statusNote).toBe('Awaiting approval')
  })

  it('says rejecting it refunds the payment, before the click', () => {
    expect(toRegistrationRow(waiting()).rejectLabel).toBe('Reject and refund')
  })

  it('calls an ordinary rejection just that', () => {
    expect(toRegistrationRow(waiting({ rejectRefunds: false })).rejectLabel).toBe('Reject')
    expect(toRegistrationRow(entry()).rejectLabel).toBe('Reject')
  })

  it('flags a rejection whose refund has not gone through yet', () => {
    const rejected = waiting({ status: 'rejected', awaitingApproval: false })
    expect(toRegistrationRow(rejected).statusNote).toBe('Payment not yet refunded')
  })

  it('has nothing to add once the refund has gone through', () => {
    const refunded = waiting({
      status: 'rejected',
      paymentStatus: 'refunded',
      awaitingApproval: false,
      rejectRefunds: false,
    })
    expect(toRegistrationRow(refunded).statusNote).toBeNull()
  })

  it('leaves approve and reject to the server — including a reject the caller may not refund', () => {
    const row = toRegistrationRow(
      waiting({
        canReject: false,
        rejectBlockedReason: 'Rejecting this registration refunds its payment, and refunds need the refund permission — ask an Admin.',
      }),
    )
    expect(row.canApprove).toBe(true)
    expect(row.canReject).toBe(false)
    expect(row.rejectBlockedReason).toMatch(/refund permission/)
  })
})

describe('the waitlist, as the organizer works it (US-REG-04)', () => {
  const waiting = (position: number) =>
    toRegistrationRow(entry({ status: 'waitlisted', canOffer: true, waitlistPosition: position }))

  it('says who is next', () => {
    expect(waiting(1).statusNote).toBe('Next in line')
  })

  it('says where everybody else stands', () => {
    expect(waiting(3).statusNote).toBe('#3 in line')
  })

  it('warns that offering someone further back passes people over', () => {
    // The API records it; the organizer should know before they click.
    expect(waiting(1).offerHint).toBe('Offer a seat')
    expect(waiting(3).offerHint).toBe(
      'Offer a seat — 2 people ahead of them will be passed over, and that is recorded',
    )
    expect(waiting(2).offerHint).toMatch(/1 person ahead of them/)
  })

  it('passes the server’s say on whether a seat can be offered', () => {
    expect(waiting(1).canOffer).toBe(true)
    expect(toRegistrationRow(entry()).canOffer).toBe(false)
  })

  it('says until when an open offer holds the seat, on Bangkok’s clock', () => {
    const row = toRegistrationRow(
      entry({ status: 'pending', paymentStatus: 'pending', offerExpiresAt: '2026-08-02T03:00:00Z' }),
    )
    expect(row.statusNote).toBe('Offer open until Aug 2, 2026 10:00')
  })

  it('has nothing to add for an ordinary registration', () => {
    expect(toRegistrationRow(entry()).statusNote).toBeNull()
  })
})
