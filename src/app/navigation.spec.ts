import { describe, expect, it } from 'vitest'
import { MODULES, visibleGroups, type NavGroup } from './navigation'

/*
 * Which sub-nav links the console OFFERS a member (US-RPT-12 AC1).
 *
 * Tidying, not access control — the API refuses every one of these reports
 * with a 403 on its own. But the criterion asks for a finance report to be
 * hidden or disabled for a Staff member with registration access only, and a
 * link that leads only to a refusal is neither.
 */

const reports = MODULES.find((module) => module.id === 'reports')!.groups!
const pagesOf = (groups: NavGroup[]) => groups.flatMap((group) => group.items.map((it) => it.page))

const holding =
  (...keys: string[]) =>
  (permission: string) =>
    keys.includes(permission)

describe('the Insights sub-nav', () => {
  it('hides the five finance reports from a member without finance access', () => {
    const staff = visibleGroups(reports, holding('regView'))

    expect(pagesOf(staff)).toEqual(['reports', 'reports-registrations', 'reports-attendance'])
  })

  it('drops a group left with nothing in it, rather than showing an empty heading', () => {
    const staff = visibleGroups(reports, holding('regView'))

    expect(staff.map((group) => group.label)).toEqual(['Summary', 'Attendees'])
  })

  it('offers every report to a member with finance access', () => {
    const finance = visibleGroups(reports, holding('regView', 'finView'))

    expect(pagesOf(finance)).toEqual([
      'reports',
      'reports-income',
      'reports-transactions',
      'reports-payouts',
      'reports-registrations',
      'reports-attendance',
      'reports-discounts',
      'reports-events',
    ])
  })
})

describe('every other module', () => {
  it('is left exactly as it is, whatever the member holds', () => {
    for (const module of MODULES.filter((m) => m.id !== 'reports')) {
      expect(visibleGroups(module.groups ?? [], holding())).toEqual(module.groups ?? [])
    }
  })
})
