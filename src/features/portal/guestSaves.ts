import { ApiError, NetworkError } from '@/lib/api'
import { discoverApi } from './discover.api'
import { savedEvents, type SavedEvents } from './savedEvents'

/**
 * Hand a guest's hearts to the account they have just signed in to
 * (US-DISC-03, US-DISC-08).
 *
 * Run once a sign-in has completed, before landing anywhere, so the first page
 * an attendee sees already shows those events as saved. The API's unique pair
 * on `saved_events` is what keeps a replayed list free of duplicates, so this
 * only has to send it.
 *
 * Best-effort by design: the person is already signed in, and a shortlist that
 * could not be handed over must not turn that into a failure. The local list
 * is cleared only once the account has it, so the next sign-in tries again.
 * A programming error is not absorbed — "try again later" must not become the
 * answer to a bug.
 */
export async function adoptGuestSaves(
  saved: SavedEvents = savedEvents,
  merge: (eventIds: string[]) => Promise<unknown> = discoverApi.merge,
): Promise<void> {
  const ids = saved.ids()
  if (ids.length === 0) return
  try {
    await merge(ids)
    saved.clear()
  } catch (cause) {
    if (!(cause instanceof ApiError) && !(cause instanceof NetworkError)) throw cause
  }
}
