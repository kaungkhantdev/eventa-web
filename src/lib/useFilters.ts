import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { nextParams, type FilterPatch } from './urlFilters'

/** How long typing pauses before the URL — and therefore the API — is asked. */
export const SEARCH_DEBOUNCE_MS = 300

/**
 * Read and write the filters a list page keeps in its URL.
 *
 * `set` pushes by default so the back button steps through the choices the
 * organizer made; pass `replace` for changes they did not deliberately make
 * one at a time, such as each keystroke in a search box.
 */
export function useFilters() {
  const [params, setParams] = useSearchParams()

  const set = useCallback(
    (patch: FilterPatch, options: { replace?: boolean } = {}) => {
      setParams((current) => nextParams(current, patch), { replace: options.replace ?? false })
    },
    [setParams],
  )

  return { params, set }
}

/**
 * A search box that writes to the URL once typing pauses.
 *
 * The input stays responsive while the request is debounced, and the URL wins
 * whenever it changes underneath — the back button, or a cleared filter, must
 * be reflected in the box rather than being overwritten by what was typed.
 */
export function useSearchBox(value: string, commit: (next: string) => void) {
  const [term, setTerm] = useState(value)
  const [seen, setSeen] = useState(value)

  // Adjusted during render rather than in an effect: when the URL changes
  // underneath, the box should already show the new value on this paint, not
  // flash the old one and correct itself afterwards.
  if (value !== seen) {
    setSeen(value)
    setTerm(value)
  }

  useEffect(() => {
    if (term === value) return
    const timer = setTimeout(() => commit(term), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [term, value, commit])

  return [term, setTerm] as const
}
