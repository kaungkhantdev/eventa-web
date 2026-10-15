import { useState } from 'react'
import { Link, useFetcher, useLoaderData } from 'react-router'
import { cn } from '@/lib/cn'
import { Icon, IconButton } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import {
  MIN_PASSWORD_LENGTH,
  STRENGTH_COLORS,
  STRENGTH_TEXTS,
  scorePassword,
} from '@/features/auth/passwordStrength'
import { useSignUp } from '@/features/auth/useSignUp'
import { ClaimExists, ClaimForm, ClaimInvalid } from '../components/BookingClaim'
import { registerScreenOf } from '../portalRegister.mapper'
import type { ClaimRefusal, PortalRegisterData } from '../portalRegister.types'

/* Attendee sign-up — the portal's own, separate from the organizer sign-up at
   /auth/register, exactly as the two logins are separate. It creates a
   `persona = 'attendee'` account in the one platform organization and no
   workspace at all (US-DISC-08); the organizer page creates a workspace and its
   owner, which is the wrong thing entirely for somebody who just bought a
   ticket and cannot then sign in at /portal/login.

   No workspace field: an attendee has one platform-wide realm, and naming a
   workspace is refused with a 422 rather than ignored.

   Two modes (US-DISC-15). Opened directly, the email is empty and editable and
   the account is confirmed by email before it can be used. Opened from the
   one-time link emailed to a booking's address (`?claim=`), the link is that
   proof: the name and email are the booking's, shown fixed, only a password is
   asked for, and the person is signed in to My Events. Which one — and which
   screen of the second — is `registerScreenOf`'s call; the claim screens live
   in `BookingClaim`.

   No Google or Apple button, for the same reason the portal sign-in has none:
   `POST /auth/social/attendee` needs an orgSlug the portal cannot name, and the
   account it would create lands in the wrong organization (open API defect).
   They come back when that is fixed. */
export default function PortalRegisterPage() {
  const data = useLoaderData() as PortalRegisterData
  const claim = useFetcher<ClaimRefusal>()
  const screen = registerScreenOf(data, claim.data)

  if (screen.kind === 'claim') return <ClaimForm screen={screen} claim={claim} />
  if (screen.kind === 'exists') return <ClaimExists screen={screen} />
  if (screen.kind === 'invalid') return <ClaimInvalid screen={screen} />
  return <DirectSignUp />
}

/** The ordinary sign-up, submitted by `useSignUp` and confirmed by email. */
function DirectSignUp() {
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const { pending, error, submit } = useSignUp('attendee')

  const score = scorePassword(password)
  const cpwMatch = confirm === password

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Keep every ticket you book in one place."
      homeTo="/portal/discover"
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Already have an account?{' '}
          <Link to="/portal/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={(e) => submit(e, password, confirm)}>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor="full-name" className="label">
            Full name
          </label>
          <input
            id="full-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jordan Lee"
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="input pr-10"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <IconButton
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-1 top-1/2 -translate-y-1/2"
              title={showPw ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPw ? 'hgi-view-off-slash' : 'hgi-view'} size={16} />
            </IconButton>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-1 flex-1 gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-full flex-1 rounded-full transition-colors',
                    i >= score && 'bg-line',
                  )}
                  style={i < score ? { background: STRENGTH_COLORS[score as 1 | 2 | 3] } : undefined}
                />
              ))}
            </div>
            <span
              className="text-[11px] font-medium text-muted"
              style={score > 0 ? { color: STRENGTH_COLORS[score as 1 | 2 | 3] } : undefined}
            >
              {STRENGTH_TEXTS[score]}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="label">
            Confirm password
          </label>
          <div className="relative mt-1.5">
            <input
              id="confirm-password"
              type={showCpw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="input pr-10"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <IconButton
              onClick={() => setShowCpw((s) => !s)}
              className="absolute right-1 top-1/2 -translate-y-1/2"
              title={showCpw ? 'Hide password' : 'Show password'}
            >
              <Icon name={showCpw ? 'hgi-view-off-slash' : 'hgi-view'} size={16} />
            </IconButton>
          </div>
          {confirm && (
            <p className="hint" style={{ color: cpwMatch ? '#1ba770' : '#ef4444' }}>
              {cpwMatch ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-[13px] text-muted">
          <input
            id="terms"
            name="acceptTerms"
            type="checkbox"
            className="checkbox mt-0.5"
            required
          />
          I agree to the{' '}
          <a href="#" className="font-semibold text-brand hover:underline">
            Terms
          </a>{' '}
          &amp;{' '}
          <a href="#" className="font-semibold text-brand hover:underline">
            Privacy Policy
          </a>
        </label>

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
