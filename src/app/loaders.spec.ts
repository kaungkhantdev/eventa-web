import { describe, expect, it, vi } from 'vitest'
import { actionSuccess, pageAction } from './loaders'

/*
 * Why an action may answer with data at all, when this app's rule is that the
 * API is the source of truth and a mutation is followed by revalidation.
 *
 * Almost always that rule is right and an action should report only `ok`. But
 * `POST /me/two-factor/start` answers with a one-time secret and its otpauth
 * URI, and `POST /me/two-factor/confirm` answers with the recovery codes —
 * neither of which any GET will ever return again. There is nothing to
 * revalidate: the answer exists once, in that response.
 *
 * `guardedAction` discarded it (`return { ok: true }`), so the console's
 * enrolment screen read `act.data.secret` as `undefined` for every render, the
 * QR never appeared, and the recovery codes criterion 5 asks for were thrown
 * away. That is why this exists.
 */
describe('actionSuccess', () => {
  it('reports success on its own when the action answered with nothing', () => {
    expect(actionSuccess(undefined)).toEqual({ ok: true })
  })

  it('carries through an answer no later read could reproduce', () => {
    expect(actionSuccess({ secret: 'S3CR3T', otpauthUri: 'otpauth://x' })).toEqual({
      ok: true,
      secret: 'S3CR3T',
      otpauthUri: 'otpauth://x',
    })
  })

  // A payload must not be able to claim the action failed, or an API answering
  // with a field called `ok` would invert the result the caller branches on.
  it('does not let a payload overwrite the outcome', () => {
    expect(actionSuccess({ ok: false, error: 'not really' })).toEqual({ ok: true })
  })

  it.each([null, 'a string', 42, ['a', 'b']])(
    'ignores %p, which is not a payload of named fields',
    (value) => {
      expect(actionSuccess(value)).toEqual({ ok: true })
    },
  )
})

/*
 * And that the guard actually USES it. Reverting `guardedAction` to a bare
 * `{ ok: true }` left every `actionSuccess` test above green, because they
 * cover the rule and not the one line that applies it — the same gap that let
 * the original bug ship.
 */
describe('pageAction', () => {
  it('carries the action’s answer back to the page', async () => {
    // A minimal store rather than switching this file to jsdom: `session` only
    // reads three keys, and the guard needs the persona to match.
    const store: Record<string, string> = {
      'eventa.persona': 'admin',
      'eventa.accessToken': 'stub',
    }
    vi.stubGlobal('window', {
      // `session.read` goes through `window.localStorage`, and `signIn` reads
      // `window.location` on the redirect path this case must not take.
      localStorage: { getItem: (k: string) => store[k] ?? null },
      location: { pathname: '/admin/settings', search: '' },
    })

    const run = pageAction(() => Promise.resolve({ secret: 'S3CR3T' }))
    const result = await run({ request: new Request('http://x/'), params: {} })

    expect(result).toEqual({ ok: true, secret: 'S3CR3T' })
  })
})
