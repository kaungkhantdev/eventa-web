import { Link } from 'react-router'
import { Icon } from '@/components/ui'
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
  signInPath,
  signUpPath,
  homeTo,
}: {
  /** Empty when the page is opened cold, with no navigation state to read. */
  email: string
  subtitle: string
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

        <Link to={signInPath} className="btn btn-soft mt-5 w-full">
          Go to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
