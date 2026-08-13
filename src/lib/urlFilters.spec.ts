import { describe, expect, it } from 'vitest'
import { enumParam, intParam, nextParams } from './urlFilters'

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
