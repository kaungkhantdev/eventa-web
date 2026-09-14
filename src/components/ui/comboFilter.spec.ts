import { describe, expect, it } from 'vitest'
import { filterOptions, type ComboOption } from './comboFilter'

const ROLES: ComboOption[] = [
  { value: '1', label: 'Admin' },
  { value: '2', label: 'Organizer' },
  { value: '3', label: 'Front desk staff' },
]

describe('filterOptions', () => {
  it('offers everything, in the order given, until something is typed', () => {
    expect(filterOptions(ROLES, '')).toEqual(ROLES)
  })

  it('treats a term of only spaces as nothing typed', () => {
    expect(filterOptions(ROLES, '   ')).toEqual(ROLES)
  })

  it('ignores case, so a hurried lower-case term still finds the role', () => {
    expect(filterOptions(ROLES, 'admin')).toEqual([ROLES[0]])
  })

  it('matches part of a label, not only its start', () => {
    expect(filterOptions(ROLES, 'desk')).toEqual([ROLES[2]])
  })

  /**
   * Somebody typing what they remember rarely types it in the stored order.
   * Requiring every word — in any order — is what makes "staff desk" work,
   * where a plain substring match would come back empty.
   */
  it('requires every word, in any order', () => {
    expect(filterOptions(ROLES, 'staff desk')).toEqual([ROLES[2]])
    expect(filterOptions(ROLES, 'desk admin')).toEqual([])
  })

  it('searches the keywords too, so a date or code finds its row', () => {
    const events: ComboOption[] = [
      { value: 'a', label: 'Bangkok Jazz Night', keywords: 'Jul 8, 2026' },
      { value: 'b', label: 'Chiang Mai Marathon', keywords: 'Sep 2, 2026' },
    ]
    expect(filterOptions(events, '2026')).toEqual(events)
    expect(filterOptions(events, 'sep')).toEqual([events[1]])
  })

  it('comes back empty when nothing matches', () => {
    expect(filterOptions(ROLES, 'treasurer')).toEqual([])
  })
})
