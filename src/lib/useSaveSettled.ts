import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  refusalIn,
  savedBy,
  startSaveTrack,
  trackSave,
  type FetcherState,
  type SaveResult,
  type Settlement,
} from './saveSettled'

/**
 * A panel's or a dialog's save, reported once — see `saveSettled.ts` for the
 * rule and why "idle and ok" is not it.
 *
 * `onSaved` runs on the render a submission made while the panel is open comes
 * back accepted, and never again for that answer: not on a later close, a
 * reopen, or a re-render. `refusal` is the API's sentence for a submission made
 * since the panel last opened, so a reopened panel starts clean. `opening`
 * changes each time the panel opens; key the form on it and every opening is
 * seeded afresh rather than showing what was typed into the last one.
 */
export function useSaveSettled<R extends SaveResult>(
  fetcher: { readonly state: FetcherState; readonly data: R | undefined },
  {
    open = true,
    onSaved,
  }: {
    /** Leave out for a surface mounted only while it shows. */
    open?: boolean
    /** The toast and the close, usually. */
    onSaved: () => void
  },
): { refusal: string | null; opening: number } {
  // Adjusted during render, not in an effect, so the reopened panel's first
  // paint already has no stale refusal on it.
  const [track, setTrack] = useState(() => startSaveTrack<R>(fetcher.state, open))
  const next = trackSave(track, { state: fetcher.state, open, data: fetcher.data })
  if (next !== track) setTrack(next)

  // Not a dependency: an inline arrow at the call site is new every render,
  // and the save is the event — not the callback's identity.
  const saved = useEffectEvent(onSaved)
  // Effects re-run without a new answer too — StrictMode's mount check, Fast
  // Refresh — and a second run must not close a panel opened since.
  const reported = useRef<Settlement<R> | null>(null)
  const { settlement } = next
  useEffect(() => {
    if (!settlement || reported.current === settlement) return
    reported.current = settlement
    if (savedBy({ settlement })) saved()
  }, [settlement])

  return { refusal: refusalIn(next), opening: next.opening }
}
