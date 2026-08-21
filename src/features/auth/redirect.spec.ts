import { describe, expect, it } from 'vitest'
import { safeRedirect } from './redirect'

const HOME = '/admin/dashboard'

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
