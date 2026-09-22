import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { authApi } from '@/features/auth/api'
import {
  accountLabelFor,
  forgotPathFor,
  otherPersona,
  personaOfSearch,
  signInPathFor,
} from '@/features/auth/personas'
import {
  RESEND_COOLDOWN_MS,
  secondsRemaining,
  startCooldown,
} from '@/features/auth/resendCooldown'
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
  // The address on screen is the one the confirmation is about. Editing it
  // re-arms the form: the likeliest reason to touch it after sending is that
  // the first try was mistyped, and a button stuck on "Link sent" would leave
  // no way to send to the corrected address.
  const sent = sentEmail !== null && sentEmail === email

  // Seeded with the full minute rather than read from the clock: the purity
  // rule keeps Date.now() out of anything the compiler cannot prove is a
  // handler, and the constant is what a fresh acceptance means anyway. The
  // timer below immediately corrects it from the written-down deadline.
  const [waitSeconds, setWaitSeconds] = useState(0)

  // One timer while there is something to count down, and none once there is
  // not: a page left open overnight should not tick every second until morning.
  // The FIRST tick also writes the deadline down (see resendCooldown — it is
  // what survives a reload); a second of lag on that is invisible, and the
  // callback is off the render path where the clock is allowed.
  useEffect(() => {
    if (!sent || waitSeconds === 0) return
    const arm = () => {
      if (secondsRemaining(email, Date.now(), undefined, 'reset') === 0) {
        startCooldown(email, Date.now(), undefined, 'reset')
      }
    }
    const tick = () =>
      setWaitSeconds(secondsRemaining(email, Date.now(), undefined, 'reset'))
    const armer = window.setTimeout(arm, 0)
    const timer = window.setInterval(tick, 1000)
    return () => {
      window.clearTimeout(armer)
      window.clearInterval(timer)
    }
  }, [sent, waitSeconds, email])

  /**
   * The confirmation is shown only when the API accepted, which it does only
   * when a link really went out. Every reason it could not send one — no
   * account in this audience, an account that signs in with a social provider,
   * one that is unconfirmed, invited or suspended, too many attempts — comes
   * back as a refusal whose message is written for the person reading it, so
   * it is shown verbatim rather than paraphrased (US-ACC-04).
   *
   * The same handler serves "send it again": the API treats a repeat request
   * as a fresh one, and the cool-off between them is read from storage so a
   * reload cannot hand out a fresh minute.
   */
  async function send() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await authApi.forgotPassword(email, persona)
      // Full minute on acceptance; the timer effect writes the deadline down
      // and keeps this corrected against it from then on.
      setWaitSeconds(RESEND_COOLDOWN_MS / 1000)
      setSentEmail(email)
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      // Names the realm up front, so people pick the right form before they
      // ask. Organizer and attendee accounts are separate, and the lookup only
      // searches this one: an attendee asking here is told that no organizer
      // account uses the address — true, but a detour they could have skipped.
      subtitle={`${accountLabelFor(persona)} — enter your email and we'll send a reset link.`}
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
      <form
        className="space-y-4"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault()
          if (!sent) void send()
        }}
      >
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

        {sent && (
          <div className="flex items-start gap-2 rounded-lg bg-brand-soft px-3 py-2.5 text-[12px] text-brand-dark">
            <Icon name="hgi-checkmark-circle-02" size={15} className="mt-0.5 shrink-0" />
            {/* Said plainly: the API only accepts when a link was sent, so there
                is no "if an account matches" left to hedge (US-ACC-04). */}
            <span>
              Check your inbox — a reset link is on its way to <strong>{sentEmail}</strong>.
              Nothing arriving? Check spam, or send it again below.
            </span>
          </div>
        )}

        {/* Always here — before sending, after sending, for every address —
            so the other form is one click away before anybody has to be told
            that this one has no account for them. */}
        <p className="text-[12.5px] text-muted">
          {persona === 'admin' ? 'Bought tickets rather than run events?' : 'Run events here?'}{' '}
          <Link
            to={forgotPathFor(otherPersona(persona))}
            className="font-semibold text-brand hover:underline"
          >
            Reset your {accountLabelFor(otherPersona(persona)).toLowerCase()}
          </Link>{' '}
          instead — the two are separate, and a reset asks only about this one.
        </p>

        {/* The wait is shown rather than enforced in silence: the API refuses a
            rapid repeat regardless, and "in 42s" reads better than a bare 429. */}
        {sent && (
          <p className="text-[12.5px] text-muted">
            Didn&rsquo;t get it?{' '}
            <button
              type="button"
              onClick={() => void send()}
              disabled={pending || waitSeconds > 0}
              className="font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              {pending ? 'Sending…' : 'Send it again'}
            </button>
            {waitSeconds > 0 && <span className="text-muted"> — in {waitSeconds}s</span>}
          </p>
        )}
      </form>
    </AuthLayout>
  )
}
