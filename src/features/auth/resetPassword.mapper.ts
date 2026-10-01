import type { Persona } from '@/lib/persona'
import type { ResetLinkCheck } from './api'
import { accountLabelFor, signInPathFor } from './personas'

/**
 * What the reset page says about a usable link (US-ACC-04), from the API's
 * `{ persona, workspaceName }`.
 */
export interface ResetLinkView {
  /** Names the workspace when the account has one the person chose. */
  heading: string
  /** Which kind of account the form is for. */
  subtitle: string
  /** The one sign-in this account uses — where the page sends them after. */
  signIn: { to: string; label: string }
}

const HEADING = 'Set a new password'

export function toResetLinkView(link: ResetLinkCheck): ResetLinkView {
  const workspace = workspaceOf(link)
  const account = accountLabelFor(link.persona)
  return {
    heading: workspace ? `${HEADING} for ${workspace}` : HEADING,
    subtitle: `${account} — choose a new password.`,
    signIn: signInOf(link.persona),
  }
}

/**
 * The workspace to name, or nothing.
 *
 * An organizer with accounts in several workspaces gets one link per account,
 * so naming it is how they know which one this is. An attendee's realm is the
 * platform organization — a detail of storage they never chose — so it is not
 * named even if it arrives. A blank name is no name.
 */
function workspaceOf(link: ResetLinkCheck): string | null {
  if (link.persona !== 'admin') return null
  return link.workspaceName?.trim() || null
}

function signInOf(persona: Persona): ResetLinkView['signIn'] {
  return {
    to: signInPathFor(persona),
    label: `Sign in to your ${accountLabelFor(persona).toLowerCase()}`,
  }
}
