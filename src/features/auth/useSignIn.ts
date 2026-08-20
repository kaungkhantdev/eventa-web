import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { messageOf } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import type { WorkspaceOption } from './types'
import { authApi } from './api'
import { credentialsOf } from './credentials'
import { homeFor } from './personas'
import { safeRedirect } from './redirect'

/**
 * Signing in, for either audience.
 *
 * The organizer console and the attendee portal are separate products with
 * separate logins, but the *flow* is one thing: submit, maybe be asked for a
 * code, then land somewhere. Shared here so the second page cannot drift from
 * the first — the interesting differences (which fields exist, where you land)
 * are data, not another copy of this.
 */
export function useSignIn(persona: Persona) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Set when the password was right but a code is still owed (US-ACC-05). */
  const [challenge, setChallenge] = useState<string | null>(null)
  /**
   * Set when the password was right for more than one workspace — the same
   * address invited into two, with the same password in both. The form stays
   * on screen and grows a picker; submitting again names one.
   */
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([])

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const form = new FormData(e.currentTarget)
    setPending(true)
    setError(null)
    try {
      const result = challenge
        ? await authApi.completeTwoFactor(challenge, String(form.get('code') ?? ''))
        : await authApi.login(credentialsOf(form, persona))
      if (result.twoFactorRequired) {
        setChallenge(result.challengeToken)
        return
      }
      if ('chooseWorkspace' in result) {
        setWorkspaces(result.workspaces)
        return
      }
      navigate(safeRedirect(params.get('from'), homeFor(persona)), { replace: true })
    } catch (cause) {
      // The API writes these for the person reading them — show them verbatim
      // rather than inventing a generic "sign-in failed".
      setError(messageOf(cause))
    } finally {
      setPending(false)
    }
  }

  return { pending, error, challenge, workspaces, submit }
}
