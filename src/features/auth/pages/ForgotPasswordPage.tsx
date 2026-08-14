import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { authApi } from '@/features/auth/api'
import { personaOfSearch, signInPathFor } from '@/features/auth/personas'
import { messageOf } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [params] = useSearchParams()
  // One page serves both audiences, and the API looks the address up in that
  // persona's realm — so an attendee arriving here without the flag would be
  // searched for among organizers and never found.
  const persona = personaOfSearch(params)
  const [email, setEmail] = useState('')
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sent = sentEmail !== null

  /**
   * The confirmation is shown for ANY address the API accepted — it answers
   * uniformly whether or not an account exists, so that this page cannot be
   * used to discover who is registered. Only a genuine failure (a malformed
   * address, an unreachable server) is surfaced.
   */
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending || sent) return
    setPending(true)
    setError(null)
    try {
      await authApi.forgotPassword(email, persona)
      setSentEmail(email || 'that email')
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link."
      footer={
        <p className="mt-6 text-center text-[13px]">
          <Link
            to={signInPathFor(persona)}
            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
          >
            <Icon name="hgi-arrow-left-01" size={14} />
            Back to sign in
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
          disabled={sent || pending}
          className={cn(
            'btn btn-primary w-full',
            (sent || pending) && 'opacity-60 cursor-not-allowed',
          )}
        >
          <Icon name={sent ? 'hgi-checkmark-circle-02' : 'hgi-mail-send-01'} size={16} />
          <span>{sent ? 'Link sent' : pending ? 'Sending…' : 'Send reset link'}</span>
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
