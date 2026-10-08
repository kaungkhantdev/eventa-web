import type { RegistrationStatus } from './registrations.types'

/**
 * How the queue looks — the kit's own choices, kept out of the mapper because
 * they are decoration rather than domain. Ported from admin/registrations.html.
 */

/** Badge class + icon per status, from the source's STATUS_BADGE map. */
export const STATUS_BADGE: Record<RegistrationStatus, { cls: string; icon: string }> = {
  Confirmed: { cls: 'badge-green', icon: 'hgi-checkmark-badge-01' },
  Pending: { cls: 'badge-amber', icon: 'hgi-clock-01' },
  Waitlisted: { cls: 'badge-blue', icon: 'hgi-time-schedule' },
  Cancelled: { cls: 'badge-gray', icon: 'hgi-cancel-circle' },
  // Not in the static kit, which never showed a rejected booking. The API has
  // the status, so the table has to be able to render one.
  Rejected: { cls: 'badge-red', icon: 'hgi-cancel-circle' },
}
