import { Link } from 'react-router'

/**
 * A sign-in page's way to an account for somebody who has none — the footer
 * of the kit's auth/login.html, verbatim, shared by both sign-ins so their
 * words cannot drift apart.
 *
 * Presentational: each sign-in passes its own audience's sign-up
 * (`signUpPathFor`). Never the other one — an organizer workspace is the
 * wrong thing for somebody keeping their tickets, and an attendee account
 * cannot reach /admin.
 */
export function CreateAccountPrompt({ to }: { to: string }) {
  return (
    <p className="mt-6 text-center text-[13px] text-muted">
      Don't have an account?{' '}
      <Link to={to} className="font-semibold text-brand hover:underline">
        Create one
      </Link>
    </p>
  )
}
