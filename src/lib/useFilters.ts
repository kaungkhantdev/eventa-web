import { useCallback, useEffect, useRef, useState } from 'react'
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
