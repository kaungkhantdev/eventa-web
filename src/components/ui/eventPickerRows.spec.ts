import { describe, expect, it } from 'vitest'
import { eventRows, eventValue } from './eventPickerRows'

/**
 * The picker feeds two different kinds of caller: the pages still on demo data,
 * which are keyed by event NAME, and the API-backed filters, which are keyed by
 * id and store the empty string for "no event chosen". Getting the row's value
 * wrong in either direction silently filters a table by nothing.
 */
describe('eventValue', () => {
  it('reports the id when the list has one', () => {
    expect(eventValue({ id: 'evt-1', name: 'Tech Summit 2026' })).toBe('evt-1')
  })

  it('falls back to the name, which is how the demo catalog is keyed', () => {
    expect(eventValue({ name: 'Tech Summit 2026' })).toBe('Tech Summit 2026')
  })
})

describe('eventRows', () => {
  const events = [
    { id: 'evt-1', name: 'Tech Summit 2026', date: 'Jul 18, 2026' },
    { id: 'evt-2', name: 'Bangkok Jazz Night', date: 'Jul 12, 2026' },
  ]

  it('puts the catch-all first, above the events', () => {
    const rows = eventRows(events, 'All events')
    expect(rows.map((row) => row.label)).toEqual([
      'All events',
      'Tech Summit 2026',
      'Bangkok Jazz Night',
    ])
  })

  it('lets the catch-all carry a value that is not its label', () => {
    // What a URL-backed filter needs: the row reads "All events", but choosing
    // it stores '' so `?eventId=` drops out of the address.
    const [all] = eventRows(events, 'All events', '')
    expect(all).toEqual({ value: '', label: 'All events' })
  })

  it('defaults the catch-all value to its label, for the name-keyed pages', () => {
    expect(eventRows(events, 'All events')[0]).toEqual({
      value: 'All events',
      label: 'All events',
    })
  })

  it('omits the catch-all entirely when the pick is required', () => {
    const rows = eventRows(events, false)
    expect(rows).toHaveLength(2)
    expect(rows[0]!.label).toBe('Tech Summit 2026')
  })

  it('makes the date searchable without putting it in the label', () => {
    const [, first] = eventRows(events, 'All events')
    expect(first!.label).toBe('Tech Summit 2026')
    expect(first!.keywords).toBe('Jul 18, 2026')
  })

  it('keeps the order it was given, which carries meaning the search box lacks', () => {
    const rows = eventRows(events, false)
    expect(rows.map((row) => row.value)).toEqual(['evt-1', 'evt-2'])
  })
})
