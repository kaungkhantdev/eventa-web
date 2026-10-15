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
    expect(scorePassword('1!' + 'a'.repeat(MIN_PASSWORD_LENGTH - 3))).toBe(0)
  })

  it('accepts the floor itself', () => {
    expect(scorePassword('1!' + 'a'.repeat(MIN_PASSWORD_LENGTH - 2))).toBe(1)
  })

  // US-SET-02: a strong password is "at least 8 characters with a number and a
  // symbol" — the floor the API enforces at sign-up, reset, change and invite.
  it('holds the floor at 8 characters', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
  })

  it('scores a long password with no number as one the API refuses', () => {
    expect(scorePassword('password!word')).toBe(0)
  })

  it('scores a long password with no symbol as one the API refuses', () => {
    expect(scorePassword('Passw0rdPassw0rd')).toBe(0)
  })

  it('asks for no letter — a number and a symbol are the rule', () => {
    expect(scorePassword('12345678!')).toBe(1)
  })

  // A Thai letter or vowel sign is a letter, not a symbol, so it never stands
  // in for the one the rule asks for.
  it('does not count Thai letters as symbols', () => {
    expect(scorePassword('สวัสดีครับ1')).toBe(0)
    expect(scorePassword('สวัสดีคะ1!')).toBe(1)
  })

  it('says so in words', () => {
    expect(STRENGTH_TEXTS[0]).toBe(`Use ${MIN_PASSWORD_LENGTH}+ characters with a number and a symbol`)
  })

  it('scores a password that only meets the floor as weak', () => {
    expect(scorePassword('aaaaaaa1!')).toBe(1)
  })

  it('rewards mixing case', () => {
    expect(scorePassword('Passw0rd!')).toBe(2)
  })

  // The last point needs length — the kit awarded it a few characters above
  // its own minimum, and that relationship is kept.
  it('rewards a comfortable length', () => {
    expect(scorePassword('Passw0rd!a')).toBe(2)
    expect(scorePassword('Passw0rd!aaa')).toBe(3)
  })

  it('never scores above three', () => {
    expect(scorePassword('Sup3r!Secret#Passphrase')).toBe(3)
  })
})
