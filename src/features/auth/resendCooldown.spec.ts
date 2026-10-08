import { beforeEach, describe, expect, it } from 'vitest'
import {
  RESEND_COOLDOWN_MS,
  type CooldownStore,
  secondsRemaining,
  startCooldown,
} from './resendCooldown'

const EMAIL = 'owner@acme.co.th'
const NOW = 1_700_000_000_000

/** A store that outlives a "reload", the way localStorage does. */
function fakeStore(): CooldownStore & { raw: Map<string, string> } {
  const raw = new Map<string, string>()
  return {
    raw,
    getItem: (key) => raw.get(key) ?? null,
    setItem: (key, value) => void raw.set(key, value),
  }
}

describe('resend cool-off', () => {
  let store: ReturnType<typeof fakeStore>

  beforeEach(() => {
    store = fakeStore()
  })

  it('is over before anything has been sent', () => {
    expect(secondsRemaining(EMAIL, NOW, store)).toBe(0)
  })

  it('counts down from a full minute', () => {
    startCooldown(EMAIL, NOW, store)
    expect(secondsRemaining(EMAIL, NOW, store)).toBe(60)
    expect(secondsRemaining(EMAIL, NOW + 18_000, store)).toBe(42)
  })

  it('is over once the wait has passed, and never goes negative', () => {
    startCooldown(EMAIL, NOW, store)
    expect(secondsRemaining(EMAIL, NOW + RESEND_COOLDOWN_MS, store)).toBe(0)
    expect(secondsRemaining(EMAIL, NOW + 999_999, store)).toBe(0)
  })

  /**
   * The whole reason it is written down rather than held in a component: a
   * countdown a reload clears is decoration, and the API's 429 would then
   * arrive with nothing on screen to explain it.
   */
  it('survives a reload', () => {
    startCooldown(EMAIL, NOW, store)
    // Same storage, brand new page.
    expect(secondsRemaining(EMAIL, NOW + 1_000, store)).toBe(59)
  })

  it('waits separately for each address', () => {
    startCooldown(EMAIL, NOW, store)
    expect(secondsRemaining('someone@else.test', NOW, store)).toBe(0)
  })

  it('holds the same wait for an address typed in a different case', () => {
    startCooldown(EMAIL, NOW, store)
    expect(secondsRemaining('Owner@Acme.CO.TH', NOW, store)).toBe(60)
  })

  // A half-written or hand-edited value must not jam the button shut.
  it('treats a corrupt value as no wait at all', () => {
    store.raw.set(`eventa:resend-until:${EMAIL}`, 'nonsense')
    expect(secondsRemaining(EMAIL, NOW, store)).toBe(0)
  })

  // Private-mode Safari, or site data blocked.
  it('carries on when there is no storage to be had', () => {
    expect(() => startCooldown(EMAIL, NOW, null)).not.toThrow()
    expect(secondsRemaining(EMAIL, NOW, null)).toBe(0)
  })

  /**
   * A verification email and a reset link are two different sends: asking for
   * a reset link must not inherit the wait from a sign-up made a moment ago on
   * the same address, or the button would open jammed for no reason anyone on
   * the page can see.
   */
  it('waits separately for each purpose on the same address', () => {
    startCooldown(EMAIL, NOW, store)
    expect(secondsRemaining(EMAIL, NOW, store, 'reset')).toBe(0)

    startCooldown(EMAIL, NOW, store, 'reset')
    expect(secondsRemaining(EMAIL, NOW + 18_000, store, 'reset')).toBe(42)
    // And the verification wait is still its own, untouched by the reset send.
    expect(secondsRemaining(EMAIL, NOW + 18_000, store)).toBe(42)
  })

  /** Existing keys predate purposes; the default must keep reading them. */
  it('keeps the storage key the verification flow already wrote', () => {
    startCooldown(EMAIL, NOW, store)
    expect(store.raw.has(`eventa:resend-until:${EMAIL}`)).toBe(true)
  })
})
