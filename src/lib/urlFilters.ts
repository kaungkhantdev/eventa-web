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
