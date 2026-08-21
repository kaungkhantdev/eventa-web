import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '@/components/ui'
import { messageOf } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import { authApi } from '../api'
import { secondsRemaining, startCooldown } from '../resendCooldown'
import { AuthLayout } from './AuthLayout'

/**
 * Where sign-up ends, for either audience.
 *
 * The account exists but is inert until the emailed link is opened, so this
 * says exactly that and offers the two things that are actually useful next —
 * sign in once confirmed, or start again if the address was wrong.
 *
 * Presentational: the address and the destinations are given to it. Each
 * persona owns its own page and its own copy, and shares this shape so the two
 * cannot drift apart.
 */
export function CheckEmailNotice({
  email,
  subtitle,
  persona,
  signInPath,
  signUpPath,
  homeTo,
}: {
  /** Empty when the page is opened cold, with no navigation state to read. */
  email: string
  subtitle: string
  /** Which realm to resend for — the same address may hold both. */
  persona: Persona
  signInPath: string
  signUpPath: string
  homeTo?: string
}) {
  return (
    <AuthLayout
      title="Check your email"
      subtitle={subtitle}
      homeTo={homeTo}
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Wrong address?{' '}
          <Link to={signUpPath} className="font-semibold text-brand hover:underline">
            Sign up again
          </Link>
          .
        </p>
      }
    >
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="hgi-mail-01" size={30} />
        </span>

        {/* Named only when we actually know it. Opened cold — a bookmark, a new
            tab — there is no navigation state to read, and inventing an address
            would be worse than saying nothing. */}
        {email ? (
          <p className="mt-4 text-[13px] text-muted">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-ink">{email}</span>.
          </p>
        ) : (
          <p className="mt-4 text-[13px] text-muted">
            We sent a confirmation link to the address you signed up with.
          </p>
        )}

        <p className="mt-2 text-[12.5px] text-muted">
          Open it to activate your account. The link expires, and works once.
        </p>

        {/* Only offered when the address is known: without one there is
            nothing to send, and asking them to retype it here would be a
            second sign-up form wearing a different hat. */}
        {email && <ResendLink email={email} persona={persona} />}

        <Link to={signInPath} className="btn btn-soft mt-5 w-full">
          Go to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}

/**
 * "Didn't get it? Send it again", with the wait shown rather than enforced in
 * silence.
 *
 * The countdown is a courtesy — the API refuses a second send inside its own
 * window regardless — but it means somebody who did nothing wrong reads "in
 * 42s" instead of meeting an unexplained 429. It is read from storage, so a
 * reload does not hand out a fresh minute.
 */
function ResendLink({ email, persona }: { email: string; persona: Persona }) {
  const [waitSeconds, setWaitSeconds] = useState(() =>
    secondsRemaining(email, Date.now()),
  )
  const [sending, setSending] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  // One timer while there is something to count down, and none once there is
  // not: a page left open overnight should not tick every second until morning.
  useEffect(() => {
    if (waitSeconds === 0) return
    const timer = window.setInterval(
      () => setWaitSeconds(secondsRemaining(email, Date.now())),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [waitSeconds, email])

  async function resend() {
    if (sending || waitSeconds > 0) return
    setSending(true)
    setFailed(false)
    try {
      const { message } = await authApi.resendVerification({ email, persona })
      // Started on success only: a send that failed has consumed nothing, and
      // making them wait a minute to retry it would be a punishment for our bug.
      startCooldown(email, Date.now())
      setWaitSeconds(secondsRemaining(email, Date.now()))
      setNote(message)
    } catch (cause) {
      // Includes the API's own 429 wording, if its window and ours disagree.
      setFailed(true)
      setNote(messageOf(cause))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-4">
      <p className="text-[12.5px] text-muted">
        Didn’t get it?{' '}
        <button
          type="button"
          onClick={() => void resend()}
          disabled={sending || waitSeconds > 0}
          className="font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {sending ? 'Sending…' : 'Send it again'}
        </button>
        {waitSeconds > 0 && (
          <span className="text-muted"> — in {waitSeconds}s</span>
        )}
      </p>
      {note && (
        <p
          role={failed ? 'alert' : 'status'}
          className={failed ? 'mt-1.5 text-[12px] text-red-500' : 'mt-1.5 text-[12px] text-brand'}
        >
          {note}
        </p>
      )}
    </div>
  )
}
