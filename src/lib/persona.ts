/**
 * Who is signed in — the product's two audiences (US-DISC-08).
 *
 * Here in `@/lib` rather than in the auth feature because the transport layer
 * has to know it too: a stored session is labelled with the persona that owns
 * it, and `@/lib/api` cannot import a feature without inverting the layering.
 */
export type Persona = 'admin' | 'attendee'

export const PERSONAS: readonly Persona[] = ['admin', 'attendee']

/** Whether a string off the wire — or out of storage — names a persona. */
export function isPersona(value: unknown): value is Persona {
  return typeof value === 'string' && (PERSONAS as readonly string[]).includes(value)
}
