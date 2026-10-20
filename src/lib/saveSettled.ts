/**
 * When a form's save has finished — the rule behind `useSaveSettled`.
 *
 * A fetcher keeps its last answer until the next submission, and a slide-over
 * keeps its element (and so its fetcher) while it is closed. "Idle with an ok
 * answer" is therefore a STATE that lasts the rest of the page's life, not an
 * event, and a panel that closed itself on it closed again on every reopen.
 * What is tracked here is the moment the fetcher goes from busy to idle — once
 * per submission — and, for the panel's error line, only an answer that came
 * back since the panel last opened.
 */

/** React Router's fetcher states. */
export type FetcherState = 'idle' | 'submitting' | 'loading'

/** All this needs of an action's answer; `ActionResult` is one. */
export interface SaveResult {
  readonly ok: boolean
  /** The API's own sentence when it refused. */
  readonly error?: string
}

/**
 * One submission that finished. A fresh object each time, so two identical
 * answers in a row are still two events.
 */
export interface Settlement<R extends SaveResult> {
  readonly result: R | undefined
}

/** What one render saw: the fetcher, and whether its panel is showing. */
export interface SaveRender<R extends SaveResult> {
  readonly state: FetcherState
  readonly open: boolean
  readonly data: R | undefined
}

/** Carried from one render to the next. */
export interface SaveTrack<R extends SaveResult> {
  readonly state: FetcherState
  readonly open: boolean
  /** How many times the panel has opened — a key that rebuilds its form per opening. */
  readonly opening: number
  /** The submission that finished since the panel last opened, if any. */
  readonly settlement: Settlement<R> | null
}

const IDLE: FetcherState = 'idle'

/** The render a submission finishes on: busy last time, idle now. */
export function settled(previous: FetcherState, next: FetcherState): boolean {
  return previous !== IDLE && next === IDLE
}

/**
 * Where a component starts. Whatever its fetcher already holds is somebody
 * else's news: a keyed fetcher outlives the component that last used it.
 */
export function startSaveTrack<R extends SaveResult>(
  state: FetcherState,
  open: boolean,
): SaveTrack<R> {
  return { state, open, opening: 0, settlement: null }
}

/**
 * The next render's track. Returns the same object when nothing moved, so a
 * repeated render — StrictMode's second pass — is not a second event.
 */
export function trackSave<R extends SaveResult>(
  track: SaveTrack<R>,
  { state, open, data }: SaveRender<R>,
): SaveTrack<R> {
  if (state === track.state && open === track.open) return track
  const reopened = open && !track.open
  return {
    state,
    open,
    opening: reopened ? track.opening + 1 : track.opening,
    settlement: settlementAfter(track, state, open, data, reopened),
  }
}

function settlementAfter<R extends SaveResult>(
  track: SaveTrack<R>,
  state: FetcherState,
  open: boolean,
  data: R | undefined,
  reopened: boolean,
): Settlement<R> | null {
  // Finishing behind a closed panel is nobody's news: there is nothing left to
  // close, and the toast would explain nothing on screen.
  if (settled(track.state, state)) return open ? { result: data } : null
  return reopened ? null : track.settlement
}

/** Whether the latest finished submission was accepted. */
export function savedBy<R extends SaveResult>(track: Pick<SaveTrack<R>, 'settlement'>): boolean {
  return track.settlement?.result?.ok === true
}

/** The API's refusal of a submission made since the panel opened, verbatim. */
export function refusalIn<R extends SaveResult>(
  track: Pick<SaveTrack<R>, 'settlement'>,
): string | null {
  const result = track.settlement?.result
  return result?.ok === false ? (result.error ?? null) : null
}
