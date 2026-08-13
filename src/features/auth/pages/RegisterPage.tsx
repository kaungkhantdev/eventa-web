import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { Icon, IconButton } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { SocialAuth } from '@/features/auth/components/SocialAuth'
import { STRENGTH_COLORS, STRENGTH_TEXTS, scorePassword } from '@/features/auth/data/passwordStrength'
import { authApi } from '@/features/auth/api'
import { messageOf } from '@/lib/api'

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const score = scorePassword(password)
  const cpwMatch = confirm === password

  /**
   * Registering does NOT sign anyone in: the API emails a confirmation link and
   * the account stays inert until that token is used. So the page ends on a
   * "check your email" state rather than navigating into the console.
   */
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    if (!cpwMatch) {
      setError('Those passwords do not match.')
      return
    }
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '')
    setPending(true)
    setError(null)
    try {
      await authApi.register({
        name: String(form.get('name') ?? ''),
        email,
        password,
      })
      setSentTo(email)
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setPending(false)
    }
  }

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
      <form className="space-y-4" onSubmit={onSubmit}>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        )}

        {sentTo && (
          <p
            role="status"
            className="rounded-lg bg-brand-soft px-3 py-2.5 text-[13px] text-brand-dark"
          >
            Check <span className="font-semibold">{sentTo}</span> for a link to confirm your account.
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

        <button type="submit" className="btn btn-primary w-full" disabled={pending || sentTo !== null}>
          {pending ? 'Creating…' : sentTo ? 'Check your email' : 'Create account'}
        </button>
      </form>

      {/* The kit offered only Google here and both providers on sign-in. Whichever
          way someone arrives, the same accounts should be on offer. */}
      <SocialAuth mode="sign-up" />
    </AuthLayout>
  )
}
