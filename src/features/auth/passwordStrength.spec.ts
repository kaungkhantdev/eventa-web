import { describe, expect, it } from 'vitest'
import { MIN_PASSWORD_LENGTH, STRENGTH_TEXTS, scorePassword } from './passwordStrength'

describe('scorePassword', () => {
  it('scores nothing typed as nothing', () => {
    expect(scorePassword('')).toBe(0)
  })

  // The API refuses anything shorter, so the meter must not encourage it: a
  // password this page called "weak" but acceptable was rejected on submit.
  // Written against the constant rather than a literal, so moving the floor
  // moves the test with it instead of quietly leaving it behind.
  it('scores a password shorter than the API accepts as too short', () => {
    expect(scorePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(0)
  })

  it('accepts the floor itself', () => {
    expect(scorePassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBe(1)
  })

  it('says so in words', () => {
    expect(STRENGTH_TEXTS[0]).toBe(`Use ${MIN_PASSWORD_LENGTH}+ characters`)
  })

  it('scores a long-enough password as weak on its own', () => {
    expect(scorePassword('aaaaaaaaaa')).toBe(1)
  })

  it('rewards mixing case and digits', () => {
    expect(scorePassword('Passw0rdaa')).toBe(2)
  })

  // The last point needs length as well as a symbol — the kit awarded it two
  // characters above its own minimum, and that relationship is kept.
  it('rewards a symbol at a comfortable length', () => {
    expect(scorePassword('Passw0rd!a')).toBe(2)
    expect(scorePassword('Passw0rd!aaa')).toBe(3)
  })

  it('never scores above three', () => {
    expect(scorePassword('Sup3r!Secret#Passphrase')).toBe(3)
  })
})
