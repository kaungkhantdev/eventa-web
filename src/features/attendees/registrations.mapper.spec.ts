import { describe, expect, it } from 'vitest'
import { MASKED } from '@/lib/format'
import { toRegistrationRow } from './registrations.mapper'
import type { RegistrationEntry } from './registrations.types'

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
    ] as const)('renders %s as %s', (wire, shown) => {
      expect(toRegistrationRow(entry({ status: wire })).status).toBe(shown)
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
