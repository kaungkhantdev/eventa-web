/**
 * Where to send someone after they sign in.
 *
 * The guard remembers where they were headed in `?from=`, which means the
 * destination is attacker-supplied: a link to `/auth/login?from=//evil.example`
 * would otherwise bounce them off the site with their session freshly created.
 * Only a path rooted at this site is honoured.
 */
export function safeRedirect(from: string | null, fallback: string): string {
  return isSameSitePath(from) ? from : fallback
}

function isSameSitePath(from: string | null): from is string {
  if (!from || !from.startsWith('/')) return false
  // `//evil.example` is a protocol-relative URL, and browsers normalise the
  // backslash form `/\evil.example` to the same thing — so both leave the site
  // despite starting with a slash.
  return from[1] !== '/' && from[1] !== '\\'
}
