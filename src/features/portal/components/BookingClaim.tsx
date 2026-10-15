import { useState } from 'react'
import { Link, type FetcherWithComponents } from 'react-router'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { PasswordInput } from '@/features/auth/components/PasswordInput'
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter'
import { MIN_PASSWORD_LENGTH } from '@/features/auth/passwordStrength'
import { signInPathFor } from '@/features/auth/personas'
import { useFailureToast } from '@/lib/useSavedToast'
import type { ClaimRefusal, RegisterScreen } from '../portalRegister.types'

/**
 * The attendee sign-up opened from the link emailed to a booking's address
 * (US-DISC-15): its form, and the two ways a link can turn out not to be
 * usable. Which one shows is `registerScreenOf`'s decision, not this file's.
 *
 * Composed from the kit's auth/register.html — the same fields, class strings
 * and terms box as the ordinary sign-up beside it — and, for the refusals,
 * the reset page's centred notice.
 */

const HOME = '/portal/discover'

type ClaimScreen = Extract<RegisterScreen, { kind: 'claim' }>

/**
 * Only a password, its confirmation and the terms are fields. The name and
 * email are the booking's and are shown fixed — read-only and unnamed, so they
 * are never submitted: the API takes the address from the link and the name
 * from the order, and refuses either from a client.
 */
export function ClaimForm({
  screen,
  claim,
}: {
  screen: ClaimScreen
  claim: FetcherWithComponents<ClaimRefusal>
}) {
  const pending = claim.state !== 'idle'
  // Announced as well as shown, as the ordinary sign-up's refusals are. Gated
  // on the request having settled, so the same refusal twice announces twice.
  useFailureToast(pending ? null : screen.error)

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Choose a password — your name and email come from your booking."
      homeTo={HOME}
      footer={<SignInInstead question="Already have an account?" />}
    >
      <claim.Form method="post" className="space-y-4">
        {screen.error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
          >
            {screen.error}
          </p>
        )}

        <Fixed id="full-name" label="Full name" value={screen.name} autoComplete="name" />
        <Fixed
          id="email"
          label="Email"
          value={screen.email}
          autoComplete="username"
          hint="Your booking was sent here, and your tickets are matched to it."
        />

        <NewPasswordFields />

        <TermsBox />

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </claim.Form>
    </AuthLayout>
  )
}

/**
 * The password and its confirmation — the ordinary sign-up's two fields, with
 * its strength meter and its match hint. The comparison here only tidies the
 * screen; the action compares them again before anything is sent.
 */
function NewPasswordFields() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  return (
    <>
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
        {confirm && (
          <p className="hint" style={{ color: confirm === password ? '#1ba770' : '#ef4444' }}>
            {confirm === password ? 'Passwords match' : 'Passwords do not match'}
          </p>
        )}
      </div>
    </>
  )
}

/**
 * A value that is not the person's to change, shown as a field would be.
 * `readOnly` rather than `disabled` so it stays selectable and is read by a
 * screen reader; no `name`, so it is never part of the submission. Its
 * `autoComplete` still lets a password manager file the new password under
 * the right address.
 */
function Fixed({
  id,
  label,
  value,
  autoComplete,
  hint,
}: {
  id: string
  label: string
  value: string
  autoComplete: string
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        autoComplete={autoComplete}
        className="input cursor-not-allowed bg-canvas text-muted"
        value={value}
        readOnly
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      )}
    </div>
  )
}

/** The consent every attendee sign-up asks for — the ordinary form's box, verbatim. */
function TermsBox() {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-[13px] text-muted">
      <input id="terms" name="acceptTerms" type="checkbox" className="checkbox mt-0.5" required />
      I agree to the{' '}
      <a href="#" className="font-semibold text-brand hover:underline">
        Terms
      </a>{' '}
      &amp;{' '}
      <a href="#" className="font-semibold text-brand hover:underline">
        Privacy Policy
      </a>
    </label>
  )
}

/**
 * The address already has an account — this link has been used, or was never
 * needed. Offered only sign-in, never a second account.
 */
export function ClaimExists({ screen }: { screen: Extract<RegisterScreen, { kind: 'exists' }> }) {
  return (
    <AuthLayout
      title="You already have an account"
      subtitle="Your tickets are waiting on My Events."
      homeTo={HOME}
      footer={null}
    >
      <Notice icon="hgi-user-check-01" tone="brand" text={screen.message} />
      <Link to={screen.signInTo} className="btn btn-primary mt-5 w-full">
        Sign in instead
      </Link>
    </AuthLayout>
  )
}

/**
 * A link that cannot be used — expired, used, or never valid. The API's own
 * words, and the way back: a new link comes from the booking confirmation,
 * which this page cannot name, and somebody who has already chosen a password
 * only needs to sign in.
 */
export function ClaimInvalid({
  screen,
}: {
  screen: Extract<RegisterScreen, { kind: 'invalid' }>
}) {
  return (
    <AuthLayout
      title="That link didn’t work"
      subtitle="Account links expire, and each one can only be used once."
      homeTo={HOME}
      footer={null}
    >
      <Notice icon="hgi-alert-02" tone="rose" text={screen.error} alert />
      <p className="mt-3 text-center text-[13px] text-muted">{screen.advice}</p>
      <Link to={screen.signInTo} className="btn btn-primary mt-5 w-full">
        Sign in
      </Link>
    </AuthLayout>
  )
}

const NOTICE_TONES = {
  brand: 'bg-brand-soft text-brand',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
} as const

/** The reset page's centred notice: an icon in a disc, and one sentence. */
function Notice({
  icon,
  tone,
  text,
  alert = false,
}: {
  icon: string
  tone: keyof typeof NOTICE_TONES
  text: string
  alert?: boolean
}) {
  return (
    <div className="text-center">
      <span className={cn('mx-auto grid h-14 w-14 place-items-center rounded-full', NOTICE_TONES[tone])}>
        <Icon name={icon} size={30} />
      </span>
      <p role={alert ? 'alert' : undefined} className="mt-4 text-[13px] text-muted">
        {text}
      </p>
    </div>
  )
}

function SignInInstead({ question }: { question: string }) {
  return (
    <p className="mt-6 text-center text-[13px] text-muted">
      {question}{' '}
      <Link to={signInPathFor('attendee')} className="font-semibold text-brand hover:underline">
        Sign in
      </Link>
    </p>
  )
}
