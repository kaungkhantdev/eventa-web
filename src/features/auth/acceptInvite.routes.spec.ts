import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { submitAcceptInvite, tokenOf } from './acceptInvite.routes'

/**
 * Accepting a teammate's invitation (US-SET-11).
 *
 * "they appear as 'Invited' and receive a join link by email" — this is the
 * end of that link. The token used to be returned in the API's response and
 * never sent, so there was nothing to accept and nowhere to accept it.
 */
const LINK = 'https://app.eventa.test/accept-invite?token=ITOKEN'

function submission(url: string, fields: Record<string, string>): Request {
  const body = new FormData()
  for (const [k, v] of Object.entries(fields)) body.set(k, v)
  return new Request(url, { method: 'POST', body })
}

describe('tokenOf', () => {
  it('reads the token the emailed link carries', () => {
    expect(tokenOf(new Request(LINK))).toBe('ITOKEN')
  })

  it('is null when the link was truncated', () => {
    expect(tokenOf(new Request('https://app.eventa.test/accept-invite'))).toBeNull()
  })
})

describe('submitAcceptInvite', () => {
  const good = { password: 'a-strong-password-1', confirmPassword: 'a-strong-password-1' }

  it('sets the password and reports who can now sign in', async () => {
    const accept = vi.fn().mockResolvedValue({
      userId: 'u1',
      email: 'somchai@acme.test',
      status: 'Active',
    })

    const result = await submitAcceptInvite(submission(LINK, good), accept)

    expect(accept).toHaveBeenCalledWith('ITOKEN', 'a-strong-password-1')
    expect(result).toEqual({ ok: true, email: 'somchai@acme.test' })
  })

  /**
   * A typo guard, not a security rule — which is why it is compared here and
   * the API is never sent the secret twice.
   */
  it('refuses a mistyped confirmation without calling the API', async () => {
    const accept = vi.fn()

    const result = await submitAcceptInvite(
      submission(LINK, { password: 'a-strong-password-1', confirmPassword: 'typo' }),
      accept,
    )

    expect(accept).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: false, error: 'Those passwords do not match.' })
  })

  it('says the link is incomplete rather than calling with no token', async () => {
    const accept = vi.fn()

    const result = await submitAcceptInvite(
      submission('https://app.eventa.test/accept-invite', good),
      accept,
    )

    expect(accept).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
  })

  /** The API's refusal is written for the reader; it is shown, not replaced. */
  it('shows the API’s own words when the token is spent', async () => {
    const accept = vi
      .fn()
      .mockRejectedValue(new ApiError(401, { message: 'That invitation has already been used.' }))

    const result = await submitAcceptInvite(submission(LINK, good), accept)

    expect(result).toEqual({
      ok: false,
      error: 'That invitation has already been used.',
    })
  })
})
