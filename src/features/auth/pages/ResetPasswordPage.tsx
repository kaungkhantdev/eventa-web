import { useState } from 'react'
import { Link, useFetcher, useLoaderData, type FetcherWithComponents } from 'react-router'
import { Icon } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { PasswordInput } from '@/features/auth/components/PasswordInput'
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter'
import { MIN_PASSWORD_LENGTH } from '@/features/auth/passwordStrength'
import { forgotPathFor } from '@/features/auth/personas'
import type { ResetLinkView } from '@/features/auth/resetPassword.mapper'
import {
  screenOf,
  type ResetLinkData,
  type ResetResult,
} from '@/features/auth/resetPassword.routes'

/**
 * The end of the reset email's link (US-ACC-04).
 *
 * The kit has no screen for this; it is composed from auth/forgot-password.html
 * (the shell, the error banner and the "Back to sign in" footer) and
 * auth/register.html (the password field, its strength meter and the
 * confirmation), with their class strings copied verbatim.
 *
 * The loader has already checked the link, so this page only renders one of
 * three screens — which one is `screenOf`'s decision, not this file's.
 */
export default function ResetPasswordPage() {
  const link = useLoaderData() as ResetLinkData
  const reset = useFetcher<ResetResult>()
  const screen = screenOf(link, reset.data)

  if (screen.kind === 'invalid') return <Invalid error={screen.error} />
  if (screen.kind === 'done') return <Done view={screen.view} message={screen.message} />
  return <Ready view={screen.view} error={screen.error} reset={reset} />
}

/** The form. The confirmation is compared by the action, before the API. */
function Ready({
  view,
  error,
  reset,
}: {
  view: ResetLinkView
  error: string | null
  reset: FetcherWithComponents<ResetResult>
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const pending = reset.state !== 'idle'

  return (
    <AuthLayout title={view.heading} subtitle={view.subtitle} footer={<BackToSignIn view={view} />}>
      <reset.Form method="post" className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor="password" className="label">
            New password
          </label>
          <PasswordInput
            id="password"
            name="newPassword"
            value={password}
            onChange={setPassword}
            minLength={MIN_PASSWORD_LENGTH}
          />
          <PasswordStrengthMeter password={password} />
        </div>

        <div>
          <label htmlFor="confirm-password" className="label">
            Confirm password
          </label>
          <PasswordInput
            id="confirm-password"
            name="confirmPassword"
            value={confirm}
            onChange={setConfirm}
          />
          {confirm && <MatchHint matches={confirm === password} />}
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? 'Saving…' : 'Set new password'}
        </button>
      </reset.Form>
    </AuthLayout>
  )
}

/** register.html's `#cpw-hint`, colours and all — the kit writes them as hex. */
function MatchHint({ matches }: { matches: boolean }) {
  return (
    <p className="hint" style={{ color: matches ? '#1ba770' : '#ef4444' }}>
      {matches ? 'Passwords match' : 'Passwords do not match'}
    </p>
  )
}

/** forgot-password.html's footer, pointed at this account's own sign-in. */
function BackToSignIn({ view }: { view: ResetLinkView }) {
  return (
    <p className="mt-6 text-center text-[13px]">
      <Link
        to={view.signIn.to}
        className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
      >
        <Icon name="hgi-arrow-left-01" size={14} />
        Back to sign in
      </Link>
    </p>
  )
}

/**
 * Reset. The API's confirmation is shown as it is, and the one sign-in this
 * account uses is offered — the link knew whose it was, so there is nothing to
 * choose between.
 */
function Done({ view, message }: { view: ResetLinkView; message: string }) {
  return (
    <AuthLayout
      title="Password reset"
      subtitle="Your new password is ready to use."
      footer={null}
    >
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="hgi-checkmark-circle-02" size={30} />
        </span>
        <p role="status" className="mt-4 text-[13px] text-muted">
          {message}
        </p>
        <Link to={view.signIn.to} className="btn btn-primary mt-5 w-full">
          {view.signIn.label}
        </Link>
      </div>
    </AuthLayout>
  )
}

/**
 * A link that cannot be used — expired, already used, or incomplete.
 *
 * The API's own words, verbatim. A refused token says nothing about whose it
 * was, so the page cannot pick the right forgot-password form: the button
 * opens the default one (which itself offers the other audience), and the
 * footer names the attendee's form outright rather than leaving it to be found.
 */
function Invalid({ error }: { error: string }) {
  return (
    <AuthLayout
      title="That link didn’t work"
      subtitle="Reset links expire, and each one can only be used once."
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Resetting an attendee account?{' '}
          <Link
            to={forgotPathFor('attendee')}
            className="font-semibold text-brand hover:underline"
          >
            Request its link here
          </Link>
          .
        </p>
      }
    >
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <Icon name="hgi-alert-02" size={30} />
        </span>
        <p role="alert" className="mt-4 text-[13px] text-muted">
          {error}
        </p>
        <Link to={forgotPathFor('admin')} className="btn btn-primary mt-5 w-full">
          Request a new link
        </Link>
      </div>
    </AuthLayout>
  )
}
