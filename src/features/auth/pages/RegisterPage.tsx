import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { Icon, IconButton } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { STRENGTH_COLORS, STRENGTH_TEXTS, scorePassword } from '@/features/auth/data/passwordStrength'

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

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
      <form className="space-y-4" onSubmit={(e: FormEvent<HTMLFormElement>) => e.preventDefault()}>
        <div>
          <label htmlFor="full-name" className="label">
            Full name
          </label>
          <input
            id="full-name"
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

        <button type="submit" className="btn btn-primary w-full">
          Create account
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-hair" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">or</span>
        <div className="h-px flex-1 bg-hair" />
      </div>

      <button type="button" className="btn btn-soft w-full">
        <Icon name="hgi-global" size={16} />
        Sign up with Google
      </button>
    </AuthLayout>
  )
}
