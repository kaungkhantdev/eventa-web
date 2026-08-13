import { describe, expect, it } from 'vitest'
import { can, canAny, displayRole } from './permissions'
import type { Me } from './types'

const me = (permissions: string[], orgName = 'Demo Workspace'): Me => ({
  id: 'u-1',
  name: 'Anong Pattana',
  email: 'anong@demo.test',
  persona: 'admin',
  status: 'Active',
  twoFactorEnabled: false,
  organization: {
    id: 1,
    name: orgName,
    slug: 'demo',
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    locale: 'en',
  },
  permissions,
})

describe('what the console offers (US-REG-01, US-DASH-13)', () => {
  it('allows a granted permission', () => {
    expect(can(me(['regView']), 'regView')).toBe(true)
  })

  it('refuses one that was not granted', () => {
    expect(can(me(['regView']), 'finView')).toBe(false)
  })

  it('refuses everything when nothing is granted', () => {
    expect(can(me([]), 'regView')).toBe(false)
  })

  it('refuses everything when nobody is signed in', () => {
    // A null session must never read as permissive — the whole point of the
    // gate is that absence of proof is not proof of permission.
    expect(can(null, 'regView')).toBe(false)
    expect(canAny(null, ['regView', 'finView'])).toBe(false)
  })

  describe('any-of', () => {
    it('allows when one of several is granted', () => {
      expect(canAny(me(['evProgramView']), ['evProgramView', 'evSpeakers'])).toBe(true)
    })

    it('refuses when none is', () => {
      expect(canAny(me(['regView']), ['evProgramView', 'evSpeakers'])).toBe(false)
    })

    it('refuses an empty ask rather than treating it as unrestricted', () => {
      expect(canAny(me(['regView']), [])).toBe(false)
    })
  })
})

describe('the chip’s second line', () => {
  it('shows the workspace, which is what the session is scoped to', () => {
    // `/auth/me` carries no job title, so the honest thing to show is the
    // workspace the person is signed in to — inventing "Event Manager" would
    // be a label with nothing behind it.
    expect(displayRole(me([], 'Acme Events'))).toBe('Acme Events')
  })

  it('says nothing rather than guessing when there is no session', () => {
    expect(displayRole(null)).toBe('')
  })
})
