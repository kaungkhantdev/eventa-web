import { describe, expect, it } from 'vitest'
import { STATUS_BADGE } from './registrations.presentation'
import type { RegistrationStatus } from './registrations.types'

/**
 * One display label per member of the API's `order_status` pgEnum — the labels
 * the queue has to be able to badge, because the mapper can produce any of
 * them from a wire row.
 *
 * Written as literals for the same reason the mapper spec's wire list is, and
 * pinned with `satisfies` to the display union rather than derived from it: a
 * list read out of `RegistrationStatus` would re-state whatever that union
 * happens to say and pass even while a status was missing from both. Pinned in
 * this direction, a seventh API value has to widen the union before this file
 * compiles, and widening the union then forces `STATUS_BADGE` to grow too.
 */
const BADGEABLE_STATUSES = [
  'Confirmed',
  'Pending',
  'Waitlisted',
  'Cancelled',
  'Rejected',
  'Expired',
] as const satisfies readonly RegistrationStatus[]

/**
 * `STATUS_BADGE` is the queue's crash surface: the page keys it by the row's
 * status and reads `.cls` off the result with no guard, so a miss is a
 * TypeError that takes the whole row down rather than a badge that renders
 * plain. These tests assert the lookup is TOTAL — never which classes it
 * returns. This repo does not unit-test markup (AGENTS.md), and a test pinning
 * `badge-gray` would break on a legitimate restyle while catching no defect.
 */
describe('the status badge, for every status the API can send', () => {
  it.each(BADGEABLE_STATUSES)('has a badge for %s, with no fallback needed', (status) => {
    const badge = STATUS_BADGE[status]

    expect(badge).toBeDefined()
    expect(badge.cls).not.toBe('')
    expect(badge.icon).not.toBe('')
  })

  // The guard that makes the two lists above mean something: if `STATUS_BADGE`
  // ever carries an entry this list does not, the list is the stale one.
  it('carries no status the list does not claim', () => {
    expect(Object.keys(STATUS_BADGE).sort()).toEqual([...BADGEABLE_STATUSES].sort())
  })
})
