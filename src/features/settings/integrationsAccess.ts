import { can } from '@/features/auth/permissions'
import type { Me } from '@/features/auth/types'

/**
 * The permission eventa-api's `calendar-connection.controller.ts` requires on
 * `POST /calendar-connection/connect` and `/disconnect`. Reading the status
 * needs none, which is why an Organizer or Staff member still sees it.
 */
export const MANAGE_INTEGRATIONS = 'setIntegrations'

/**
 * Whether the console offers to connect or disconnect Google Calendar
 * (US-MTG-08).
 *
 * Like every gate in `@/features/auth/permissions`, this only tidies the page:
 * the API refuses both with a 403 regardless, and the page still shows it.
 */
export function canManageIntegrations(me: Me | null): boolean {
  return can(me, MANAGE_INTEGRATIONS)
}
