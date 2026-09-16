import { useState } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { Icon, IconButton } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { SocialAuth } from '@/features/auth/components/SocialAuth'
import {
  MIN_PASSWORD_LENGTH,
  STRENGTH_COLORS,
  STRENGTH_TEXTS,
  scorePassword,
} from '@/features/auth/passwordStrength'
import { useSignUp } from '@/features/auth/useSignUp'

/**
 * Organizer sign-up — a workspace and its first owner (US-ACC-01).
 *
 * The attendee's own sign-up is a separate page at `/portal/register`, the same
 * arrangement as the two logins: different audience, different promise, and a
 * different realm on the API. The flow they share lives in `useSignUp`.
 */
export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const { pending, error, submit } = useSignUp('admin')

  const score = scorePassword(password)
  const cpwMatch = confirm === password

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start selling tickets and managing registrations in minutes."
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-brand font-semibold hover:underline">
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

        {/* Named here, or the API falls back to "<your name>'s Workspace" and
            slugifies that — a slug nobody chose, nobody was told, and which
            sign-in then asks for by heart. */}
        <div>
          <label htmlFor="organization-name" className="label">
            Workspace name
          </label>
          <input
            id="organization-name"
            name="organizationName"
            type="text"
            autoComplete="organization"
            placeholder="Acme Events"
            className="input"
            required
          />
          <p className="mt-1.5 text-[12px] text-muted">
            Your company or team — attendees see this on tickets and receipts.
          </p>
        </div>

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

      {/* The kit offered only Google here and both providers on sign-in. Whichever
          way someone arrives, the same accounts should be on offer. */}
      <SocialAuth mode="sign-up" />
    </AuthLayout>
  )
}
