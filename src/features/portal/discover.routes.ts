import { panel, type Panel } from '@/app/panels'
import { queryOf, type ActionResult, type LoaderArgs } from '@/app/loaders'
import { ApiError, NetworkError, session } from '@/lib/api'
import { pageWindow, type PageWindow } from '@/lib/paging'
import { intParam } from '@/lib/urlFilters'
import { discoverApi } from './discover.api'
import { toDiscoverCard } from './discover.mapper'
import { savedEvents } from './savedEvents'
import type { DiscoverCard } from './discover.types'

/**
 * What's on (US-DISC-01/02/03).
 *
 * Deliberately not behind `attendeeData`: browsing and searching never require
 * an account, and a guard here would put a sign-in wall in front of the one
 * page meant to be shareable. A session is read only to decide *where* the
 * shortlist lives.
 */

/**
 * What the card says when a heart cannot be recorded. US-DISC-03 names the
 * message, so it is this rather than the API's or the network's own sentence;
 * the heart itself reverts, because it only ever showed the press.
 */
const SAVE_FAILED = "Couldn't save right now."
const UNSAVE_FAILED = "Couldn't remove it from saved right now."

/** A grid row is three cards wide, so the page comes in whole rows. */
export const DISCOVER_PAGE_SIZE = 12

export interface DiscoverData {
  cards: DiscoverCard[]
  window: PageWindow
  /** The strip. Degrades on its own — losing it must not cost the grid. */
  categories: Panel<string[]>
  /** Ids the visitor has saved, wherever they are kept. */
  saved: string[]
  /** Whether that shortlist is the account's, which decides how it is toggled. */
  isSignedIn: boolean
}

export function discoverQueryOf(params: URLSearchParams) {
  const q = params.get('q')?.trim()
  const category = params.get('category')?.trim()
  return {
    page: intParam(params, 'page', 1),
    limit: DISCOVER_PAGE_SIZE,
    // Absent rather than empty: `?q=` is not a search for the empty string.
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
  }
}

/** An attendee's shortlist lives on their account; anyone else's is local. */
async function savedIdsFor(isSignedIn: boolean): Promise<string[]> {
  if (!isSignedIn) return savedEvents.ids()
  const shortlist = await panel(everySavedId())
  return shortlist.ok ? shortlist.data : []
}

/**
 * Every id on the account's shortlist, not just its first page.
 *
 * A card's heart is filled by finding its id here, so a save that fell off the
 * first page read as never made: the API's default page is the twelve newest,
 * and an older save showed an empty heart on return or on another device.
 */
async function everySavedId(): Promise<string[]> {
  const ids: string[] = []
  for (let page = 1; ; page += 1) {
    const { items, meta } = await discoverApi.saved(page)
    ids.push(...items.map((row) => row.id))
    if (page >= meta.totalPages) return ids
  }
}

export const discoverRoute = {
  loader: async ({ request }: LoaderArgs): Promise<DiscoverData> => {
    const isSignedIn = session.persona() === 'attendee'
    const [feed, categories, saved] = await Promise.all([
      discoverApi.list(discoverQueryOf(queryOf(request))),
      panel(discoverApi.categories()),
      savedIdsFor(isSignedIn),
    ])
    return {
      cards: feed.items.map(toDiscoverCard),
      window: pageWindow(feed.meta),
      categories,
      saved,
      isSignedIn,
    }
  },

  /**
   * Save or unsave one event.
   *
   * The form states the intended result rather than "toggle", so pressing the
   * heart twice quickly cannot land on the opposite of what was asked. A
   * refusal comes back as a message beside the card; React Router revalidates
   * the loader on success, so the shortlist is re-read rather than assumed.
   */
  action: async ({ request }: LoaderArgs): Promise<ActionResult> => {
    const form = await request.formData()
    const eventId = String(form.get('eventId') ?? '')
    const save = form.get('save') === 'true'
    if (!eventId) return { ok: false, error: 'That event could not be identified.' }

    if (session.persona() !== 'attendee') {
      if (save) savedEvents.add(eventId)
      else savedEvents.remove(eventId)
      return { ok: true }
    }
    try {
      await (save ? discoverApi.save(eventId) : discoverApi.unsave(eventId))
      return { ok: true }
    } catch (cause) {
      if (cause instanceof ApiError || cause instanceof NetworkError) {
        return { ok: false, error: save ? SAVE_FAILED : UNSAVE_FAILED }
      }
      throw cause
    }
  },
}
