import type { Me } from './types'

/**
 * Whether to OFFER something in the console.
 *
 * This tidies the UI — it hides a button the caller cannot use. It is **not**
 * the access control: the API enforces every permission server-side and returns
 * 403, and a page must still handle that. Never reason "the button is hidden,
 * so the check is done".
 *
 * A missing session refuses everything. Absence of proof is not proof of
 * permission, and defaulting the other way would flash a full-privilege console
 * during any moment `me` has not loaded.
 */
export function can(me: Me | null, permission: string): boolean {
  return me?.permissions.includes(permission) ?? false
}

/** Granted ANY of these — mirrors the API's `@RequireAnyPermission`. */
export function canAny(me: Me | null, permissions: string[]): boolean {
  return permissions.some((permission) => can(me, permission))
}

/**
 * The line under the name in the user chip. `/auth/me` carries no job title, so
 * this shows the workspace the session is scoped to — true, and useful to
 * someone who belongs to more than one.
 */
export function displayRole(me: Me | null): string {
  return me?.organization.name ?? ''
}
