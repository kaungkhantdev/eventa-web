import { useState } from 'react'
import { useFetcher } from 'react-router'
import { Panel } from '@/components/ui'
import { useSavedToast } from '@/lib/useSavedToast'
import type { ActionResult } from '@/app/loaders'
import { PASSWORD_CHANGE_INTENT } from '../myEvents.routes'
import { passwordsMismatch } from '../security.mapper'
import { PasswordField } from './PasswordField'

/** One form on one page, so the id can be quoted in a footer `form=`. */
const FORM_ID = 'portal-change-password'

/**
 * Changing the password (US-DISC-12, criterion 4).
 *
 * Behind a slide-over rather than inline on the card, which is the choice the
 * organizer console already made and worth keeping for the same two reasons: a
 * password form sitting open on a settings page invites the browser to offer to
 * fill it, and it leaves three password boxes on screen for anyone walking
 * past.
 *
 * The confirm box is compared here and nowhere else — a typo guard, not a
 * security rule. Every real rule is the server's: whether the current password
 * is right, how long the new one must be, and that it must differ from the old
 * one. Each comes back as the API's own sentence and is shown verbatim, because
 * those sentences were written for the person reading them.
 *
 * It also signs the account out on every OTHER device, which is the rest of
 * criterion 4 and happens whether or not anybody asked — so the form says so
 * before it is submitted rather than after.
 */
export function ChangePasswordPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const change = useFetcher<ActionResult>()
  const [mismatch, setMismatch] = useState(false)
  const error = change.data?.ok === false ? change.data.error : null
  const busy = change.state !== 'idle'

  useSavedToast(
    change.state === 'idle' && change.data?.ok === true,
    'Password changed. Your other devices have been signed out.',
    onClose,
  )

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    const differs = passwordsMismatch(new FormData(event.currentTarget))
    setMismatch(differs)
    // Nothing is sent: the API would be told the same secret twice to compare
    // it, and criterion 6 asks for a clear error and no change.
    if (differs) event.preventDefault()
  }

  return (
    <Panel
      open={open}
      onClose={onClose}
      title="Change password"
      subtitle="The password you sign in with."
      footer={
        <div className="flex w-full gap-2">
          <button type="button" className="btn btn-soft flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={FORM_ID} className="btn btn-primary flex-1" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </div>
      }
    >
      <change.Form id={FORM_ID} method="post" onSubmit={submit} className="space-y-4">
        <input type="hidden" name="intent" value={PASSWORD_CHANGE_INTENT} />

        <PasswordField
          id="portal-current-password"
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
        />
        <PasswordField
          id="portal-new-password"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters, with a number and a symbol."
        />
        <PasswordField
          id="portal-confirm-password"
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
        />

        {/* Said before the submit, not after: the API signs out this account's
            other devices as part of the change, and it is not optional. */}
        <p className="rounded-lg border border-hair bg-canvas px-3 py-2.5 text-[12px] leading-relaxed text-muted">
          Changing your password signs you out on every other device. This one stays signed in.
        </p>

        {mismatch && (
          <p role="alert" className="text-[12px] text-red-500">
            Those two do not match. Retype the new password.
          </p>
        )}
        {/* The API's own words — a wrong current password, a reused one. */}
        {error && (
          <p role="alert" className="text-[13px] text-red-500">
            {error}
          </p>
        )}
      </change.Form>
    </Panel>
  )
}
