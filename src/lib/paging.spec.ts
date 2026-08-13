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

  it('reports the API’s total, not the number of rows on this page', () => {
    // The rows are one page; the count the organizer reads is the whole match.
    expect(pageWindow(meta({ page: 2 })).total).toBe(48)
  })
})
