import { describe, expect, it } from 'vitest'
import {
  toMemberRow,
  toNotificationRow,
  toPermissionOption,
  toRoleCard,
  toSessionRow,
} from './settings.mapper'
import type { LoginSessionWire, MemberWire, RoleWire } from './settings.types'

const member = (over: Partial<MemberWire> = {}): MemberWire => ({
  id: 7690,
  userId: 'u-1',
  name: 'Rio Chansiri',
  email: 'rio@demo.test',
  roleId: 9093,
  role: 'Admin',
  status: 'Active',
  ...over,
})

describe('toMemberRow', () => {
  it('reads as a person and the role they hold', () => {
    const row = toMemberRow(member())

    expect(row).toMatchObject({ name: 'Rio Chansiri', initials: 'RC', role: 'Admin' })
  })

  // The two states an admin can act on. Invited means the mail can be sent
  // again; suspended means the button says Reactivate, not Suspend.
  it('marks whether they have accepted, and whether they are suspended', () => {
    expect(toMemberRow(member({ status: 'Invited' })).invited).toBe(true)
    expect(toMemberRow(member({ status: 'Suspended' })).suspended).toBe(true)
    expect(toMemberRow(member()).invited).toBe(false)
  })

  it('tints each status', () => {
    expect(toMemberRow(member({ status: 'Active' })).statusTone).toBe('green')
    expect(toMemberRow(member({ status: 'Suspended' })).statusTone).toBe('red')
  })
})

const role = (over: Partial<RoleWire> = {}): RoleWire => ({
  id: 1,
  name: 'Organizer',
  description: 'Runs events day to day',
  permissions: ['evCreate', 'regView'],
  memberCount: 3,
  isSystem: false,
  ...over,
})

describe('toRoleCard', () => {
  it('counts the members holding it, in words', () => {
    expect(toRoleCard(role({ memberCount: 3 })).members).toBe('3 members')
    expect(toRoleCard(role({ memberCount: 1 })).members).toBe('1 member')
  })

  // "0 members" reads as a defect; a role nobody holds yet is a normal state
  // and worth saying plainly.
  it('says so plainly when nobody holds it', () => {
    expect(toRoleCard(role({ memberCount: 0 })).members).toBe('No members yet')
  })
})

describe('toPermissionOption', () => {
  it('uses the label the API recorded', () => {
    expect(toPermissionOption({ key: 'evPublish', group: 'Events', label: 'Publish events' })).
      toMatchObject({ label: 'Publish events' })
  })

  // Some permissions come back with the key as their own label. Showing
  // "evCreate" to an admin choosing what a role may do is not a sentence, so
  // it is spaced out into something readable.
  it('makes a key readable when no label was recorded', () => {
    expect(toPermissionOption({ key: 'evCreate', group: 'Events', label: 'evCreate' }).label).toBe(
      'Ev create',
    )
  })
})

const session = (over: Partial<LoginSessionWire> = {}): LoginSessionWire => ({
  id: 's-1',
  device: 'Chrome on macOS',
  ipAddress: '203.0.113.4',
  signedInAt: '2026-08-14T09:37:34.772Z',
  expiresAt: '2026-08-15T09:37:34.772Z',
  isCurrent: true,
  ...over,
})

describe('toSessionRow', () => {
  // 09:37 UTC is 16:37 in Bangkok — somebody checking whether that sign-in was
  // theirs is reading their own clock.
  it('dates the sign-in on the Bangkok clock', () => {
    expect(toSessionRow(session()).signedIn).toBe('Aug 14, 2026 · 16:37')
  })

  it('marks the session doing the asking, so it is not revoked by mistake', () => {
    expect(toSessionRow(session()).isCurrent).toBe(true)
  })
})

describe('toNotificationRow', () => {
  it('gives each category a title and an explanation', () => {
    const row = toNotificationRow({
      category: 'payout',
      emailEnabled: true,
      smsEnabled: false,
      smsAvailable: false,
    })

    expect(row.title).toBe('Payouts')
    expect(row.description).toBeTruthy()
  })

  // SMS being unavailable is not the same as switched off: one is a choice,
  // the other is the product not offering it.
  it('keeps "cannot" separate from "off"', () => {
    const row = toNotificationRow({
      category: 'alert',
      emailEnabled: true,
      smsEnabled: false,
      smsAvailable: false,
    })

    expect(row.smsAvailable).toBe(false)
    expect(row.smsEnabled).toBe(false)
  })
})
