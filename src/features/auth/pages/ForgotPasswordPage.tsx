import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const sent = sentEmail !== null

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSentEmail(email || 'that email')
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link."
      footer={
        <p className="mt-6 text-center text-[13px]">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
          >
            <Icon name="hgi-arrow-left-01" size={14} />
            Back to sign in
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={sent}
          className={cn('btn btn-primary w-full', sent && 'opacity-60 cursor-not-allowed')}
        >
          <Icon name={sent ? 'hgi-checkmark-circle-02' : 'hgi-mail-send-01'} size={16} />
          <span>{sent ? 'Link sent' : 'Send reset link'}</span>
        </button>

        <div
          className={cn(
            sent ? 'flex' : 'hidden',
            'items-start gap-2 rounded-lg bg-brand-soft px-3 py-2.5 text-[12px] text-brand-dark',
          )}
        >
          <Icon name="hgi-checkmark-circle-02" size={15} className="mt-0.5 shrink-0" />
          <span>
            Check your inbox — if an account matches <strong>{sentEmail ?? 'that email'}</strong>, a
            reset link is on its way.
          </span>
        </div>
      </form>
    </AuthLayout>
  )
}
