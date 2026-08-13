import { useState } from 'react'

/**
 * "Continue with Google".
 *
 * Two deliberate departures from the static kit, which drew the button with a
 * generic globe on a brand-green fill:
 *
 * 1. **Google's own mark**, as their brand guidelines require on a sign-in
 *    button. A stand-in globe reads as unfinished.
 * 2. **A neutral button, not a green one.** A third party's button should not
 *    borrow our brand colour, and on the kit's fill the card showed two green
 *    blocks in a column with nothing to say which was the primary action. A
 *    hairline on the surface keeps "Sign in" the only green thing on screen.
 */

/** Google's four-colour "G". */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

export function SocialAuth({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [refused, setRefused] = useState(false)

  return (
    <>
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-hair" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">or</span>
        <div className="h-px flex-1 bg-hair" />
      </div>

      <button
        type="button"
        onClick={() => setRefused(true)}
        className="btn w-full border border-hair bg-surface text-ink transition hover:bg-line focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
      >
        <GoogleMark />
        {mode === 'sign-in' ? 'Continue with Google' : 'Sign up with Google'}
      </button>

      {/* eventa-api has no OAuth routes yet, so this cannot sign anyone in.
          Saying so on click is the honest option: a button that silently does
          nothing reads as a broken product, and hiding it would leave the
          screen the kit designed half-drawn. Delete this the day the API grows
          `/auth/oauth/:provider`. */}
      {refused && (
        <p role="alert" className="mt-3 text-center text-[12px] leading-snug text-muted">
          Google {mode === 'sign-in' ? 'sign-in' : 'sign-up'} isn&rsquo;t connected yet
          {mode === 'sign-in'
            ? ' — use your email and password for now.'
            : ' — create your account with an email and password for now.'}
        </p>
      )}
    </>
  )
}
