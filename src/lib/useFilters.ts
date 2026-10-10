import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  clearedParams,
  emptyListReason,
  hasActiveFilters,
  nextParams,
  type FilterPatch,
} from './urlFilters'

/** How long typing pauses before the URL — and therefore the API — is asked. */
export const SEARCH_DEBOUNCE_MS = 300

/**
 * Read and write the filters a list page keeps in its URL.
 *
 * `set` pushes by default so the back button steps through the choices the
 * organizer made; pass `replace` for changes they did not deliberately make
 * one at a time, such as each keystroke in a search box.
 */
export function useFilters(options: FilterMeta = {}) {
  const [params, setParams] = useSearchParams()
  const { defaults, ignore, total } = options

  const set = useCallback(
    (patch: FilterPatch, options: { replace?: boolean } = {}) => {
      setParams((current) => nextParams(current, patch), { replace: options.replace ?? false })
    },
    [setParams],
  )

  // `clear` is handed to an empty state as a callback, so it needs a stable
  // identity. `ignore` is a fresh array literal on every render, which would
  // defeat that — depend on its contents instead of its reference.
  const ignoreKey = ignore?.join(',') ?? ''
  const clear = useCallback(() => {
    const keep = ignoreKey ? ignoreKey.split(',') : undefined
    setParams((current) => clearedParams(current, { ignore: keep }))
  }, [setParams, ignoreKey])

  return {
    params,
    set,
    clear,
    /** Whether anything is currently narrowing the list. */
    filtered: hasActiveFilters(params, { defaults, ignore }),
    /**
     * Which empty state to show if the list came back with no rows. Branch on
     * this rather than on `filtered`, so a page past the end gets its own
     * answer instead of being blamed on filters nobody set.
     */
    emptyReason: emptyListReason(params, { defaults, ignore, total }),
  }
}

/** What this page's query string means, so a default is not read as a filter. */
export interface FilterMeta {
  defaults?: Record<string, string>
  ignore?: string[]
  /**
   * The matching total the API reported (`window.total`), when the page has
   * one. Pass it so an empty page can only be called "past the end" while rows
   * genuinely exist further back.
   */
  total?: number
}

/**
 * A search box that writes to the URL once typing pauses.
 *
 * The input stays responsive while the request is debounced, and the URL wins
 * whenever it changes underneath — the back button, or a cleared filter, must
 * be reflected in the box rather than being overwritten by what was typed.
 *
 * WHY THE TERM IS IN THE URL AT ALL, given "no PII in a URL or query string".
 * Fourteen pages use this, and on the attendee, registration and check-in
 * lists the term is somebody's name or email. The two rules in AGENTS.md
 * genuinely pull against each other here, so the reasoning is written down
 * rather than re-argued, and the answer is NOT to move the term into
 * component state.
 *
 * It cannot live in component state. The API pages server-side and the route
 * loader reads the query string; a term the loader cannot see means fetching
 * from the component, which breaks server-side paging, the skeleton model and
 * the back button at once. The URL is load-bearing, not a convenience.
 *
 * So the rule is honoured by closing what it actually protects against —
 * the term reaching somewhere nobody chose to send it. Each path, and what
 * closes it:
 *
 * - **The API's access log.** It logged `req.url` and `req.query` on every
 *   request. Now masked unless the parameter is on an allowlist, and the
 *   Referer's query is masked with it (eventa-api `logger.config.ts`).
 * - **Third parties.** Two font hosts and the icon CDN are loaded from
 *   `index.html`. The referrer policy is pinned there to
 *   `strict-origin-when-cross-origin`, so they are sent the origin and
 *   nothing else — pinned rather than left to a browser default.
 * - **Analytics and error reporters.** There are none. Should one ever be
 *   added, it captures `location.href` by default and this comment is the
 *   reason to configure it not to.
 * - **History.** `set({ q }, { replace: true })` at every call site, so a
 *   search replaces rather than stacking one entry per keystroke.
 *
 * What is deliberately NOT treated as a leak: the organizer's own address bar
 * and their own history. They typed the term, and it names a record they are
 * authorised to read and are looking at on screen. The rule is about
 * propagation, not about showing somebody their own query.
 */
export function useSearchBox(value: string, commit: (next: string) => void) {
  const [term, setTerm] = useState(value)
  const [seen, setSeen] = useState(value)

  // `commit` is a fresh closure on every render, and these pages re-render
  // whenever the router's state changes. Held in a ref rather than listed as a
  // dependency, because otherwise the timer is re-armed on each of those
  // renders — and since `value` only catches up once the navigation *commits*,
  // a loader slower than the debounce would re-fire the same search forever,
  // each one aborting the request before it could answer.
  const latest = useRef(commit)
  useEffect(() => {
    latest.current = commit
  })

  // Adjusted during render rather than in an effect: when the URL changes
  // underneath, the box should already show the new value on this paint, not
  // flash the old one and correct itself afterwards.
  if (value !== seen) {
    setSeen(value)
    setTerm(value)
  }

  useEffect(() => {
    if (term === value) return
    const timer = setTimeout(() => latest.current(term), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [term, value])

  return [term, setTerm] as const
}
