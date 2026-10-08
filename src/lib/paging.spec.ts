import { describe, expect, it } from 'vitest'
import { pageWindow } from './paging'

const meta = (over: Partial<Parameters<typeof pageWindow>[0]> = {}) => ({
  total: 48,
  page: 1,
  limit: 10,
  totalPages: 5,
  ...over,
})

describe('the "showing X–Y of Z" window', () => {
  it('counts from one on the first page', () => {
    const window = pageWindow(meta())
    expect([window.from, window.to]).toEqual([1, 10])
  })

  it('offsets by the pages already behind it', () => {
    const window = pageWindow(meta({ page: 3 }))
    expect([window.from, window.to]).toEqual([21, 30])
  })

  it('stops at the total on a short last page', () => {
    const window = pageWindow(meta({ page: 5 }))
    expect([window.from, window.to]).toEqual([41, 48])
  })

  it('shows nothing rather than "1–0" when the query matched nothing', () => {
    const window = pageWindow(meta({ total: 0, totalPages: 0 }))
    expect([window.from, window.to, window.total]).toEqual([0, 0, 0])
  })

  it('always has at least one page, so Prev/Next stay coherent when empty', () => {
    expect(pageWindow(meta({ total: 0, totalPages: 0 })).pageCount).toBe(1)
  })

  it('never reads backwards when the page is past the end', () => {
    // Delete the only row on page 2 and the loader revalidates against `?page=2`
    // of a set that now fits on one page. `11–10 of 10` is not a range.
    const window = pageWindow(meta({ total: 10, page: 2, totalPages: 1 }))
    expect(window.from).toBeLessThanOrEqual(window.to)
    expect(window.from).toBe(0)
    expect(window.to).toBe(0)
  })

  it('still reports the real total from a page past the end, so Prev is offered', () => {
    const window = pageWindow(meta({ total: 10, page: 1000, totalPages: 1 }))
    expect(window.total).toBe(10)
    expect(window.page).toBeGreaterThan(window.pageCount)
  })

  it('reports the API’s total, not the number of rows on this page', () => {
    // The rows are one page; the count the organizer reads is the whole match.
    expect(pageWindow(meta({ page: 2 })).total).toBe(48)
  })
})
