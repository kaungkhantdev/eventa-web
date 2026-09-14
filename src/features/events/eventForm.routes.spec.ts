import { describe, expect, it } from 'vitest'
import { templateOf } from './eventForm.routes'

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
