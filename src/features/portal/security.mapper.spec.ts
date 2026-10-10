import { recoveryCodesText } from '@/lib/recoveryCodes'
import { describe, expect, it } from 'vitest'
import {
  DELETE_CONFIRMATION,
  countOtherDevices,
  isDeleteConfirmed,
  passwordsMismatch,
  toDeleteBody,
  toDeletionWarning,
  toTwoFactorCard,
} from './security.mapper'
import type {
  DeletionWarningWire,
  LoginSessionWire,
  TwoFactorWire,
  UpcomingPaidOrderWire,
} from './security.types'

/**
 * The Security card's and the danger zone's rules (US-DISC-12 criteria 4–5,
 * US-DISC-14).
 *
 * Both were ported inert: a disabled "Change" button, a switch that could not
 * be moved, and a "Delete account" button with no handler. The rules here are
 * the ones a reader would be misled by if they were got wrong — a count of
 * recovery codes, money somebody is about to walk away from, and the two
 * gates in front of an irreversible action.
 */

const twoFactor = (over: Partial<TwoFactorWire> = {}): TwoFactorWire => ({
  enabled: false,
  pending: false,
  recoveryCodesRemaining: 0,
  ...over,
})

const order = (over: Partial<UpcomingPaidOrderWire> = {}): UpcomingPaidOrderWire => ({
  reference: 'ORD-7K2M9QX4',
  eventName: 'Bangkok Tech Week',
  // 2026-07-08 02:30 UTC is 09:30 the same day in Bangkok.
  startAt: '2026-07-08T02:30:00.000Z',
  ticketCount: 2,
  totalSatang: 188000,
  ...over,
})

const warning = (over: Partial<DeletionWarningWire> = {}): DeletionWarningWire => ({
  requiresTwoFactorCode: false,
  upcomingPaidOrders: [],
  totalAtRiskSatang: 0,
  ...over,
})

const session = (over: Partial<LoginSessionWire> = {}): LoginSessionWire => ({
  id: 's-1',
  device: 'Chrome on macOS',
  ipAddress: '203.0.113.7',
  signedInAt: '2026-07-01T04:00:00.000Z',
  expiresAt: '2026-08-01T04:00:00.000Z',
  isCurrent: false,
  ...over,
})

const formOf = (fields: Record<string, string>): FormData => {
  const form = new FormData()
  for (const [name, value] of Object.entries(fields)) form.append(name, value)
  return form
}

describe('the two-factor row', () => {
  it('says what the kit says when two-factor has never been set up', () => {
    expect(toTwoFactorCard(twoFactor())).toEqual({
      enabled: false,
      pending: false,
      recoveryCodesRemaining: 0,
      status: 'Extra security at sign-in',
    })
  })

  it('reports an enrolment that was started and never finished', () => {
    const card = toTwoFactorCard(twoFactor({ pending: true }))

    expect(card.enabled).toBe(false)
    expect(card.status).toBe('Setup was started but never finished')
  })

  it('counts the recovery codes that are still good', () => {
    const card = toTwoFactorCard(twoFactor({ enabled: true, recoveryCodesRemaining: 8 }))

    expect(card.enabled).toBe(true)
    expect(card.status).toBe('On · 8 recovery codes left')
  })

  it('says plainly when every recovery code has been spent', () => {
    // Zero is a fact here, not a masked figure: somebody who loses their phone
    // now has no way back in, and the row is the only place that can say so.
    const card = toTwoFactorCard(twoFactor({ enabled: true, recoveryCodesRemaining: 0 }))

    expect(card.status).toBe('On · no recovery codes left')
  })

  it('counts one code in the singular', () => {
    expect(toTwoFactorCard(twoFactor({ enabled: true, recoveryCodesRemaining: 1 })).status).toBe(
      'On · 1 recovery code left',
    )
  })
})

describe('other signed-in devices', () => {
  it('never counts the device doing the asking', () => {
    expect(countOtherDevices([session({ isCurrent: true }), session({ id: 's-2' })])).toBe(1)
  })

  it('is none when this is the only session', () => {
    expect(countOtherDevices([session({ isCurrent: true })])).toBe(0)
  })
})

describe('what deleting the account walks away from', () => {
  it('risks nothing when there are no upcoming paid tickets', () => {
    const shown = toDeletionWarning(warning())

    expect(shown.orders).toEqual([])
    // Not `฿0`, and not "Free": there is nothing at risk, which is a different
    // fact from a forfeit of no money.
    expect(shown.totalAtRisk).toBeNull()
  })

  it('prices the forfeit in Baht and dates it in Bangkok', () => {
    const shown = toDeletionWarning(
      warning({ upcomingPaidOrders: [order()], totalAtRiskSatang: 188000 }),
    )

    expect(shown.totalAtRisk).toBe('฿1,880')
    expect(shown.orders).toEqual([
      {
        reference: 'ORD-7K2M9QX4',
        eventName: 'Bangkok Tech Week',
        when: 'Jul 8, 2026 · 09:30',
        tickets: '2 tickets',
        amount: '฿1,880',
      },
    ])
  })

  it('counts a single ticket in the singular', () => {
    const shown = toDeletionWarning(
      warning({ upcomingPaidOrders: [order({ ticketCount: 1 })], totalAtRiskSatang: 94000 }),
    )

    expect(shown.orders[0].tickets).toBe('1 ticket')
  })

  it('carries the API answer about needing an authenticator code', () => {
    expect(toDeletionWarning(warning({ requiresTwoFactorCode: true })).requiresTwoFactorCode).toBe(
      true,
    )
  })
})

describe('the confirmation phrase', () => {
  it('accepts the exact word', () => {
    expect(isDeleteConfirmed(DELETE_CONFIRMATION)).toBe(true)
  })

  it('forgives space either side, which a phone keyboard adds on its own', () => {
    expect(isDeleteConfirmed('  DELETE ')).toBe(true)
  })

  it('refuses a different case, because the API refuses it too', () => {
    // Accepting it here would send a body the API answers with a validation
    // error nobody could explain from what is on screen.
    expect(isDeleteConfirmed('delete')).toBe(false)
  })

  it('refuses a partial word and an empty box', () => {
    expect(isDeleteConfirmed('DELET')).toBe(false)
    expect(isDeleteConfirmed('')).toBe(false)
  })
})

describe('the new password and its confirmation', () => {
  it('passes when both boxes agree', () => {
    expect(
      passwordsMismatch(formOf({ newPassword: 'Nineteen-84!', confirmPassword: 'Nineteen-84!' })),
    ).toBe(false)
  })

  it('catches a typo in either box', () => {
    expect(
      passwordsMismatch(formOf({ newPassword: 'Nineteen-84!', confirmPassword: 'Nineteen-85!' })),
    ).toBe(true)
  })

  it('treats an unfilled confirmation as a mismatch rather than a match', () => {
    expect(passwordsMismatch(formOf({ newPassword: 'Nineteen-84!' }))).toBe(true)
  })
})

describe('the delete request', () => {
  it('sends the trimmed phrase, so the API has the last word on it', () => {
    const body = toDeleteBody(formOf({ confirm: ' DELETE ', password: 'Nineteen-84!' }))

    expect(body).toEqual({ confirm: 'DELETE', password: 'Nineteen-84!' })
  })

  it('carries an authenticator code when one was asked for', () => {
    const body = toDeleteBody(
      formOf({ confirm: 'DELETE', password: 'Nineteen-84!', code: '123456' }),
    )

    expect(body.code).toBe('123456')
  })

  it('omits an empty code rather than sending a blank one the API must refuse', () => {
    const body = toDeleteBody(formOf({ confirm: 'DELETE', password: 'Nineteen-84!', code: '  ' }))

    expect('code' in body).toBe(false)
  })
})

describe('the recovery codes the reader has to keep', () => {
  const codes = ['A1B2C-3D4E5', 'F6G7H-8J9K0']

  it('writes one code per line, so the file is usable as it is', () => {
    const text = recoveryCodesText(codes, 'araya@example.co.th')

    for (const code of codes) expect(text).toContain(code)
    expect(text.trimEnd().split('\n').slice(-2)).toEqual(codes)
  })

  it('says whose they are and that each works once', () => {
    const text = recoveryCodesText(codes, 'araya@example.co.th')

    expect(text).toContain('araya@example.co.th')
    expect(text).toContain('once')
  })

  it('never writes a code twice, which would read as two chances', () => {
    const text = recoveryCodesText(['A1B2C-3D4E5'], 'araya@example.co.th')

    expect(text.split('A1B2C-3D4E5')).toHaveLength(2)
  })
})
