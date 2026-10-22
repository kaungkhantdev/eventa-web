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

/*
 * US-MTG-08: Settings → Integrations is where an Admin connects Google
 * Calendar. Its two buttons need `setIntegrations`, so a member without it is
 * not offered the link — the page itself still answers anyone who opens it,
 * read-only, because the status is not a secret.
 */
const settings = MODULES.find((module) => module.id === 'settings')!.groups!

describe('the Settings sub-nav', () => {
  it('hides Integrations from a member without the integrations permission', () => {
    const staff = visibleGroups(settings, holding('regView', 'setSettings'))

    expect(pagesOf(staff)).not.toContain('settings-integrations')
  })

  it('offers Integrations to a member with it, right after Payments', () => {
    const admin = visibleGroups(settings, holding('setIntegrations'))
    const workspace = admin.find((group) => group.label === 'Workspace')!

    expect(workspace.items).toContainEqual({
      label: 'Integrations',
      page: 'settings-integrations',
      to: '/admin/settings-integrations',
      permission: 'setIntegrations',
    })
    expect(workspace.items.map((it) => it.page)).toEqual([
      'settings-organization',
      'settings-payments',
      'settings-integrations',
    ])
  })

  it('leaves every other Settings link where it was', () => {
    const staff = visibleGroups(settings, holding())

    expect(pagesOf(staff)).toEqual([
      'settings-profile',
      'settings-security',
      'settings-notifications',
      'settings-organization',
      'settings-payments',
      'users',
      'roles',
    ])
  })
})

describe('every other module', () => {
  it('is left exactly as it is, whatever the member holds', () => {
    const gated = new Set(['reports', 'settings'])
    for (const module of MODULES.filter((m) => !gated.has(m.id))) {
      expect(visibleGroups(module.groups ?? [], holding())).toEqual(module.groups ?? [])
    }
  })
})
