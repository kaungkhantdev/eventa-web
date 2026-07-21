import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Icon, IconButton } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    navigate('/admin/dashboard')
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your events and registrations."
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
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
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
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-hair accent-brand" />
            Remember me
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-[13px] font-semibold text-brand hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Sign in
        </button>
      </form>

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
    </AuthLayout>
  )
}
