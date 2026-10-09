import type { RegistrationStatus } from './registrations.types'

/**
 * How the queue looks — the kit's own choices, kept out of the mapper because
 * they are decoration rather than domain. Ported from admin/registrations.html.
 */

/**
 * Badge class + icon per status, from the source's STATUS_BADGE map.
 *
 * Exhaustive and without a fallback, on purpose — the reasoning is written out
 * over `STATUS_LABEL` in `registrations.mapper.ts`, and both maps have to make
 * the same choice to get the compile-time guarantee. The page reads `.cls`
 * straight off the result of this lookup, so a miss here is a TypeError that
 * takes down the whole queue row, not just its badge.
 */
export const STATUS_BADGE: Record<RegistrationStatus, { cls: string; icon: string }> = {
  Confirmed: { cls: 'badge-green', icon: 'hgi-checkmark-badge-01' },
  Pending: { cls: 'badge-amber', icon: 'hgi-clock-01' },
  Waitlisted: { cls: 'badge-blue', icon: 'hgi-time-schedule' },
  Cancelled: { cls: 'badge-gray', icon: 'hgi-cancel-circle' },
  // Not in the static kit, which never showed a rejected booking. The API has
  // the status, so the table has to be able to render one.
  Rejected: { cls: 'badge-red', icon: 'hgi-cancel-circle' },
  // Nobody paid and the payment window closed — no decision was ever made, so
  // it is grey like Cancelled rather than red like Rejected, which would blame
  // an organizer who never acted. It also matches the grey the buyer sees for
  // this same order in the portal (`EXPIRED_STATE` in guestOrder.mapper.ts);
  // one order should not be two colours. The hourglass is what separates it
  // from Cancelled's cancel-circle: a clock ran out, nobody withdrew.
  Expired: { cls: 'badge-gray', icon: 'hgi-time-quarter-pass' },
}
