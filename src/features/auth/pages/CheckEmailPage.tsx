import { useLocation } from 'react-router'
import { CheckEmailNotice } from '@/features/auth/components/CheckEmailNotice'
import { handoffOf } from '@/features/auth/signupHandoff'

/** Where organizer sign-up ends (US-ACC-01). The workspace exists but is inert. */
export default function CheckEmailPage() {
  const { email } = handoffOf(useLocation().state)

  return (
    <CheckEmailNotice
      email={email}
      subtitle="One more step before your workspace is ready."
      signInPath="/auth/login"
      signUpPath="/auth/register"
    />
  )
}
