import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError } from '@/lib/api'
import { mapPanel, panel } from './panels'

describe('panel', () => {
  it('carries the answer through when the request succeeds', async () => {
    expect(await panel(Promise.resolve(['a']))).toEqual({ ok: true, data: ['a'] })
  })

  it("holds the API's own sentence when one panel fails", async () => {
    const result = await panel(Promise.reject(new ApiError(500, { message: 'Report timed out.' })))

    expect(result).toEqual({ ok: false, error: 'Report timed out.' })
  })

  it('explains an unreachable server rather than showing an empty panel', async () => {
    const result = await panel(Promise.reject(new NetworkError(new Error('offline'))))

    expect(result).toEqual({
      ok: false,
      error: "We couldn't reach the server. Check your connection and try again.",
    })
  })

  // An expired session is not a broken panel — swallowing it would leave the
  // whole screen reading "unavailable" when the fix is to sign in again.
  it('lets an expired session through so the loader can redirect', async () => {
    await expect(panel(Promise.reject(new ApiError(401, {})))).rejects.toBeInstanceOf(ApiError)
  })

  // Same reasoning for a bug: hiding a TypeError behind "retry" means nobody
  // ever finds out the mapper is broken.
  it('lets a programming error through', async () => {
    await expect(panel(Promise.reject(new TypeError('x is not a function')))).rejects.toBeInstanceOf(
      TypeError,
    )
  })
})

describe('mapPanel', () => {
  it('maps what loaded', async () => {
    expect(mapPanel(await panel(Promise.resolve([1, 2])), (n) => n.length)).toEqual({
      ok: true,
      data: 2,
    })
  })

  it('leaves the failure untouched rather than mapping over nothing', async () => {
    const failed = await panel(Promise.reject(new ApiError(503, { message: 'Down for now.' })))

    expect(mapPanel(failed, () => 'mapped')).toEqual({ ok: false, error: 'Down for now.' })
  })
})
