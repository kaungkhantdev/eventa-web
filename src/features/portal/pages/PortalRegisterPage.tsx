import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/cn'
import { Icon, IconButton } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import {
  MIN_PASSWORD_LENGTH,
  STRENGTH_COLORS,
  STRENGTH_TEXTS,
  scorePassword,
} from '@/features/auth/passwordStrength'
import { handoffOf } from '@/features/auth/signupHandoff'
import { useSignUp } from '@/features/auth/useSignUp'

/* Attendee sign-up — the portal's own, separate from the organizer sign-up at
   /auth/register, exactly as the two logins are separate. It creates a
   `persona = 'attendee'` account in the one platform organization and no
   workspace at all (US-DISC-08); the organizer page creates a workspace and its
   owner, which is the wrong thing entirely for somebody who just bought a
   ticket and cannot then sign in at /portal/login.

   No workspace field: an attendee has one platform-wide realm, and naming a
   workspace is refused with a 422 rather than ignored.

   A buyer arriving from their own order brings their name and email with them,
   carried in the router's history state rather than the query string — both are
   personal data, and a URL ends up in server logs, browser history and
   `Referer` headers.

   No Google or Apple button, for the same reason the portal sign-in has none:
   `POST /auth/social/attendee` needs an orgSlug the portal cannot name, and the
   account it would create lands in the wrong organization (open API defect).
   They come back when that is fixed. */
export default function PortalRegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const { pending, error, submit } = useSignUp('attendee')
  const handoff = handoffOf(useLocation().state)

  const score = scorePassword(password)
  const cpwMatch = confirm === password

  /**
   * Arrived from an order, so the address is not a free field.
   *
   * Tickets are found by matching `orders.buyer_email` to the account's email
   * on every read — there is no claim step that could repair a mismatch later.
   * Signing up as someone else therefore creates a real, working, permanently
   * empty account, and the person would have no way to tell what went wrong.
   *
   * `readOnly` rather than `disabled`: a disabled field is omitted from the
   * submitted FormData entirely, which would post an empty email. This one is
   * still submitted, still selectable, still readable by a screen reader.
   * Somebody who genuinely wants a different address can sign up from
   * /portal/register directly, where nothing is carried in and nothing is
   * fixed.
   */
  const fromOrder = handoff.email !== ''

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
            defaultValue={handoff.name}
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
            className={cn('input', fromOrder && 'cursor-not-allowed bg-canvas text-muted')}
            required
            defaultValue={handoff.email}
            readOnly={fromOrder}
            aria-describedby={fromOrder ? 'email-fixed' : undefined}
          />
          {fromOrder && (
            <p id="email-fixed" className="hint">
              Your tickets are matched to this address, so your account has to use it.
            </p>
          )}
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
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-hair accent-brand"
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
