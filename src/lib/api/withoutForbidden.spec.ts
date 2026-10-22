import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError } from './ApiError'
import { whenForbidden, withoutForbidden } from './withoutForbidden'

/*
 * An auxiliary read — the options a filter offers — that the caller may not be
 * allowed to make. "You may not" costs them the options; anything else is a
 * real failure and must still reach the page's error element.
 */
describe('withoutForbidden', () => {
  it('passes the answer through when the read is allowed', async () => {
    await expect(withoutForbidden(() => Promise.resolve(['a', 'b']))).resolves.toEqual(['a', 'b'])
  })

  it('answers a 403 with no options', async () => {
    const refused = () =>
      Promise.reject(new ApiError(403, { message: 'Missing required permission: evCreate.' }))
    await expect(withoutForbidden(refused)).resolves.toEqual([])
  })

  it.each([
    ['a server error', new ApiError(500, {})],
    ['an expired session', new ApiError(401, {})],
    ['a network failure', new NetworkError(new TypeError('fetch failed'))],
  ])('still fails on %s', async (_name, cause) => {
    await expect(withoutForbidden(() => Promise.reject(cause))).rejects.toBe(cause)
  })
})

/* The same rule for a read whose "nothing" is not an empty list. */
describe('whenForbidden', () => {
  it('answers a 403 with the fallback the caller chose', async () => {
    const refused = () => Promise.reject(new ApiError(403, {}))
    await expect(whenForbidden(refused, null)).resolves.toBeNull()
  })

  it('passes the answer through when the read is allowed', async () => {
    await expect(whenForbidden(() => Promise.resolve({ rows: 1 }), null)).resolves.toEqual({
      rows: 1,
    })
  })

  it('still fails on anything that is not a refusal', async () => {
    const cause = new ApiError(500, {})
    await expect(whenForbidden(() => Promise.reject(cause), null)).rejects.toBe(cause)
  })
})
