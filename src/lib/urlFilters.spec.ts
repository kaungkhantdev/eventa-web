import { describe, expect, it } from 'vitest'
import {
  clearedParams,
  emptyListReason,
  enumParam,
  hasActiveFilters,
  intParam,
  nextParams,
} from './urlFilters'

const params = (init: string) => new URLSearchParams(init)

describe('changing a filter in the URL', () => {
  it('sets the value it was given', () => {
    expect(nextParams(params(''), { q: 'yoga' }).get('q')).toBe('yoga')
  })

  it('removes a parameter set back to empty, rather than sending a blank filter', () => {
    // `?q=` would ask the API to match the empty string.
    expect(nextParams(params('q=yoga'), { q: '' }).has('q')).toBe(false)
    expect(nextParams(params('type=Workshop'), { type: null }).has('type')).toBe(false)
  })

  it('returns to the first page when a filter changes', () => {
    // Page 4 of the old result set is not page 4 of the new one — leaving the
    // number in place lands the organizer on an empty table.
    expect(nextParams(params('page=4'), { q: 'yoga' }).has('page')).toBe(false)
  })

  it('keeps the page when the page itself is what changed', () => {
    expect(nextParams(params('q=yoga&page=1'), { page: 3 }).get('page')).toBe('3')
    expect(nextParams(params('q=yoga&page=1'), { page: 3 }).get('q')).toBe('yoga')
  })

  it('leaves the parameters it was not asked about alone', () => {
    const next = nextParams(params('bucket=completed&sort=name'), { q: 'gala' })
    expect(next.get('bucket')).toBe('completed')
    expect(next.get('sort')).toBe('name')
  })

  it('does not mutate the parameters it was handed', () => {
    const current = params('q=yoga')
    nextParams(current, { q: 'gala' })
    expect(current.get('q')).toBe('yoga')
  })
})

describe('reading a filter back out', () => {
  it('reads a positive integer', () => {
    expect(intParam(params('page=3'), 'page', 1)).toBe(3)
  })

  it('falls back for a missing, zero, negative or non-numeric value', () => {
    // These arrive from whatever someone typed in the address bar; the API
    // would reject them, so they never get that far.
    expect(intParam(params(''), 'page', 1)).toBe(1)
    expect(intParam(params('page=0'), 'page', 1)).toBe(1)
    expect(intParam(params('page=-2'), 'page', 1)).toBe(1)
    expect(intParam(params('page=abc'), 'page', 1)).toBe(1)
    expect(intParam(params('page=1.5'), 'page', 1)).toBe(1)
  })

  it('accepts only a value the API knows', () => {
    const buckets = ['active', 'completed'] as const
    expect(enumParam(params('bucket=completed'), 'bucket', buckets, 'active')).toBe('completed')
    expect(enumParam(params('bucket=nonsense'), 'bucket', buckets, 'active')).toBe('active')
    expect(enumParam(params(''), 'bucket', buckets, 'active')).toBe('active')
  })
})

/**
 * This decides which of two empty states a list page shows, so a wrong answer
 * is a wrong instruction: telling an organizer with 400 attendees to "create
 * your first event" because a search matched nothing, or offering to clear
 * filters that were never set.
 *
 * It reads the URL rather than a total from the API, because the URL is the
 * one thing that provably says whether the organizer narrowed anything.
 */
describe('deciding whether a list is filtered or genuinely empty', () => {
  it('is unfiltered for a bare URL', () => {
    expect(hasActiveFilters(params(''))).toBe(false)
  })

  it('is filtered once any filter is set', () => {
    expect(hasActiveFilters(params('q=yoga'))).toBe(true)
    expect(hasActiveFilters(params('tag=VIP'))).toBe(true)
    expect(hasActiveFilters(params('status=draft&type=Workshop'))).toBe(true)
  })

  it('ignores page size — how many rows fit is not a filter', () => {
    // The kit makes the same call: clearing filters leaves the paginator alone.
    expect(hasActiveFilters(params('limit=50'))).toBe(false)
  })

  it('ignores the page number, which hides no rows', () => {
    // Paging past the end empties a list, but it is not *narrowing* — it is
    // its own situation, and `emptyListReason` is what tells them apart.
    expect(hasActiveFilters(params('page=1'))).toBe(false)
    expect(hasActiveFilters(params('page=4'))).toBe(false)
  })

  it('ignores the sort, which reorders rather than hides', () => {
    // Every `sort` in this codebase is an ordering fed to `enumParam` and then
    // to the API's ORDER BY — none of them removes a row. Sorting an empty
    // list is not a reason to blame filters for it being empty.
    expect(hasActiveFilters(params('sort=name'))).toBe(false)
  })

  it('ignores a parameter left empty, which filters nothing', () => {
    expect(hasActiveFilters(params('q='))).toBe(false)
  })

  it('ignores a search of nothing but whitespace', () => {
    // The API trims it away, so the rows come back unfiltered; offering to
    // "clear filters" for a stray space would explain an empty page wrongly.
    expect(hasActiveFilters(params('q=%20%20'))).toBe(false)
  })

  it('ignores a value that is the page default rather than a choice', () => {
    // Pages write `segment=all` when the default is re-picked; that narrows
    // nothing, so it must not be mistaken for a filter.
    const defaults = { segment: 'all' }
    expect(hasActiveFilters(params('segment=all'), { defaults })).toBe(false)
    expect(hasActiveFilters(params('segment=vip'), { defaults })).toBe(true)
  })

  it('ignores parameters that are not filters at all', () => {
    // A page can carry state that does not narrow the list — an open panel, a
    // selected row, the tab a detail page is on.
    expect(hasActiveFilters(params('tab=tickets'), { ignore: ['tab'] })).toBe(false)
    expect(hasActiveFilters(params('tab=tickets&q=yoga'), { ignore: ['tab'] })).toBe(true)
  })
})

/**
 * An empty list has *three* explanations, not two.
 *
 * The third one only showed up under review: a page past the end of a list is
 * empty without anything being filtered and without the workspace being new —
 * delete the last row on page 3 and there you are. Calling that "no results"
 * blames filters the organizer never set and offers a button that clears
 * nothing; calling it "first run" tells someone with 200 rows to create their
 * first one. It needs its own answer: go back to the beginning.
 */
describe('why a list came back empty', () => {
  it('is a first run when nothing narrows it and it is the first page', () => {
    expect(emptyListReason(params(''))).toBe('first-run')
    expect(emptyListReason(params('page=1&limit=50&sort=name'))).toBe('first-run')
  })

  it('is no results when a filter is hiding what exists', () => {
    expect(emptyListReason(params('q=yoga'))).toBe('no-results')
    expect(emptyListReason(params('status=draft'))).toBe('no-results')
  })

  it('is past the end when the page number ran off the list', () => {
    expect(emptyListReason(params('page=4'))).toBe('past-end')
  })

  it('is past the end even when filters are also set', () => {
    // Both explanations are true, but only one of them is actionable in the
    // right order: the rows may well be there on page 1.
    expect(emptyListReason(params('q=yoga&page=4'))).toBe('past-end')
  })

  it('is not past the end for a junk page number the loader ignored', () => {
    // `intParam` falls back to page 1 for these, so the list really is the
    // first page and blaming the page number would explain nothing.
    expect(emptyListReason(params('page=0'))).toBe('first-run')
    expect(emptyListReason(params('page=abc'))).toBe('first-run')
    expect(emptyListReason(params('page=-2'))).toBe('first-run')
  })

  it('is never past the end when the total says there is nothing to be past', () => {
    // Most loaders here redirect an out-of-range page back into range whenever
    // a row matches, so `page > 1` with no rows means the total is 0 — the
    // list is empty, not further back. Telling the organizer "they are still
    // there, start from the beginning" would be the one false explanation.
    expect(emptyListReason(params('page=2'), { total: 0 })).toBe('first-run')
    expect(emptyListReason(params('q=zzz&page=2'), { total: 0 })).toBe('no-results')
  })

  it('is past the end when a total proves rows exist elsewhere', () => {
    expect(emptyListReason(params('page=9'), { total: 40 })).toBe('past-end')
    expect(emptyListReason(params('q=yoga&page=9'), { total: 40 })).toBe('past-end')
  })

  it('respects the page defaults and ignores when deciding', () => {
    expect(emptyListReason(params('segment=all'), { defaults: { segment: 'all' } })).toBe(
      'first-run',
    )
    expect(emptyListReason(params('tab=tickets'), { ignore: ['tab'] })).toBe('first-run')
  })
})

describe('clearing the filters', () => {
  it('drops every filter and returns to the first page', () => {
    const next = clearedParams(params('q=yoga&tag=VIP&page=4'))
    expect([...next.keys()]).toEqual([])
  })

  it('keeps the page size, which the organizer chose separately', () => {
    expect(clearedParams(params('q=yoga&limit=50')).get('limit')).toBe('50')
  })

  it('keeps page state that is not a filter', () => {
    const next = clearedParams(params('tab=tickets&q=yoga'), { ignore: ['tab'] })
    expect(next.get('tab')).toBe('tickets')
    expect(next.has('q')).toBe(false)
  })

  it('leaves nothing behind that would still count as filtered', () => {
    // The button has to actually undo what the empty state complained about.
    const next = clearedParams(params('q=yoga&status=draft&page=3&limit=50'))
    expect(hasActiveFilters(next)).toBe(false)
  })
})
