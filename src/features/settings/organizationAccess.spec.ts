import { describe, expect, it } from 'vitest'
import type { Me } from '@/features/auth/types'
import { canEditOrganization } from './organizationAccess'

const me = (permissions: string[]): Me => ({
  id: 'u-1',
  name: 'Anong Pattana',
  email: 'anong@demo.test',
  persona: 'admin',
  status: 'Active',
  twoFactorEnabled: false,
  organization: {
    id: 1,
    name: 'Demo Workspace',
    slug: 'demo',
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    locale: 'en',
  },
  permissions,
})

/**
 * The standard roles' grants, copied from `DEFAULT_ROLES` in
 * `eventa-api/src/modules/access/workspace-defaults.ts`. Admin holds every key.
 */
const ORGANIZER = [
  'evCreate',
  'evPublish',
  'evSpeakers',
  'regView',
  'regCheckin',
  'regExport',
  'regManage',
  'finView',
  'finDiscount',
  'evProgramView',
]
const STAFF = ['regView', 'regCheckin', 'evProgramView']

/*
 * US-SET-07: "Given I'm an Organizer or Staff, when I open this page, then it's
 * read-only or hidden and I can't change organization settings."
 *
 * The page used to offer everyone a live form, a Save button and the logo
 * controls, and an Organizer only found out at Save that `PATCH /organization`
 * answers 403. The API's guard is `setSettings` on the PATCH and on every logo
 * route, so that is what decides whether the page offers an edit.
 */
describe('whether the organization page offers an edit (US-SET-07)', () => {
  it('offers it to an Admin', () => {
    expect(canEditOrganization(me([...ORGANIZER, 'finRefund', 'setUsers', 'setSettings']))).toBe(
      true,
    )
  })

  it('is read-only for an Organizer', () => {
    expect(canEditOrganization(me(ORGANIZER))).toBe(false)
  })

  it('is read-only for Staff', () => {
    expect(canEditOrganization(me(STAFF))).toBe(false)
  })

  // A custom role is judged by what it was granted, not by its name.
  it('offers it to any role granted the settings permission', () => {
    expect(canEditOrganization(me(['regView', 'setSettings']))).toBe(true)
  })

  it('is read-only while nobody is known to be signed in', () => {
    expect(canEditOrganization(null)).toBe(false)
  })
})
