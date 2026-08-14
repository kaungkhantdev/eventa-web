import { useState } from 'react'
import { Link } from 'react-router'
import { Icon, IconButton } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useSignIn } from '@/features/auth/useSignIn'

/* Attendee sign-in — the portal's own login, separate from the organizer
   login at /auth/login. It lands on "My tickets" (never the admin shell), and
   its footer nudges guests to browse events instead (registering for an event
   never requires an account).

   No workspace field: an attendee has one platform-wide realm, and naming a
   workspace is refused with a 422 rather than ignored.

   The static kit's Google and Apple buttons are gone rather than faked.
   `POST /auth/social/attendee` requires an orgSlug the portal has no way to
   name, so the call cannot be made correctly yet — and the account it would
   create lands in the wrong organization (open API defect). They come back
   when that is fixed. */
export default function PortalLoginPage() {
  const [showPw, setShowPw] = useState(false)
  const { pending, error, challenge, submit } = useSignIn('attendee')

  return (
    <AuthLayout
      title={challenge ? 'Enter your code' : 'Welcome back'}
      subtitle={
        challenge
          ? 'Open your authenticator app and enter the 6-digit code, or use a recovery code.'
          : 'Sign in to view your tickets and registrations.'
      }
      homeTo="/portal/discover"
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Just browsing?{' '}
          <Link to="/portal/discover" className="font-semibold text-brand hover:underline">
            Discover events
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        )}

        {challenge ? (
          <div>
            <label htmlFor="code" className="label">
              Authentication code
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="input tnum"
              autoFocus
              required
            />
          </div>
        ) : (
          <>
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
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pr-10"
                  required
                />
                <IconButton
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  title={showPw ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPw ? 'hgi-view-off-slash' : 'hgi-view'} size={16} />
                </IconButton>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="h-3.5 w-3.5 rounded border-hair accent-brand"
                />
                Remember me
              </label>
              <Link
                to="/auth/forgot-password?persona=attendee"
                className="text-[13px] font-semibold text-brand hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? 'Signing in…' : challenge ? 'Verify' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
