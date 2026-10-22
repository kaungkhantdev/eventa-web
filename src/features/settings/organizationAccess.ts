import { can } from '@/features/auth/permissions'
import type { Me } from '@/features/auth/types'
import { EDIT_ORGANIZATION } from '@/lib/constants/settings.constants'

/**
 * Whether Settings → Organization offers an edit at all (US-SET-07).
 *
 * Like every gate in `@/features/auth/permissions`, this only tidies the page:
 * the API refuses the save with a 403 regardless, and the page still shows it.
 */
export function canEditOrganization(me: Me | null): boolean {
  return can(me, EDIT_ORGANIZATION)
}
