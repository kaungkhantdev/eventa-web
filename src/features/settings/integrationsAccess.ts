import { can } from '@/features/auth/permissions'
import type { Me } from '@/features/auth/types'
import { MANAGE_INTEGRATIONS } from '@/lib/constants/settings.constants'

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
