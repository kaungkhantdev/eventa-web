import { useLocation } from 'react-router'
import { CheckEmailNotice } from '@/features/auth/components/CheckEmailNotice'
import { handoffOf } from '@/features/auth/signupHandoff'

/**
 * Where attendee sign-up ends (US-DISC-08).
 *
 * No promise that the tickets are attached: they are found by matching the
 * order's address to the account's, so they appear the moment the account is
 * confirmed — but this screen cannot know an order exists, and should not claim
 * one does.
 */
export default function PortalCheckEmailPage() {
  const { email } = handoffOf(useLocation().state)

  return (
    <CheckEmailNotice
      email={email}
      subtitle="One more step before your tickets are in one place."
      signInPath="/portal/login"
      signUpPath="/portal/register"
      homeTo="/portal/discover"
    />
  )
}
