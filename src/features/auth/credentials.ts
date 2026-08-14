import type { Persona } from '@/lib/persona'
import type { Credentials } from './types'

/**
 * The sign-in form, as `POST /auth/login` wants it.
 *
 * The workspace is the whole reason this is a named function rather than an
 * inline object: an attendee has one platform-wide realm, and naming a
 * workspace for them is refused with a 422 rather than ignored — so the field
 * is dropped here, at the one place both login pages go through, instead of
 * being trusted not to be filled in.
 */
export function credentialsOf(form: FormData, persona: Persona): Credentials {
  return {
    email: String(form.get('email') ?? ''),
    password: String(form.get('password') ?? ''),
    persona,
    ...workspaceOf(form, persona),
    // An unchecked box is absent from the form data entirely. Stated either
    // way, so "do not keep me signed in" is an answer rather than a silence.
    rememberMe: form.get('rememberMe') === 'on',
  }
}

/** The organizer's workspace, or nothing at all — never an empty string. */
function workspaceOf(form: FormData, persona: Persona): { orgSlug?: string } {
  if (persona === 'attendee') return {}
  const slug = String(form.get('orgSlug') ?? '').trim()
  return slug ? { orgSlug: slug } : {}
}
