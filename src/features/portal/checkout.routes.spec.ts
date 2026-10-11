import { describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError } from '@/lib/api'
import { revalidateCheckout, savedProfile } from './checkout.routes'
import type { ProfileWire } from './profile.types'

const profile = { name: 'Anong', email: 'anong@demo.test' } as ProfileWire

/*
 * These are the two lines that keep a guest able to buy, and they had no test.
 * Both were deleted in review and the whole suite — 1262 tests — stayed green,
 * because the tested part is the mapper and the mapper is not where the guest
 * path lives.
 *
 * The rule is deliberately NOT `panel()` from `@/app/panels`, which re-throws a
 * 401 so a loader guard can redirect to sign-in. Public checkout has no such
 * guard, so that re-throw would take the page down for someone perfectly able
 * to buy as a guest. This spec pins the divergence, because it is the kind a
 * later refactor "corrects" by reaching for the shared primitive.
 */
describe('savedProfile', () => {
  it('asks for nothing at all when nobody is signed in', async () => {
    const fetchProfile = vi.fn()

    expect(await savedProfile(null, fetchProfile)).toBeNull()
    // Not merely null: a guest must issue no authenticated request, because a
    // 401 here would replace the registration page with an error screen.
    expect(fetchProfile).not.toHaveBeenCalled()
  })

  it('asks for nothing on an organizer session, whose profile is not the buyer', async () => {
    const fetchProfile = vi.fn()

    expect(await savedProfile('admin', fetchProfile)).toBeNull()
    expect(fetchProfile).not.toHaveBeenCalled()
  })

  it('returns the profile for a signed-in attendee', async () => {
    expect(await savedProfile('attendee', () => Promise.resolve(profile))).toEqual(profile)
  })

  // A stale token must cost the pre-fill, never the sale.
  it('gives up the pre-fill on an expired session rather than failing checkout', async () => {
    const result = await savedProfile('attendee', () => Promise.reject(new ApiError(401, {})))

    expect(result).toBeNull()
  })

  it('gives up the pre-fill when the server cannot be reached', async () => {
    const result = await savedProfile('attendee', () =>
      Promise.reject(new NetworkError(new Error('offline'))),
    )

    expect(result).toBeNull()
  })

  // Same reasoning as `panel()`: "retry" must not become the answer to a bug.
  it('lets a programming error through', async () => {
    await expect(
      savedProfile('attendee', () => Promise.reject(new TypeError('x is not a function'))),
    ).rejects.toBeInstanceOf(TypeError)
  })
})

describe('revalidateCheckout', () => {
  /*
   * A quote is the server's arithmetic on an unchanged cart — it books nothing
   * and holds nothing — so re-running the loader after one is pure waste on the
   * money path. And it is not one wasted call: the quote fetcher fires from a
   * useEffect keyed on the discount code, which is an undebounced controlled
   * input, so typing "SAVE20" was six quotes and six full revalidations, each
   * re-fetching the event view AND an authenticated `/me/profile`.
   *
   * None of those re-reads could change anything either. The buyer boxes are
   * uncontrolled, so React writes `defaultValue` and never overwrites a dirty
   * input — which is exactly the property that lets a typed-over value survive.
   */
  it('does not re-run the loader after a quote, which changed nothing', () => {
    expect(revalidateCheckout({ actionResult: { ok: true, intent: 'quote' } })).toBe(false)
  })

  // A booking moves inventory and a waitlist join takes a place in line, so the
  // view the page is built from is genuinely stale afterwards.
  it.each(['book', 'waitlist'])('re-runs the loader after a %s', (intent) => {
    expect(revalidateCheckout({ actionResult: { ok: true, intent } })).toBe(true)
  })

  // A refused action leaves the server as it was, but says nothing about why,
  // so this defers rather than guessing.
  it('defers to the router when there is no action result to read', () => {
    expect(revalidateCheckout({ defaultShouldRevalidate: true })).toBe(true)
    expect(revalidateCheckout({ defaultShouldRevalidate: false })).toBe(false)
  })
})
