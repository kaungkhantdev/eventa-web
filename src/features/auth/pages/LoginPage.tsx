import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Icon, IconButton } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { SocialAuth } from '@/features/auth/components/SocialAuth'
import { useSignIn } from '@/features/auth/useSignIn'
import { ORG_PARAM } from '@/features/auth/verifiedSignIn'

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)
  const { pending, error, challenge, workspaces, submit: onSubmit } = useSignIn('admin')
  /**
   * Sign-in no longer asks which workspace: the slug is generated at sign-up
   * and shown nowhere, so it was the one thing nobody could answer. The
   * password resolves it instead, and this is sent only when somebody arrives
   * from their confirmation email — which already knows the answer.
   */
  const [params] = useSearchParams()
  const workspace = params.get(ORG_PARAM) ?? ''

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
            {/* Only when the API asked. The password fits several workspaces
                — the same address invited into two, with the same password in
                both — so it is the one case anybody has to answer, and by then
                they have already proved the credentials are theirs. */}
            {workspaces.length > 0 ? (
              <div>
                <label htmlFor="orgSlug" className="label">
                  Which workspace?
                </label>
                <select id="orgSlug" name="orgSlug" className="select" required>
                  {workspaces.map((w) => (
                    <option key={w.slug} value={w.slug}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              // Known only when they came from their confirmation email; that
              // link carries the slug so they never see a picker at all.
              workspace && <input type="hidden" name="orgSlug" value={workspace} />
            )}

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
                  className="checkbox"
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

      {!challenge && <SocialAuth mode="sign-in" />}
    </AuthLayout>
  )
}
