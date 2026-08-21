/**
 * The name and email carried into sign-up from somewhere that already knows
 * them — today the guest order page, where the buyer has just typed both.
 *
 * Carried in the router's history state, never the query string: these are
 * personal data, and a URL is copied into logs, bookmarks and `Referer`
 * headers. State travels with the navigation and appears in none of them.
 *
 * Treated as untrusted all the same. Anything can push anything onto history
 * state and it survives a reload, so a field that is not a string is dropped
 * rather than rendered — stringifying an object into a form value is how
 * "[object Object]" ends up as somebody's account name.
 */
export interface SignupHandoff {
  name: string
  email: string
}

const EMPTY: SignupHandoff = { name: '', email: '' }

export function handoffOf(state: unknown): SignupHandoff {
  if (typeof state !== 'object' || state === null) return EMPTY
  const carried = state as Record<string, unknown>
  return { name: textOf(carried.name), email: textOf(carried.email) }
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
