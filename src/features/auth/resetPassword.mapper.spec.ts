import { describe, expect, it } from 'vitest'
import { toResetLinkView } from './resetPassword.mapper'

/**
 * What the reset page says about the link it was opened with (US-ACC-04).
 *
 * The API answers `{ persona, workspaceName }` for a usable link. An organizer
 * with accounts in several workspaces gets one email per account, so the form
 * says which workspace it is resetting; an attendee's realm is the platform
 * organization, which is never named to them.
 */
describe('toResetLinkView', () => {
  it('names the organizer’s workspace in the heading', () => {
    expect(toResetLinkView({ persona: 'admin', workspaceName: 'Acme Events' }).heading).toBe(
      'Set a new password for Acme Events',
    )
  })

  it('uses a plain heading when the API names no workspace', () => {
    expect(toResetLinkView({ persona: 'admin', workspaceName: null }).heading).toBe(
      'Set a new password',
    )
  })

  // Nothing invented: a blank name would render "Set a new password for ".
  it('treats a blank workspace name as none, and trims a real one', () => {
    expect(toResetLinkView({ persona: 'admin', workspaceName: '   ' }).heading).toBe(
      'Set a new password',
    )
    expect(toResetLinkView({ persona: 'admin', workspaceName: ' Acme Events ' }).heading).toBe(
      'Set a new password for Acme Events',
    )
  })

  // The API sends null for an attendee. Should it ever send the platform
  // organization's name, an attendee must still not be shown it.
  it('never names a workspace to an attendee', () => {
    expect(toResetLinkView({ persona: 'attendee', workspaceName: 'Eventa' }).heading).toBe(
      'Set a new password',
    )
  })

  it('says which kind of account the form is for', () => {
    expect(toResetLinkView({ persona: 'admin', workspaceName: null }).subtitle).toBe(
      'Organizer account — choose a new password.',
    )
    expect(toResetLinkView({ persona: 'attendee', workspaceName: null }).subtitle).toBe(
      'Attendee account — choose a new password.',
    )
  })

  // One sign-in, the right one: the two audiences never share a login, and the
  // link knows whose account it is.
  it('points an organizer at the organizer sign-in', () => {
    expect(toResetLinkView({ persona: 'admin', workspaceName: 'Acme Events' }).signIn).toEqual({
      to: '/auth/login',
      label: 'Sign in to your organizer account',
    })
  })

  it('points an attendee at the portal sign-in', () => {
    expect(toResetLinkView({ persona: 'attendee', workspaceName: null }).signIn).toEqual({
      to: '/portal/login',
      label: 'Sign in to your attendee account',
    })
  })
})
