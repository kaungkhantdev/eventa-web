import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Icon, IconButton } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { authApi } from '@/features/auth/api'

/** Where an organizer lands once they are in. */
const HOME = '/admin/dashboard'

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [showPw, setShowPw] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Set when the password was right but a code is still owed (US-ACC-05). */
  const [challenge, setChallenge] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const form = new FormData(e.currentTarget)
    setPending(true)
    setError(null)
    try {
      const result = challenge
        ? await authApi.completeTwoFactor(challenge, String(form.get('code') ?? ''))
        : await authApi.login({
            email: String(form.get('email') ?? ''),
            password: String(form.get('password') ?? ''),
            orgSlug: String(form.get('orgSlug') ?? '').trim() || undefined,
            rememberMe: form.get('rememberMe') === 'on',
          })
      if (result.twoFactorRequired) {
        setChallenge(result.challengeToken)
        return
      }
      // Back where they were headed when the guard stopped them. Only a
      // same-site path is honoured — a `from` of `//evil.example` would
      // otherwise turn this into an open redirect.
      const from = params.get('from')
      navigate(from?.startsWith('/') && !from.startsWith('//') ? from : HOME, {
        replace: true,
      })
    } catch (cause) {
      // The API writes these for the person reading them — show them verbatim
      // rather than inventing a generic "sign-in failed".
      setError(cause instanceof Error ? cause.message : 'Sign-in failed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout
      title={challenge ? 'Enter your code' : 'Welcome back'}
      subtitle={
        challenge
          ? 'Open your authenticator app and enter the 6-digit code, or use a recovery code.'
          : 'Sign in to manage your events and registrations.'
      }
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Don't have an account?{' '}
          <Link to="/auth/register" className="font-semibold text-brand hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
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
              <label htmlFor="orgSlug" className="label">
                Workspace
              </label>
              <input
                id="orgSlug"
                name="orgSlug"
                autoComplete="organization"
                placeholder="acme"
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label mb-0">
                  Password
                </label>
              </div>
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
                to="/auth/forgot-password"
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

      {!challenge && (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-hair" />
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">or</span>
            <div className="h-px flex-1 bg-hair" />
          </div>

          <div className="space-y-2.5">
            <button type="button" className="btn btn-soft w-full">
              <Icon name="hgi-global" size={16} />
              Continue with Google
            </button>
            <button type="button" className="btn btn-soft w-full">
              <Icon name="hgi-global" size={16} />
              Continue with LinkedIn
            </button>
          </div>
        </>
      )}
    </AuthLayout>
  )
}
