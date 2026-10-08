/**
 * Recover from a deploy that landed while a tab was open.
 *
 * Every page is a separate chunk, so a tab that was loaded before a release
 * still holds the old `index` and will ask for a hashed filename the server no
 * longer has. The import rejects, and — unlike a loader failure — React Router
 * does NOT route that to the route's `errorElement`: it renders nothing at all,
 * and the person is left looking at a blank screen. Worse, its `lazy()` cache
 * keeps the rejected promise forever, so retrying in place can never work.
 *
 * The only cure is to load the document again, which fetches the new `index`
 * and the new filenames. Vite announces the failure on `vite:preloadError`
 * before throwing, which is the one place this can be caught.
 */

/** Remembers that we already tried, so a chunk that is genuinely gone cannot
 *  put the tab in a reload loop. */
const ATTEMPT_KEY = 'eventa.chunkReloadAt'

/** Long enough that a second failure is a new deploy, not the same one. */
const RETRY_AFTER_MS = 10_000

/**
 * Whether to load the document again.
 *
 * Pure, and the only rule here worth getting wrong: reloading on every failure
 * would spin a tab forever when a chunk is genuinely missing rather than merely
 * stale, and never reloading would leave a blank screen after every deploy.
 */
export function shouldReload(lastAttempt: number | null, now: number): boolean {
  return lastAttempt === null || now - lastAttempt >= RETRY_AFTER_MS
}

export function recoverFromStaleChunks(now: () => number = Date.now): void {
  window.addEventListener('vite:preloadError', (event) => {
    // Vite rethrows otherwise, and an uncaught rejection here helps nobody.
    event.preventDefault()
    const at = now()
    if (!shouldReload(lastAttempt(), at)) return
    write(ATTEMPT_KEY, String(at))
    window.location.reload()
  })
}

function lastAttempt(): number | null {
  const stored = Number(read(ATTEMPT_KEY))
  return Number.isFinite(stored) && stored > 0 ? stored : null
}

// Safari's private mode throws on storage access. Losing the guard is better
// than losing the recovery, so a failure here still lets the reload happen.
function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    /* Nothing to remember; the guard above simply won't fire. */
  }
}
