/**
 * Google's documented "search" entry point. No API key, no script, no embed —
 * so this costs nothing, loads nothing, and cannot leak a key.
 */
const MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query='

export interface VenueParts {
  venueName?: string | null
  address?: string | null
  city?: string | null
}

/**
 * Where the venue is, on a map — or `null` when there is nothing to look up.
 *
 * Derived from what the organizer typed rather than stored beside it. A saved
 * link and an edited address drift apart silently, and the copy that misleads
 * somebody standing outside the wrong building at 7pm is always the stale one.
 *
 * The city is included because a Thai street address frequently will not
 * resolve without it — and left out when it is already part of the address,
 * since repeating it narrows nothing.
 */
export function mapLinkFor(venue: VenueParts): string | null {
  const parts: string[] = []
  for (const raw of [venue.venueName, venue.address, venue.city]) {
    const part = raw?.trim()
    if (!part) continue
    // Case-insensitive, because "bangkok" typed in the address and "Bangkok"
    // chosen as the city are the same place.
    const already = parts.some((seen) => seen.toLowerCase().includes(part.toLowerCase()))
    if (!already) parts.push(part)
  }
  if (parts.length === 0) return null
  return `${MAPS_SEARCH}${encodeURIComponent(parts.join(', '))}`
}
