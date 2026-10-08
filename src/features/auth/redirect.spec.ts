import { describe, expect, it } from 'vitest'
import { returnTo, safeRedirect } from './redirect'

const HOME = '/admin/dashboard'

describe('what the guard remembers to return to', () => {
  it('remembers the page they were stopped on, query and all', () => {
    expect(returnTo('/admin/registrations', '?tab=pending')).toBe(
      '/admin/registrations?tab=pending',
    )
  })

  it('remembers nothing for the root', () => {
    expect(returnTo('/', '')).toBeNull()
  })

  /**
   * The rule that keeps the guard and `guestOnly` from arguing.
   *
   * A guest screen can now redirect, so it can be the page somebody is
   * "stopped on" — and remembering it would send them back to the sign-in
   * form immediately after signing in. `guestOnly` would bounce them onward,
   * so it self-heals, but by way of a nonsense URL and an extra hop.
   */
  it('remembers nothing for a screen you sign in or sign up on', () => {
    expect(returnTo('/auth/login', '')).toBeNull()
    expect(returnTo('/auth/register', '')).toBeNull()
    expect(returnTo('/portal/login', '?from=%2Fportal%2Fmy-events')).toBeNull()
    expect(returnTo('/portal/register', '')).toBeNull()
  })

  it('remembers nothing for what follows one, like check-email', () => {
    expect(returnTo('/auth/register/check-email', '')).toBeNull()
    expect(returnTo('/portal/register/check-email', '')).toBeNull()
  })

  it('still remembers a page that merely starts the same way', () => {
    expect(returnTo('/portal/logins-report', '')).toBe('/portal/logins-report')
  })
})

describe('where a sign-in returns you', () => {
  it('goes back where the guard stopped them', () => {
    expect(safeRedirect('/admin/registrations?tab=pending', HOME)).toBe(
      '/admin/registrations?tab=pending',
    )
  })

  it('lands on home when nothing was remembered', () => {
    expect(safeRedirect(null, HOME)).toBe(HOME)
    expect(safeRedirect('', HOME)).toBe(HOME)
  })

  describe('refuses to be turned into an open redirect', () => {
    it('refuses a protocol-relative target', () => {
      // `//evil.example` is a URL, not a path — the browser would leave the site.
      expect(safeRedirect('//evil.example', HOME)).toBe(HOME)
    })

    it('refuses a backslash-relative target', () => {
      // Browsers normalise `/\` to `//`, so a check for `//` alone lets this
      // through — which is exactly what the inline guard used to do.
      expect(safeRedirect('/\\evil.example', HOME)).toBe(HOME)
      expect(safeRedirect('\\\\evil.example', HOME)).toBe(HOME)
    })

    it('refuses an absolute URL', () => {
      expect(safeRedirect('https://evil.example/admin', HOME)).toBe(HOME)
    })

    it('refuses anything that is not rooted at /', () => {
      expect(safeRedirect('admin/dashboard', HOME)).toBe(HOME)
      expect(safeRedirect('javascript:alert(1)', HOME)).toBe(HOME)
    })
  })
})
