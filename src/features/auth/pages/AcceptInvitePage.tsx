import { useState } from 'react'
import { Link, useActionData, useFetcher } from 'react-router'
import { Icon } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { PasswordInput } from '@/features/auth/components/PasswordInput'
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter'
import { MIN_PASSWORD_LENGTH } from '@/features/auth/passwordStrength'
import type { AcceptInviteResult } from '@/features/auth/acceptInvite.routes'

/**
 * The end of a teammate's invitation link (US-SET-11).
 *
 * "they appear as 'Invited' and receive a join link by email" — this is where
 * that link lands. There was no such page: the token was handed back in the
 * API's response, never emailed, and had nowhere to be opened.
 *
 * No loader. Unlike the password reset there is no "check this link" endpoint
 * — `POST /auth/accept-invite` either accepts the token or refuses it — so the
 * form is shown first and the API's refusal sits beside it.
 *
 * Composed from the kit's auth/forgot-password.html (shell, error banner,
 * footer) and auth/register.html (the password field, its meter and the
 * confirmation), class strings copied verbatim, as ResetPasswordPage is.
 */
export default function AcceptInvitePage() {
  const result = useActionData() as AcceptInviteResult | undefined
  if (result?.ok) return <Joined email={result.email} />
  return <SetPassword error={result?.error ?? null} />
}

function SetPassword({ error }: { error: string | null }) {
  const accept = useFetcher<AcceptInviteResult>()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const pending = accept.state !== 'idle'
  // The fetcher's own refusal wins while it has one; the action's is what a
  // full-page submit left behind.
  const shown = accept.data?.ok === false ? accept.data.error : error

  return (
    <AuthLayout
      title="Join your team on Eventa"
      subtitle="Set a password to accept your invitation."
      footer={<BackToSignIn />}
    >
      <accept.Form method="post" className="space-y-4">
        {shown && (
          <p
            role="alert"
            className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
          >
            {shown}
          </p>
        )}

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
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
          {pending ? 'Joining…' : 'Accept invitation'}
        </button>
      </accept.Form>
    </AuthLayout>
  )
}

/** The invitation is spent now, so this offers the way in rather than a retry. */
function Joined({ email }: { email: string }) {
  return (
    <AuthLayout
      title="You're in"
      subtitle={`${email} can now sign in to the workspace.`}
      footer={<BackToSignIn />}
    >
      <Link to="/auth/login" className="btn btn-primary w-full">
        Go to sign in
      </Link>
    </AuthLayout>
  )
}

/** forgot-password.html's footer. A teammate signs in on the admin side. */
function BackToSignIn() {
  return (
    <p className="mt-6 text-center text-[13px]">
      <Link
        to="/auth/login"
        className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
      >
        <Icon name="hgi-arrow-left-01" size={14} />
        Back to sign in
      </Link>
    </p>
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
