import { describe, expect, it } from 'vitest'
import {
  categoryInputOf,
  listQueryOf,
  monthOf,
  searchOf,
  sortCategories,
  viewOf,
} from './events.routes'
import type { CategoryCard } from './types'

const params = (init: string) => new URLSearchParams(init)

describe('the URL, read as a request to GET /events', () => {
  it('defaults to the active bucket, fullest first, page one', () => {
    expect(listQueryOf(params(''))).toMatchObject({
      page: 1,
      limit: 10,
      bucket: 'active',
      sort: 'registrations',
    })
  })

  it('passes the organizer’s choices through', () => {
    expect(listQueryOf(params('page=3&limit=20&bucket=completed&sort=name&q=gala'))).toMatchObject({
      page: 3,
      limit: 20,
      bucket: 'completed',
      sort: 'name',
      q: 'gala',
    })
  })

  it('omits an empty search rather than asking the API to match nothing', () => {
    expect(listQueryOf(params('q=')).q).toBeUndefined()
    expect(listQueryOf(params('q=%20%20')).q).toBeUndefined()
  })

  it('sends only an event type the API actually has', () => {
    expect(listQueryOf(params('type=Workshop')).type).toBe('Workshop')
    // The address bar is not a trusted input: forwarding this would 400 and
    // put an error page where the table should be.
    expect(listQueryOf(params('type=Hackathon')).type).toBeUndefined()
  })

  it('refuses a page size that is not one of the offered ones', () => {
    // `?limit=5000` would be rejected by the API's own maximum.
    expect(listQueryOf(params('limit=5000')).limit).toBe(10)
    expect(listQueryOf(params('limit=abc')).limit).toBe(10)
  })

  it('falls back for a sort or bucket it does not recognise', () => {
    expect(listQueryOf(params('sort=whatever')).sort).toBe('registrations')
    expect(listQueryOf(params('bucket=whatever')).bucket).toBe('active')
  })
})

describe('the search term the API is asked for', () => {
  it('trims what was typed', () => {
    expect(searchOf(params('q=%20gala%20'), 80)).toBe('gala')
  })

  it('drops a search that is only whitespace', () => {
    expect(searchOf(params('q=%20%20'), 80)).toBeUndefined()
  })

  it('truncates to the length the API accepts rather than being rejected', () => {
    // The API caps `q` (120 for events, 80 for categories) and 400s past it.
    // A loader that throws replaces the page with an error screen, so pasting a
    // URL into the search box must not be able to take the screen down.
    const pasted = 'x'.repeat(500)
    expect(searchOf(new URLSearchParams({ q: pasted }), 80)).toHaveLength(80)
    expect(searchOf(new URLSearchParams({ q: pasted }), 120)).toHaveLength(120)
  })
})

describe('what the category panel sends', () => {
  const form = (entries: Record<string, string>) => {
    const data = new FormData()
    for (const [key, value] of Object.entries(entries)) data.append(key, value)
    return data
  }

  it('trims the name and passes the icon and colour through', () => {
    const input = categoryInputOf(form({ name: '  Birthday ', icon: 'hgi-gift', color: 'pink' }))
    expect(input).toMatchObject({ name: 'Birthday', icon: 'hgi-gift', color: 'pink' })
  })

  it('sends null — not nothing — when the description is cleared', () => {
    // The API skips keys that are absent, so `undefined` is the one value that
    // cannot say "remove this". Sending it would report success and leave the
    // old description in place.
    expect(categoryInputOf(form({ name: 'Birthday', description: '' })).description).toBeNull()
    expect(categoryInputOf(form({ name: 'Birthday', description: '   ' })).description).toBeNull()
    expect(categoryInputOf(form({ name: 'Birthday' })).description).toBeNull()
  })

  it('keeps a description that was written', () => {
    expect(categoryInputOf(form({ name: 'Birthday', description: ' Parties. ' })).description).toBe(
      'Parties.',
    )
  })
})

describe('which view the URL asks for', () => {
  it('opens on the overview', () => {
    expect(viewOf(params(''))).toBe('overview')
  })

  it('honours the calendar tab, and ignores anything else', () => {
    expect(viewOf(params('view=calendar'))).toBe('calendar')
    expect(viewOf(params('view=nonsense'))).toBe('overview')
  })

  it('takes a well-formed month, and ignores one that is not', () => {
    expect(monthOf(params('month=2026-09'))).toBe('2026-09')
    expect(monthOf(params('month=2026-13'))).toMatch(/^\d{4}-\d{2}$/)
    expect(monthOf(params('month=sept'))).toMatch(/^\d{4}-\d{2}$/)
  })
})

const card = (name: string, eventCount: number): CategoryCard => ({
  id: eventCount,
  name,
  description: '',
  icon: 'hgi-star',
  color: 'brand',
  eventCount,
  version: 1,
})

describe('ordering the categories', () => {
  const cards = [card('Birthday', 12), card('Conference', 24), card('Wedding', 8)]

  it('leaves the API’s A–Z order alone', () => {
    // The server already ordered by name; re-sorting would only risk a
    // different collation than the one that produced it.
    expect(sortCategories(cards, 'name').map((c) => c.name)).toEqual([
      'Birthday',
      'Conference',
      'Wedding',
    ])
  })

  it('puts the busiest first', () => {
    expect(sortCategories(cards, 'count-desc').map((c) => c.eventCount)).toEqual([24, 12, 8])
  })

  it('puts the quietest first', () => {
    expect(sortCategories(cards, 'count-asc').map((c) => c.eventCount)).toEqual([8, 12, 24])
  })

  it('does not disturb the list it was given', () => {
    sortCategories(cards, 'count-desc')
    expect(cards.map((c) => c.eventCount)).toEqual([12, 24, 8])
  })
})
