/**
 * What a signed-out visitor has saved for later (US-DISC-03).
 *
 * Browsing never requires an account, so the heart has to work before there is
 * anywhere on the server to put it. This is that holding place, and only that:
 * once somebody signs in, `POST /me/saved-events/merge` takes the list and the
 * account becomes the single source of truth. Nothing here is ever consulted
 * for a signed-in attendee — two stores that both claim to know is exactly the
 * divergence the API is meant to prevent.
 */

const KEY = 'eventa.savedEvents'

/** The slice of `Storage` this needs — passed in, so the rules are testable. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface SavedEvents {
  ids(): string[]
  has(eventId: string): boolean
  add(eventId: string): void
  remove(eventId: string): void
  clear(): void
}

export function createSavedEvents(store: KeyValueStore): SavedEvents {
  /**
   * Storage is shared with everything else on the origin and can be edited by
   * hand, so its contents are a claim rather than a guarantee. Anything that is
   * not a list of ids reads as nothing saved: a corrupt entry should cost a
   * visitor their shortlist, not the page.
   */
  const read = (): string[] => {
    const stored = store.getItem(KEY)
    if (stored === null) return []
    const parsed = parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  }

  const write = (ids: string[]) => store.setItem(KEY, JSON.stringify(ids))

  return {
    ids: read,
    has: (eventId) => read().includes(eventId),
    add(eventId) {
      const ids = read()
      if (ids.includes(eventId)) return
      write([...ids, eventId])
    },
    remove: (eventId) => write(read().filter((id) => id !== eventId)),
    clear: () => store.removeItem(KEY),
  }
}

function parse(stored: string): unknown {
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * The one bound to the browser. Reached through arrow functions so that merely
 * importing this module outside a browser never touches a global that is not
 * there — the test suite runs without a DOM by design.
 */
export const savedEvents = createSavedEvents({
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
})
