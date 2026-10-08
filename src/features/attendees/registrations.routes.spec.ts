import { describe, expect, it } from 'vitest'
import { DEFAULT_PAGE_SIZE } from '@/lib/paging'
import { listQueryOf, statusOfTab, tabCountsOf, tabOf } from './registrations.routes'
import type { RegistrationCounts } from './registrations.types'

const url = (query: string) => new URLSearchParams(query)

const counts = (o: Partial<RegistrationCounts> = {}): RegistrationCounts => ({
  pending: 12,
  confirmed: 30,
  waitlisted: 4,
  cancelled: 2,
  rejected: 1,
  ...o,
})

describe('which tab the URL is asking for', () => {
  it('defaults to all', () => {
    expect(tabOf(url(''))).toBe('all')
  })

  it('reads a tab that exists', () => {
    expect(tabOf(url('tab=pending'))).toBe('pending')
  })

  it('falls back rather than forwarding a hand-typed tab', () => {
    expect(tabOf(url('tab=nonsense'))).toBe('all')
  })
})

describe('a tab, as a status the API understands', () => {
  it.each([
    ['pending', 'pending'],
    ['waitlist', 'waitlisted'],
    ['cancelled', 'cancelled'],
  ] as const)('sends %s as %s', (tab, status) => {
    expect(statusOfTab(tab)).toBe(status)
  })

  it('sends no status at all for All, so every bucket is counted', () => {
    expect(statusOfTab('all')).toBeUndefined()
  })
})

describe('the URL, as a request to GET /registrations', () => {
  it('asks for the first page at the default size when nothing was chosen', () => {
    expect(listQueryOf(url(''))).toEqual({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      status: undefined,
      eventId: undefined,
      search: undefined,
    })
  })

  it('forwards the page, size, tab, event and search that were chosen', () => {
    const query = listQueryOf(url('page=3&limit=20&tab=pending&eventId=e-9&q=anong'))
    expect(query).toEqual({
      page: 3,
      limit: 20,
      status: 'pending',
      eventId: 'e-9',
      search: 'anong',
    })
  })

  it('ignores a page size the control never offered', () => {
    // Straight from the address bar; the API caps at 100 and would answer 400.
    expect(listQueryOf(url('limit=9999')).limit).toBe(DEFAULT_PAGE_SIZE)
  })

  it('ignores a page number that is not one', () => {
    expect(listQueryOf(url('page=-2')).page).toBe(1)
  })

  it('truncates a search past what the DTO accepts, rather than being refused', () => {
    // `@MaxLength(120)` — over it the API answers 400, and a loader that throws
    // replaces the whole screen with an error page instead of a table.
    const query = listQueryOf(url(`q=${'x'.repeat(200)}`))
    expect(query.search).toHaveLength(120)
  })

  it('sends nothing for a search box holding only spaces', () => {
    expect(listQueryOf(url('q=%20%20')).search).toBeUndefined()
  })
})

describe('what each pill tab counts', () => {
  it('takes the three status tabs straight from the API', () => {
    const tabs = tabCountsOf(counts())
    expect(tabs.pending).toBe(12)
    expect(tabs.waitlist).toBe(4)
    expect(tabs.cancelled).toBe(2)
  })

  it('adds every status up for All, including the ones with no tab', () => {
    // Confirmed and rejected have no pill of their own but are still rows under
    // All; leaving them out would print a total smaller than the table below it.
    expect(tabCountsOf(counts()).all).toBe(49)
  })

  it('counts nothing as zero rather than leaving the pill blank', () => {
    const empty = counts({ pending: 0, confirmed: 0, waitlisted: 0, cancelled: 0, rejected: 0 })
    expect(tabCountsOf(empty)).toEqual({ all: 0, pending: 0, waitlist: 0, cancelled: 0 })
  })
})
