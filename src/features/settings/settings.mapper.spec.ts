import { describe, expect, it } from 'vitest'
import {
  toMemberRow,
  toNotificationRow,
  toPermissionOption,
  toRoleCard,
  describeDevice,
  toAuditRow,
  toSessionRow,
} from './settings.mapper'
import type {
  AuditEntryWire,
  LoginSessionWire,
  MemberWire,
  RoleWire,
} from './settings.types'

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

/**
 * The audit panel's rows (US-ACC-07).
 *
 * Every fact except the title is optional at the source — an entry raised by a
 * background job has no actor, one raised from a console has no IP — so the
 * detail line is built from what is actually present rather than a template
 * with holes in it.
 */
describe('toAuditRow', () => {
  const entry = (over: Partial<AuditEntryWire> = {}): AuditEntryWire => ({
    id: 1,
    type: 'signin',
    title: 'Signed in',
    meta: 'Chrome on macOS',
    actorName: 'Harper Nelson',
    ipAddress: '203.0.113.24',
    occurredAt: '2026-08-21T03:02:00.000Z',
    ...over,
  })

  it('joins the facts it has into one readable line', () => {
    expect(toAuditRow(entry()).detail).toBe(
      'Chrome on macOS · Harper Nelson · 203.0.113.24',
    )
  })

  it('drops an absent actor rather than leaving a gap', () => {
    expect(toAuditRow(entry({ actorName: null })).detail).toBe(
      'Chrome on macOS · 203.0.113.24',
    )
  })

  it('drops an absent IP', () => {
    expect(toAuditRow(entry({ ipAddress: null })).detail).toBe(
      'Chrome on macOS · Harper Nelson',
    )
  })

  it('is empty, not a stray separator, when nothing but the title is known', () => {
    expect(
      toAuditRow(entry({ meta: null, actorName: null, ipAddress: null })).detail,
    ).toBe('')
  })

  // Bangkok, because somebody auditing their own account reads their own clock.
  it('shows when it happened in Bangkok time', () => {
    expect(toAuditRow(entry()).when).toBe('Aug 21, 2026 · 10:02')
  })

  it('keeps the title and type through unchanged', () => {
    const row = toAuditRow(entry({ type: 'pwd', title: 'Password changed' }))
    expect(row).toMatchObject({ type: 'pwd', title: 'Password changed' })
  })
})

/**
 * A device somebody can recognise (US-ACC-06).
 *
 * The card exists so an organizer can spot a sign-in that was not theirs, and
 * the API sends a raw user-agent. Two rows reading "Mozilla/5.0 (Macintosh;
 * Intel Mac OS X 10_15_7) AppleW…" defeat the entire purpose — they are
 * identical, truncated, and say nothing about which is which.
 */
describe('describeDevice', () => {
  it.each([
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
      'Chrome on macOS',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Safari on macOS',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Safari on iPhone',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      'Edge on Windows',
    ],
    [
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Chrome on Linux',
    ],
    [
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Chrome on Android',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Firefox on macOS',
    ],
  ])('reads %s as %s', (agent, expected) => {
    expect(describeDevice(agent)).toBe(expected)
  })

  /**
   * Edge and Chrome both claim to be Chrome, and Chrome claims to be Safari.
   * The order the checks run in is the whole rule, so it is pinned: the most
   * specific claim wins.
   */
  it('does not call Edge "Chrome", though Edge says it is', () => {
    expect(
      describeDevice('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36 Edg/120.0'),
    ).toBe('Edge on Windows')
  })

  it('does not call Chrome "Safari", though Chrome says it is', () => {
    expect(
      describeDevice('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/151.0 Safari/537.36'),
    ).toBe('Chrome on macOS')
  })

  /**
   * A UA nobody anticipated must still produce something, and must never be the
   * raw string — an unreadable row is what this replaced.
   */
  it('falls back to something readable for an unknown agent', () => {
    expect(describeDevice('SomeBot/1.0')).toBe('Unknown device')
  })

  it('handles a missing user-agent', () => {
    expect(describeDevice('')).toBe('Unknown device')
  })
})
