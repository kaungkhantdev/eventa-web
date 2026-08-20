import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { messageOf } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import { authApi } from './api'
import { checkEmailPathFor } from './personas'
import { signUpInputOf } from './signUpInput'

/**
 * Signing up, for either audience.
 *
 * The organizer console and the attendee portal have separate sign-up screens —
 * different copy, different promise, different realm — but the *flow* is one
 * thing: submit, then go and read your email. Shared here so the second page
 * cannot drift from the first, the same arrangement as `useSignIn`.
 *
 * Signing up does NOT sign anyone in: the API emails a confirmation link and
 * the account is inert until that token is used. So this navigates to a
 * "check your email" page rather than leaving somebody on a form whose fields
 * no longer do anything.
 *
 * The address travels in history state, never the query string — it is personal
 * data, and a URL reaches server logs, browser history and `Referer` headers.
 *
 * The persona is passed to the API, never inferred there: an account created in
 * the wrong realm cannot sign in at the page that offered it.
 */
export function useSignUp(persona: Persona) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent<HTMLFormElement>, password: string, confirm: string) {
    e.preventDefault()
    if (pending) return
    if (password !== confirm) {
      setError('Those passwords do not match.')
      return
    }
    const form = new FormData(e.currentTarget)
    const input = signUpInputOf(form, persona, password)
    setPending(true)
    setError(null)
    try {
      await authApi.register(input)
      // `replace`, so Back returns to wherever they came from rather than to a
      // sign-up form for an account that now exists.
      navigate(checkEmailPathFor(persona), {
        replace: true,
        state: { email: input.email },
      })
    } catch (cause) {
      // The API writes these for the person reading them — shown verbatim
      // rather than replaced with a generic "sign-up failed".
      setError(messageOf(cause))
    } finally {
      setPending(false)
    }
  }

  return { pending, error, submit }
}
