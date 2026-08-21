import type { Persona } from '@/lib/persona'

/**
 * The sign-up form, as `POST /auth/register` wants it.
 *
 * The mirror of `credentialsOf`, and a named function for the same reason: the
 * workspace is the field that differs between the two audiences, and it is
 * dropped here — at the one place both sign-up pages go through — rather than
 * trusted not to be filled in. The API refuses a workspace for an attendee with
 * a 422 rather than ignoring it.
 *
 * The password is passed in rather than read from the form: the page holds it
 * in state to score its strength and to compare it with the confirmation.
 */
export interface SignUpInput {
  name: string
  email: string
  password: string
  organizationName?: string
  persona: Persona
  acceptTerms: boolean
}

export function signUpInputOf(
  form: FormData,
  persona: Persona,
  password: string,
): SignUpInput {
  return {
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    password,
    persona,
    ...workspaceOf(form, persona),
    // An unticked box is absent from the form data entirely. Passed through
    // rather than hard-coded: asserting somebody's consent on their behalf is
    // not this app's to make, and the API is what refuses when it is missing.
    acceptTerms: form.get('acceptTerms') === 'on',
  }
}

/**
 * The workspace the organizer named, or nothing at all — never an empty string.
 *
 * Absent matters: the API falls back to naming the workspace after the person
 * ("Jordan Lee's Workspace"), and a blank string would defeat that while still
 * satisfying its `@IsString()`.
 */
function workspaceOf(form: FormData, persona: Persona): { organizationName?: string } {
  if (persona === 'attendee') return {}
  const name = String(form.get('organizationName') ?? '').trim()
  return name ? { organizationName: name } : {}
}
