/**
 * Google's documented "search" entry point. No API key, no script, no embed —
 * so this costs nothing, loads nothing, and cannot leak a key.
 */
const MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query='
/** The documented Embed API — used when a key is configured. */
const MAPS_EMBED_V1 = 'https://www.google.com/maps/embed/v1/place'
/** Keyless, so a fresh checkout shows a map with nothing set up. */
const MAPS_EMBED_KEYLESS = 'https://maps.google.com/maps?q='

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
  const query = queryOf(venue)
  return query ? `${MAPS_SEARCH}${encodeURIComponent(query)}` : null
}

/**
 * The same place as an embeddable URL, for an `<iframe>`.
 *
 * Two endpoints, because Google offers two. With a key it is the documented
 * Embed API — supported, quota-ed, and the one to rely on in production. Without
 * one it is `output=embed`, which needs no key and no account, so the map works
 * on a fresh checkout with nothing configured.
 *
 * The key is safe in the URL — an Embed API key is public by design and is
 * restricted by HTTP referrer at Google's end, not by hiding it. It still comes
 * from typed `import.meta.env` at the call site rather than being written here.
 */
export function mapEmbedFor(venue: VenueParts, apiKey?: string): string | null {
  const query = queryOf(venue)
  if (!query) return null
  const escaped = encodeURIComponent(query)
  const key = apiKey?.trim()
  // A blank key is not a key: `key=` is a request Google refuses outright, and
  // an unset env var reads as '' rather than as undefined.
  if (!key) return `${MAPS_EMBED_KEYLESS}${escaped}&output=embed`
  return `${MAPS_EMBED_V1}?key=${encodeURIComponent(key)}&q=${escaped}`
}

/**
 * Whether this address can be found on its own.
 *
 * A street address needs a number AND a word that is not just the number — "999/9
 * Rama I Rd" qualifies, "Hall 3" and "3rd floor" do not. The second kind names a
 * room inside a building, so it only means something next to the building's name.
 */
function isLocatableAddress(address: string): boolean {
  const hasNumber = /\d/.test(address)
  const words = address.split(/[\s,]+/).filter(Boolean)
  return hasNumber && words.length >= 3
}

/**
 * What to look for.
 *
 * When there is a real street address, that ALONE is the query. This is the
 * whole rule, and it is not tidiness: "BITEC" is in Bang Na, "999/9 Rama I Rd,
 * Pathum Wan" is fifteen kilometres away, and sent together Google resolves the
 * name and drops the pin at the wrong one — so an organizer who fixed the
 * address watched the map ignore the correction.
 *
 * A street address is the more specific claim and the thing a geocoder is built
 * to read. The venue name is for the person reading the page.
 *
 * Without a locatable address, the name is what makes the place findable, and
 * everything present is combined as before.
 */
function queryOf(venue: VenueParts): string | null {
  const address = venue.address?.trim()
  const sources =
    address && isLocatableAddress(address)
      ? [address, venue.city]
      : [venue.venueName, venue.address, venue.city]

  const parts: string[] = []
  for (const raw of sources) {
    const part = raw?.trim()
    if (!part) continue
    // Case-insensitive, because "bangkok" typed in the address and "Bangkok"
    // chosen as the city are the same place.
    const already = parts.some((seen) => seen.toLowerCase().includes(part.toLowerCase()))
    if (!already) parts.push(part)
  }
  if (parts.length === 0) return null
  return parts.join(', ')
}
