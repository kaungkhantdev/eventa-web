import { describe, expect, it } from 'vitest'
import type { Me } from '@/features/auth/types'
import { MANAGE_INTEGRATIONS, canManageIntegrations } from './integrationsAccess'

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
 * US-MTG-08: "Admins connect, reconnect and disconnect Google Calendar from
 * Settings → Integrations." The API guards connect and disconnect with
 * `setIntegrations`, so that key — not a role name — decides whether the
 * console offers them.
 */
describe('whether the console offers to connect Google Calendar (US-MTG-08)', () => {
  it('is the key eventa-api requires on connect and disconnect', () => {
    expect(MANAGE_INTEGRATIONS).toBe('setIntegrations')
  })

  it('offers it to an Admin', () => {
    expect(canManageIntegrations(me([...ORGANIZER, 'setSettings', 'setIntegrations']))).toBe(true)
  })

  it('does not offer it to an Organizer', () => {
    expect(canManageIntegrations(me(ORGANIZER))).toBe(false)
  })

  it('does not offer it to Staff', () => {
    expect(canManageIntegrations(me(STAFF))).toBe(false)
  })

  // A custom role is judged by what it was granted, not by its name.
  it('offers it to any role granted the integrations permission', () => {
    expect(canManageIntegrations(me(['regView', 'setIntegrations']))).toBe(true)
  })

  it('offers nothing while nobody is known to be signed in', () => {
    expect(canManageIntegrations(null)).toBe(false)
  })
})
