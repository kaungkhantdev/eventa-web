import { describe, expect, it } from 'vitest'
import { twoFactorDoneMessage, twoFactorSetupStep } from './twoFactorSetup'

/**
 * The console's two-factor setup panel (US-SET-03: "Given I start setup, when
 * I scan the code with my authenticator app and enter the 6-digit code it
 * shows, then two-factor turns on").
 */

const OFF = { enabled: false, pending: false, recoveryCodesRemaining: 0 }
const PENDING = { enabled: false, pending: true, recoveryCodesRemaining: 0 }
const STARTED = {
  secret: 'JBSWY3DPEHPK3PXP',
  otpauthUri: 'otpauth://totp/Eventa:somchai%40acme.test?secret=JBSWY3DPEHPK3PXP&issuer=Eventa',
}

describe('twoFactorSetupStep', () => {
  it('offers to start setup when two-factor is off and nothing is pending', () => {
    expect(twoFactorSetupStep(OFF, undefined)).toEqual({
      startLabel: 'Start setup',
      seed: null,
      canConfirm: false,
    })
  })

  // "scan the code": the otpauth URI arrived with the secret and was never
  // drawn, so there was nothing to scan — only a key to type.
  it('draws the seed as a QR to scan, beside the key to type', () => {
    const step = twoFactorSetupStep(OFF, STARTED)

    expect(step.seed?.key).toBe(STARTED.secret)
    expect(step.seed?.qr).toMatch(/^data:image\/\w+;base64,/)
    expect(step.canConfirm).toBe(true)
    expect(step.startLabel).toBeNull()
  })

  // A setup started and never finished survives a reload as `pending`, with no
  // seed on screen. Hiding the start button then left only a code box that
  // somebody who never added the key could not fill: two-factor could never be
  // turned on from the console again. The API's start replaces a pending seed.
  it('offers to start over when a setup was left pending, keeping the code box', () => {
    expect(twoFactorSetupStep(PENDING, undefined)).toEqual({
      startLabel: 'Start over',
      seed: null,
      canConfirm: true,
    })
  })

  it('shows the fresh seed once starting over has answered', () => {
    const step = twoFactorSetupStep(PENDING, STARTED)

    expect(step.startLabel).toBeNull()
    expect(step.seed?.key).toBe(STARTED.secret)
  })
})

/*
 * Which successful answer ends the panel with a toast. The panel closed on
 * ANY success, so starting setup shut it on the QR it had just drawn and
 * announced "Two-factor is on." before a code was ever entered — there was
 * nothing left on screen to scan (US-SET-03).
 */
describe('twoFactorDoneMessage', () => {
  it('keeps the panel open on the seed that starting setup answers with', () => {
    expect(twoFactorDoneMessage({ ok: true, ...STARTED })).toBeNull()
  })

  // The codes are the confirmation, and are shown exactly once.
  it('keeps the panel open on the recovery codes confirming answers with', () => {
    expect(twoFactorDoneMessage({ ok: true, recoveryCodes: ['a1b2-c3d4'] })).toBeNull()
  })

  // Decided from the answer, not the status: by the time it lands the loader
  // has revalidated and already says "off", which read "Two-factor is on.".
  it('closes on turning two-factor off, and says so', () => {
    expect(twoFactorDoneMessage({ ok: true })).toBe('Two-factor turned off.')
  })

  it('closes on nothing that failed', () => {
    expect(twoFactorDoneMessage({ ok: false, error: 'That code is not right.' })).toBeNull()
    expect(twoFactorDoneMessage(undefined)).toBeNull()
  })
})
