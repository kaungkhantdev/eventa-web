import { Link, useLoaderData } from 'react-router'
import { Icon } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { signInLinkFor } from '@/features/auth/verifiedSignIn'
import type { VerifyEmailData } from '@/features/auth/verifyEmail.routes'
import type { VerifiedEmail } from '@/features/auth/api'

/**
 * The end of the sign-up email's link (US-ACC-01, US-DISC-08).
 *
 * The loader has already activated the account, so this page only reports what
 * happened and points at the right sign-in — which differs by persona, and is
 * decided by `signInLinkFor` rather than here.
 */
export default function VerifyEmailPage() {
  const data = useLoaderData() as VerifyEmailData

  return data.ok ? <Confirmed verified={data.verified} /> : <Failed error={data.error} />
}

function Confirmed({ verified }: { verified: VerifiedEmail }) {
  const attendee = verified.persona === 'attendee'

  return (
    <AuthLayout
      title="Email confirmed"
      subtitle={
        attendee
          ? 'Your account is ready — sign in to find every ticket you book in one place.'
          : 'Your account is ready. Sign in to get started.'
      }
      homeTo={attendee ? '/portal/discover' : '/'}
      footer={null}
    >
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="hgi-checkmark-circle-02" size={30} />
        </span>

        {/* The slug used to be printed here, because the sign-in form asked
            for it and this was the only place anyone was ever told. Sign-in
            takes an email and a password now, so showing somebody a generated
            string they never chose and no longer need is just noise.

            The link still carries it — see signInLinkFor — which costs nothing
            and skips the workspace picker for the rare account that would
            otherwise see one. */}
        <Link to={signInLinkFor(verified)} className="btn btn-primary mt-5 w-full">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  )
}

/**
 * A link that did not work.
 *
 * The API's own wording, shown verbatim — it is written for the person reading
 * it. Both endings lead somewhere: a dead end here is somebody who cannot get
 * into the account they just created.
 *
 * A failed token decodes to nothing, so this page does NOT know which audience
 * is holding it — and guessing would send an attendee to the organizer sign-up,
 * which creates a workspace they never wanted and cannot sign in to. Both are
 * offered by name instead. Naming them is honest; picking one is not.
 */
function Failed({ error }: { error: string }) {
  return (
    <AuthLayout
      title="That link didn’t work"
      subtitle="Confirmation links expire, and each one can only be opened once."
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Sign up again with the same address —{' '}
          <Link to="/portal/register" className="font-semibold text-brand hover:underline">
            as an attendee
          </Link>{' '}
          or{' '}
          <Link to="/auth/register" className="font-semibold text-brand hover:underline">
            as an organizer
          </Link>
          .
        </p>
      }
    >
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <Icon name="hgi-alert-02" size={30} />
        </span>
        <p role="alert" className="mt-4 text-[13px] text-muted">
          {error}
        </p>
        <Link to="/" className="btn btn-soft mt-5 w-full">
          Back to Eventa
        </Link>
      </div>
    </AuthLayout>
  )
}
