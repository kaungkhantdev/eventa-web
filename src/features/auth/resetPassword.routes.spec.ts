import { describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError } from '@/lib/api'
import type { ResetLinkCheck } from './api'
import { toResetLinkView } from './resetPassword.mapper'
import {
  INCOMPLETE_LINK,
  PASSWORDS_DIFFER,
  loadResetLink,
  screenOf,
  shouldRecheckLink,
  submitNewPassword,
  type ResetLinkData,
} from './resetPassword.routes'

/**
 * The page at the end of the reset email's link (US-ACC-04).
 *
 * Opening the link checks it without spending it, so an expired or used link
 * is refused on arrival rather than after somebody has typed a new password
 * twice (criterion 7, TC-ACC-10 step 6).
 */

const TOKEN = 'header.payload.signature'
const INVALID_LINK = 'This reset link is invalid or has expired. Request a new one.'
const RESET_DONE = 'Your password has been reset. Please sign in.'
const ORGANIZER: ResetLinkCheck = { persona: 'admin', workspaceName: 'Acme Events' }

const opened = (search: string) => new Request(`http://localhost/reset-password${search}`)

function submitted(fields: Record<string, string>, search = `?token=${TOKEN}`) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return new Request(`http://localhost/reset-password${search}`, { method: 'POST', body: form })
}

const checking = (answer: ResetLinkCheck) =>
  vi.fn<(token: string) => Promise<ResetLinkCheck>>(async () => answer)

const refusing = (cause: Error) =>
  vi.fn<(token: string) => Promise<ResetLinkCheck>>(async () => {
    throw cause
  })

describe('loadResetLink', () => {
  it('shows the form for a usable link, worded for its account', async () => {
    const check = checking(ORGANIZER)

    const data = await loadResetLink(opened(`?token=${TOKEN}`), check)

    expect(check).toHaveBeenCalledWith(TOKEN)
    expect(data).toEqual({ state: 'ready', view: toResetLinkView(ORGANIZER) })
  })

  it('calls a link with no token incomplete, without asking the API', async () => {
    const check = checking(ORGANIZER)

    expect(await loadResetLink(opened(''), check)).toEqual({
      state: 'invalid',
      error: INCOMPLETE_LINK,
    })
    expect(await loadResetLink(opened('?token=%20'), check)).toEqual({
      state: 'invalid',
      error: INCOMPLETE_LINK,
    })
    expect(check).not.toHaveBeenCalled()
  })

  // Expired, already used, or never valid: the API says so in words written
  // for the person holding the link, and they are shown as they are.
  it('refuses an invalid, expired or used link in the API’s own words', async () => {
    const data = await loadResetLink(
      opened(`?token=${TOKEN}`),
      refusing(new ApiError(422, { message: INVALID_LINK })),
    )

    expect(data).toEqual({ state: 'invalid', error: INVALID_LINK })
  })

  // The token is the only thing the check is asked about, so a validation
  // refusal of any kind is a refusal of the link.
  it('treats a token the API rejected as malformed as a bad link too', async () => {
    const malformed = new ApiError(400, {
      message: 'Validation failed.',
      errors: [{ field: 'token', message: 'token must be a jwt string' }],
    })

    expect(await loadResetLink(opened(`?token=${TOKEN}`), refusing(malformed))).toEqual({
      state: 'invalid',
      error: 'token must be a jwt string',
    })
  })

  // An outage says nothing about the link. Telling somebody to request a new
  // one would send them round the loop for nothing; the error screen offers a
  // retry instead.
  it('lets a failure that is not about the link reach the error screen', async () => {
    await expect(
      loadResetLink(opened(`?token=${TOKEN}`), refusing(new ApiError(500, {}))),
    ).rejects.toBeInstanceOf(ApiError)
    await expect(
      loadResetLink(opened(`?token=${TOKEN}`), refusing(new NetworkError(null))),
    ).rejects.toBeInstanceOf(NetworkError)
  })
})

describe('submitNewPassword', () => {
  const resetting = () =>
    vi.fn<(token: string, newPassword: string) => Promise<{ message: string }>>(async () => ({
      message: RESET_DONE,
    }))

  it('sets the new password with the link’s token, and says it is done', async () => {
    const reset = resetting()

    const result = await submitNewPassword(
      submitted({ newPassword: 'n3wPassword', confirmPassword: 'n3wPassword' }),
      reset,
    )

    expect(reset).toHaveBeenCalledWith(TOKEN, 'n3wPassword')
    expect(result).toEqual({ ok: true, message: RESET_DONE })
  })

  // A typo guard, not a security rule: the API is never sent the secret twice.
  it('stops at a confirmation that does not match, without calling the API', async () => {
    const reset = resetting()

    const result = await submitNewPassword(
      submitted({ newPassword: 'n3wPassword', confirmPassword: 'n3wPasswrod' }),
      reset,
    )

    expect(result).toEqual({ ok: false, error: PASSWORDS_DIFFER, recheck: false })
    expect(reset).not.toHaveBeenCalled()
  })

  it('does not call the API without a token', async () => {
    const reset = resetting()

    const result = await submitNewPassword(
      submitted({ newPassword: 'n3wPassword', confirmPassword: 'n3wPassword' }, ''),
      reset,
    )

    expect(result).toEqual({ ok: false, error: INCOMPLETE_LINK, recheck: false })
    expect(reset).not.toHaveBeenCalled()
  })

  // Shown beside the form: the password rule, "choose a different password",
  // or a link that expired while the form was open. Any of those could be the
  // link, so the page re-checks it.
  it('returns the API’s refusal verbatim, and asks for the link to be re-checked', async () => {
    const reused = 'Please choose a password different from your current one.'

    expect(await submitRefusedBy(new ApiError(422, { message: reused }))).toEqual({
      ok: false,
      error: reused,
      recheck: true,
    })
  })

  // An outage says nothing about the link, and re-checking during the same
  // outage would fail too — so no re-check is asked for.
  it('reports an unreachable server beside the form, without a re-check', async () => {
    expect(await submitRefusedBy(new NetworkError(null))).toEqual({
      ok: false,
      error: new NetworkError(null).message,
      recheck: false,
    })
  })

  it('reports a server failure beside the form, without a re-check', async () => {
    const failure = new ApiError(500, { message: 'Something went wrong.' })

    expect(await submitRefusedBy(failure)).toEqual({
      ok: false,
      error: 'Something went wrong.',
      recheck: false,
    })
  })
})

function submitRefusedBy(cause: Error) {
  const reset = vi.fn(async () => {
    throw cause
  })
  return submitNewPassword(
    submitted({ newPassword: 'n3wPassword', confirmPassword: 'n3wPassword' }),
    reset,
  )
}

describe('shouldRecheckLink', () => {
  // The reset spends the link. Checking it again would report — correctly —
  // that it has been used, and replace "done" with "that link didn't work".
  it('does not re-check a link the reset has just spent', () => {
    expect(
      shouldRecheckLink({
        actionResult: { ok: true, message: RESET_DONE },
        defaultShouldRevalidate: true,
      }),
    ).toBe(false)
  })

  // After the API refuses the submission the link may have gone bad meanwhile
  // (expired, or used in another tab); re-checking is what moves the page to
  // its invalid state.
  it('re-checks after the API refuses the submission', async () => {
    const actionResult = await submitRefusedBy(new ApiError(422, { message: INVALID_LINK }))

    expect(shouldRecheckLink({ actionResult, defaultShouldRevalidate: true })).toBe(true)
  })

  // The router re-runs the loader after every fetcher action. During an outage
  // that re-check fails too, and its error screen would replace the form — and
  // the passwords typed into it — with a retry that brings back an empty one.
  it('does not re-check after an unreachable server or a server failure', async () => {
    for (const cause of [new NetworkError(null), new ApiError(503, {})]) {
      const actionResult = await submitRefusedBy(cause)

      expect(shouldRecheckLink({ actionResult, defaultShouldRevalidate: true })).toBe(false)
    }
  })

  // Nothing was sent, so nothing about the link can have changed.
  it('does not re-check after a confirmation that does not match', async () => {
    const actionResult = await submitNewPassword(
      submitted({ newPassword: 'n3wPassword', confirmPassword: 'n3wPasswrod' }),
      vi.fn(),
    )

    expect(shouldRecheckLink({ actionResult, defaultShouldRevalidate: true })).toBe(false)
  })

  it('leaves anything other than a submission to the router', () => {
    expect(shouldRecheckLink({ defaultShouldRevalidate: true })).toBe(true)
    expect(shouldRecheckLink({ defaultShouldRevalidate: false })).toBe(false)
  })
})

describe('screenOf', () => {
  const ready: ResetLinkData = { state: 'ready', view: toResetLinkView(ORGANIZER) }

  it('shows the form, with no error, before anything is submitted', () => {
    expect(screenOf(ready, undefined)).toEqual({
      kind: 'ready',
      view: ready.view,
      error: null,
    })
  })

  it('keeps the form up with the refusal beside it', () => {
    expect(screenOf(ready, { ok: false, error: PASSWORDS_DIFFER, recheck: false })).toEqual({
      kind: 'ready',
      view: ready.view,
      error: PASSWORDS_DIFFER,
    })
  })

  // Done keeps the link's view, which is where the ONE right sign-in lives.
  it('reports done with the account’s own sign-in', () => {
    expect(screenOf(ready, { ok: true, message: RESET_DONE })).toEqual({
      kind: 'done',
      view: ready.view,
      message: RESET_DONE,
    })
  })

  it('shows an unusable link as such, whatever was submitted', () => {
    expect(
      screenOf({ state: 'invalid', error: INVALID_LINK }, { ok: false, error: 'x', recheck: true }),
    ).toEqual({ kind: 'invalid', error: INVALID_LINK })
  })
})
