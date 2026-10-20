import { describe, expect, it } from 'vitest'
import {
  refusalIn,
  savedBy,
  settled,
  startSaveTrack,
  trackSave,
  type FetcherState,
  type SaveResult,
  type SaveTrack,
} from './saveSettled'

/**
 * A slide-over keeps its element — and its fetcher — while it is closed, and a
 * fetcher keeps its last answer until the next submission. So "the fetcher is
 * idle and its answer is ok" stays true for as long as the page is open, and a
 * panel that closed itself on that condition closed again every time it was
 * reopened: on /admin/meetings, Edit after a Schedule opened the panel and shut
 * it in the same tick, toasting "Meeting scheduled." a second time.
 *
 * The rule here is the replacement: a save is reported on the render it
 * FINISHES on, once, and what the panel shows as a refusal is only an answer
 * that arrived since it last opened.
 */

const OK: SaveResult = { ok: true }
const REFUSED: SaveResult = { ok: false, error: 'The meeting has already started.' }

type Render = { state: FetcherState; open?: boolean; data?: SaveResult }

/** Feed renders through the tracker, as consecutive renders would. */
function after(renders: Render[], from = startSaveTrack<SaveResult>('idle', true)) {
  return renders.reduce<SaveTrack<SaveResult>>(
    (track, { state, open = true, data }) => trackSave(track, { state, open, data }),
    from,
  )
}

/** One submission, start to finish: posted, revalidating, settled with `data`. */
function submission(data: SaveResult, open = true): Render[] {
  return [
    { state: 'submitting', open },
    { state: 'loading', open, data },
    { state: 'idle', open, data },
  ]
}

describe('settled', () => {
  it('is the render a submission finishes on, revalidated or not', () => {
    expect(settled('loading', 'idle')).toBe(true)
    expect(settled('submitting', 'idle')).toBe(true)
  })

  it('is not a fetcher that was already idle — that answer was reported before', () => {
    expect(settled('idle', 'idle')).toBe(false)
  })

  it('is not a submission still in flight', () => {
    expect(settled('idle', 'submitting')).toBe(false)
    expect(settled('submitting', 'loading')).toBe(false)
  })
})

describe('trackSave', () => {
  describe('a successful save', () => {
    it('is reported on the render it finishes', () => {
      expect(savedBy(after(submission(OK)))).toBe(true)
    })

    it('is not reported while it is still being revalidated', () => {
      // The answer is in, but the list behind the panel is not yet re-read:
      // closing now would show the old row for a moment.
      expect(savedBy(after(submission(OK).slice(0, 2)))).toBe(false)
    })

    it('is the same event on every later render that changes nothing', () => {
      const done = after(submission(OK))
      const rendered = trackSave(done, { state: 'idle', open: true, data: OK })
      expect(rendered).toBe(done)
    })

    it('is not reported again when the panel closes and is opened again', () => {
      // The meetings bug: Schedule, then Edit. The fetcher still holds the
      // schedule's `ok`, and the reopened panel must not read it as news.
      const reopened = after(
        [
          { state: 'idle', open: false, data: OK },
          { state: 'idle', open: true, data: OK },
        ],
        after(submission(OK)),
      )
      expect(savedBy(reopened)).toBe(false)
      expect(reopened.settlement).toBeNull()
    })

    it('is reported again for the next save, even one answered identically', () => {
      const first = after(submission(OK))
      const second = after(submission({ ok: true }), first)
      expect(savedBy(second)).toBe(true)
      // A new event, not the old one still standing: two identical answers in
      // a row must still close the panel twice.
      expect(second.settlement).not.toBe(first.settlement)
    })

    it('is reported for a submission made after a reopen', () => {
      const reopened = after(
        [
          { state: 'idle', open: false, data: OK },
          { state: 'idle', open: true, data: OK },
        ],
        after(submission(OK)),
      )
      expect(savedBy(after(submission(OK), reopened))).toBe(true)
    })

    it('is not reported when it finishes after the panel was closed', () => {
      // Closed mid-save (Escape, the overlay): there is no panel left to close
      // and nothing on screen the toast would explain.
      const closedMidSave = after([
        { state: 'submitting', open: true },
        { state: 'loading', open: false, data: OK },
        { state: 'idle', open: false, data: OK },
      ])
      expect(savedBy(closedMidSave)).toBe(false)
    })

    it('is never the answer a fetcher already held when the panel mounted', () => {
      // A keyed fetcher outlives the component that used it. What it holds at
      // mount was some earlier panel's news.
      const mounted = startSaveTrack<SaveResult>('idle', true)
      expect(savedBy(trackSave(mounted, { state: 'idle', open: true, data: OK }))).toBe(false)
    })
  })

  describe('a refusal', () => {
    it('is shown while the panel that sent it stays open', () => {
      expect(refusalIn(after(submission(REFUSED)))).toBe('The meeting has already started.')
    })

    it('is not a save', () => {
      expect(savedBy(after(submission(REFUSED)))).toBe(false)
    })

    it('stays up while the corrected form is being sent again', () => {
      const retrying = after([{ state: 'submitting', open: true }], after(submission(REFUSED)))
      expect(refusalIn(retrying)).toBe('The meeting has already started.')
    })

    it('gives way to the save that follows it', () => {
      const fixed = after(submission(OK), after(submission(REFUSED)))
      expect(refusalIn(fixed)).toBeNull()
      expect(savedBy(fixed)).toBe(true)
    })

    it('stays on screen while the panel slides shut', () => {
      const closing = after([{ state: 'idle', open: false, data: REFUSED }], after(submission(REFUSED)))
      expect(refusalIn(closing)).toBe('The meeting has already started.')
    })

    it('is gone when the panel is opened again', () => {
      // Possibly on another meeting altogether, which was never refused.
      const reopened = after(
        [
          { state: 'idle', open: false, data: REFUSED },
          { state: 'idle', open: true, data: REFUSED },
        ],
        after(submission(REFUSED)),
      )
      expect(refusalIn(reopened)).toBeNull()
    })

    it('is null when the API gave no sentence', () => {
      expect(refusalIn(after(submission({ ok: false })))).toBeNull()
    })
  })

  describe('openings', () => {
    it('counts each time the panel opens, so its form can be rebuilt per opening', () => {
      const closed = startSaveTrack<SaveResult>('idle', false)
      const once = after([{ state: 'idle', open: true }], closed)
      const twice = after(
        [
          { state: 'idle', open: false },
          { state: 'idle', open: true },
        ],
        once,
      )
      expect(once.opening).not.toBe(closed.opening)
      expect(twice.opening).not.toBe(once.opening)
    })

    it('holds still while the panel stays open, saves included', () => {
      const open = after([{ state: 'idle', open: true }], startSaveTrack('idle', false))
      expect(after(submission(REFUSED), open).opening).toBe(open.opening)
    })

    it('holds still when the panel closes', () => {
      // The form sliding out should keep what it shows, not rebuild empty.
      const open = after([{ state: 'idle', open: true }], startSaveTrack('idle', false))
      expect(after([{ state: 'idle', open: false }], open).opening).toBe(open.opening)
    })
  })

  it('reads the same render the same way twice', () => {
    // StrictMode renders every component twice; the second pass must not
    // invent a second event, or lose the first.
    const posted = after([{ state: 'loading', open: true, data: OK }])
    const seen = { state: 'idle', open: true, data: OK } as const
    const once = trackSave(posted, seen)
    expect(trackSave(once, seen)).toBe(once)
    expect(savedBy(trackSave(posted, seen))).toBe(savedBy(once))
  })
})
