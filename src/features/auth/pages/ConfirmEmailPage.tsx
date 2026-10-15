import { Link, useLoaderData } from 'react-router'
import { Icon } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import type { ConfirmEmailData } from '@/features/auth/confirmEmail.routes'

/**
 * The end of the email-change link (US-SET-01, US-DISC-11).
 *
 * The loader has already confirmed the new address, so this page only reports
 * what happened. The token does not say which audience the account belongs to,
 * so somebody who is not signed in here is offered both sign-ins by name rather
 * than sent to a guessed one — the same choice `/verify-email` makes.
 */
export default function ConfirmEmailPage() {
  const data = useLoaderData() as ConfirmEmailData

  return data.ok ? (
    <Confirmed email={data.email} next={data.next} />
  ) : (
    <Failed error={data.error} />
  )
}

function SignInChoice() {
  return (
    <p className="mt-6 text-center text-[13px] text-muted">
      Sign in{' '}
      <Link to="/portal/login" className="font-semibold text-brand hover:underline">
        as an attendee
      </Link>{' '}
      or{' '}
      <Link to="/auth/login" className="font-semibold text-brand hover:underline">
        as an organizer
      </Link>
      .
    </p>
  )
}

function Confirmed({ email, next }: { email: string; next: string | null }) {
  return (
    <AuthLayout
      title="Email confirmed"
      subtitle={`You now sign in with ${email}.`}
      footer={next ? null : <SignInChoice />}
    >
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="hgi-checkmark-circle-02" size={30} />
        </span>
        {next && (
          <Link to={next} className="btn btn-primary mt-5 w-full">
            Continue
          </Link>
        )}
      </div>
    </AuthLayout>
  )
}

/** The API's own wording, shown verbatim — it is written for the person reading it. */
function Failed({ error }: { error: string }) {
  return (
    <AuthLayout
      title="That link didn’t work"
      subtitle="Your email has not changed, and your current address still signs you in."
      footer={<SignInChoice />}
    >
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <Icon name="hgi-alert-02" size={30} />
        </span>
        <p role="alert" className="mt-4 text-[13px] text-muted">
          {error}
        </p>
      </div>
    </AuthLayout>
  )
}
