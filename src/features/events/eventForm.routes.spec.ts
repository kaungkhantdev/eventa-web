import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api'
import { toEventFormValues } from './eventForm.mapper'
import { categoryChoices, pageChangesOf, savedToastOf, templateOf } from './eventForm.routes'
import type { CategoryWire } from './types'

/**
 * Which design the wizard opens on.
 *
 * It used to read `?template=` and nothing else, so an event saved as Spotlight
 * opened showing Classic selected — and previewing it rendered the wrong
 * design. The event's own stored choice has to be the default; the query
 * parameter is the landing gallery's "Use template", an explicit override made
 * a moment ago, so that still wins.
 */
describe('templateOf', () => {
  const query = (search: string) => new URLSearchParams(search)

  it('uses the design the event is already saved with', () => {
    expect(templateOf(query(''), 'minimal')).toBe('minimal')
  })

  it('lets an explicit ?template= override the stored one', () => {
    expect(templateOf(query('template=noir'), 'minimal')).toBe('noir')
  })

  it('falls back to the default for an event that has never chosen one', () => {
    expect(templateOf(query(''), null)).toBe('aurora')
    expect(templateOf(query(''), undefined)).toBe('aurora')
  })

  it('ignores a template id it does not know, on either side', () => {
    expect(templateOf(query('template=gothic'), 'minimal')).toBe('minimal')
    expect(templateOf(query(''), 'gothic')).toBe('aurora')
  })
})

/**
 * The category picker's options (US-EVT-03). Listing categories needs the
 * settings permission, which an organizer who may create events need not have.
 * For them the wizard offers no picker rather than failing to open at all.
 */
describe('categoryChoices', () => {
  const wire = (id: number, name: string): CategoryWire => ({
    id,
    name,
    description: null,
    icon: 'hgi-star',
    color: 'brand',
    eventCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    version: 1,
  })

  it('offers each category by name', async () => {
    const choices = await categoryChoices(async () => [wire(1, 'Birthday'), wire(2, 'Wedding')])
    expect(choices).toEqual([
      { id: 1, name: 'Birthday' },
      { id: 2, name: 'Wedding' },
    ])
  })

  it('offers no picker to someone who may not list categories', async () => {
    const forbidden = async () => {
      throw new ApiError(403, { message: "You don't have access to that." })
    }
    expect(await categoryChoices(forbidden)).toBeNull()
  })

  it('still fails on anything else, rather than hiding it', async () => {
    const broken = async () => {
      throw new ApiError(500, {})
    }
    await expect(categoryChoices(broken)).rejects.toBeInstanceOf(ApiError)
  })
})

/**
 * The page's public address and accent colour (US-PAGE-10), saved through
 * `PATCH /events/:id/page`. Only what the organizer changed is sent: an
 * unchanged address would be re-checked for nothing, and a colour never set
 * would be written as the default.
 */
describe('pageChangesOf', () => {
  const saved = {
    ...toEventFormValues(null, [], []),
    id: 'evt-1',
    slug: 'tech-summit-2026',
    accentColor: '#00C066',
  }
  const typed = (fields: Record<string, string>) => {
    const data = new FormData()
    for (const [key, value] of Object.entries(fields)) data.append(key, value)
    return data
  }

  it('sends a new address', () => {
    expect(
      pageChangesOf(saved, typed({ slug: ' bkk-summit ', accentColor: '#00C066' })),
    ).toEqual({ slug: 'bkk-summit' })
  })

  it('sends a new colour', () => {
    expect(
      pageChangesOf(saved, typed({ slug: 'tech-summit-2026', accentColor: '#2563EB' })),
    ).toEqual({ accentColor: '#2563EB' })
  })

  it('sends nothing when neither changed, or neither was on the form', () => {
    expect(
      pageChangesOf(saved, typed({ slug: 'tech-summit-2026', accentColor: '#00C066' })),
    ).toBeNull()
    expect(pageChangesOf(saved, typed({}))).toBeNull()
  })

  // An emptied box is not a request for an address, or a colour, of nothing.
  it('keeps the address or the colour when its box is emptied', () => {
    expect(pageChangesOf(saved, typed({ slug: '  ', accentColor: '#00C066' }))).toBeNull()
    expect(pageChangesOf(saved, typed({ slug: 'tech-summit-2026', accentColor: '' }))).toBeNull()
  })
})

/**
 * What a save announces once it lands. The header's Save asks for a toast; a
 * Next saves as a side effect of moving on, so it says nothing. When Seating
 * left a published map's new seats to Assign seats (US-EVT-05), "Changes saved"
 * would claim the seat map was saved too — the toast says what is left to do.
 */
describe('savedToastOf', () => {
  const sent = (fields: Record<string, string>) => {
    const data = new FormData()
    for (const [key, value] of Object.entries(fields)) data.append(key, value)
    return data
  }

  it('confirms the header’s save', () => {
    expect(savedToastOf(sent({ notify: 'on' }))).toBe('Changes saved.')
  })

  it('says the seat map still waits on Assign seats when Seating left it there', () => {
    expect(savedToastOf(sent({ notify: 'on', seatMapDeferred: 'on' }))).toBe(
      'Saved. Give the new seats a ticket type in Assign seats to save the seat map.',
    )
  })

  it('says nothing for a Next, which saves silently', () => {
    expect(savedToastOf(sent({}))).toBeNull()
    expect(savedToastOf(sent({ seatMapDeferred: 'on' }))).toBeNull()
  })
})
