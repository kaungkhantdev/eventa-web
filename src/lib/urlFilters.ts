/**
 * A list page keeps its filters in the URL, not in component state.
 *
 * The API pages and filters server-side, so the query string is the single
 * source of truth: the back button works, a filtered view can be linked to or
 * reloaded, and the row count can never disagree with the rows because both
 * came from the same request.
 */

/** The parameter every paged list uses, named once. */
export const PAGE_PARAM = 'page'

/** A patch to the query string. `null` and `''` remove the parameter. */
export type FilterPatch = Record<string, string | number | null | undefined>

/**
 * Apply a patch to the current query string.
 *
 * Changing any filter drops the page number: page 4 of the previous result set
 * is not page 4 of the new one, and asking the API for it would land the
 * organizer on an empty table.
 */
export function nextParams(current: URLSearchParams, patch: FilterPatch): URLSearchParams {
  const next = new URLSearchParams(current)
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === '') next.delete(key)
    else next.set(key, String(value))
  }
  if (!(PAGE_PARAM in patch)) next.delete(PAGE_PARAM)
  return next
}

/** Read a positive integer parameter, falling back when it is absent or junk. */
export function intParam(params: URLSearchParams, key: string, fallback: number): number {
  const parsed = Number(params.get(key))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/** Paging is not filtering: how many rows fit on a page narrows nothing. */
const PAGE_SIZE_PARAM = 'limit'

/**
 * Parameters that change what a list looks like without removing anything from
 * it. Sorting reorders — every `sort` here is an ordering handed to `enumParam`
 * and then to the API's ORDER BY, and none of them drops a row — so an empty
 * sorted list is not an empty *filtered* list.
 */
const NON_NARROWING = [PAGE_SIZE_PARAM, 'sort']

interface ActiveFilterOptions {
  /** Values a page writes for its own defaults, which narrow nothing. */
  defaults?: Record<string, string>
  /** Parameters that are page state rather than filters — an open tab, say. */
  ignore?: string[]
}

/**
 * Whether the organizer has narrowed this list.
 *
 * An empty table means one of two very different things, and this is what
 * tells them apart: nothing has been created yet, or a filter is hiding what
 * has. The page then either explains what will fill it, or offers the way
 * back — and getting it backwards gives a real instruction to the wrong
 * person, telling someone with a full directory to create their first event.
 *
 * It reads the URL rather than a total from the API because the URL is the one
 * thing that provably records a choice the organizer made. A total can be
 * scoped, cached or filtered server-side without saying so.
 */
export function hasActiveFilters(
  params: URLSearchParams,
  { defaults, ignore }: ActiveFilterOptions = {},
): boolean {
  const skip = new Set([PAGE_PARAM, ...NON_NARROWING, ...(ignore ?? [])])

  for (const [key, raw] of params) {
    if (skip.has(key)) continue
    const value = raw.trim()
    if (!value) continue
    if (defaults?.[key] === value) continue
    return true
  }
  return false
}

/** Why a list came back with no rows — see {@link emptyListReason}. */
export type ListEmptyReason = 'first-run' | 'no-results' | 'past-end'

interface EmptyReasonOptions extends ActiveFilterOptions {
  /**
   * The matching row count the API reported, when the page has one
   * (`window.total`). It is what proves rows exist somewhere other than here.
   *
   * Pass it whenever it is available. Most loaders in this app already redirect
   * an out-of-range page back into range while any row matches, so on those
   * pages an empty page 2 means the total is 0 — the list is empty, not
   * further back — and without the total this would say "they are still there"
   * about rows that do not exist.
   */
  total?: number
}

/**
 * Which of the three empty states a list should show.
 *
 * `past-end` wins over `no-results` when both apply. Both explanations are
 * true on `?q=yoga&page=9` of a 40-row result, but only one is useful in that
 * order: the matches are sitting further back, so send the organizer there
 * before blaming the search.
 */
export function emptyListReason(
  params: URLSearchParams,
  { total, ...filters }: EmptyReasonOptions = {},
): ListEmptyReason {
  // Anything the loader would reject falls back to page 1 (`intParam`), so the
  // list really is the first page and the number explains nothing.
  const pastEnd = intParam(params, PAGE_PARAM, 1) > 1 && total !== 0
  if (pastEnd) return 'past-end'
  return hasActiveFilters(params, filters) ? 'no-results' : 'first-run'
}

/**
 * The query string with every filter removed — what "Clear filters" navigates
 * to.
 *
 * Page size survives because it is not a filter, and neither is page state a
 * detail view carries. Everything else goes, including the page number: the
 * unfiltered list starts at the beginning.
 */
export function clearedParams(
  current: URLSearchParams,
  { ignore }: { ignore?: string[] } = {},
): URLSearchParams {
  const keep = new Set([PAGE_SIZE_PARAM, ...(ignore ?? [])])
  const next = new URLSearchParams()
  for (const [key, value] of current) {
    if (keep.has(key)) next.set(key, value)
  }
  return next
}

/** Read a parameter constrained to a known set — anything else is the default. */
export function enumParam<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = params.get(key)
  return allowed.includes(value as T) ? (value as T) : fallback
}
