import { type ReactNode } from 'react'
import { useFetcher } from 'react-router'
import { Icon } from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import type { ActionResult } from '@/app/loaders'
import type { Panel } from '@/app/panels'
import { REVOKE_OTHER_SESSIONS_INTENT } from '../myEvents.routes'
import type { TwoFactorCard } from '../security.types'
import { ChangePasswordPanel } from './ChangePasswordPanel'
import { SwitchButton } from './Switch'
import { TwoFactorPanel } from './TwoFactorPanel'

/**
 * "My Account" → Settings → Security (US-DISC-12, criteria 4–5).
 *
 * The kit's card, with something behind it. It was ported with the "Change"
 * button and the two-factor switch both `disabled`, on the grounds that the
 * portal kit draws no password form and no enrolment flow — but both flows
 * exist on the API, and the organizer console had already built them, so what
 * was missing was the presentation and not the product.
 *
 * Three things are composed from classes the kit already uses here, because it
 * draws nothing for them: the two slide-overs (`Panel`, the same primitive the
 * portal's own Pay-now panel's CSS comes from), and a third row in the card —
 * the kit's own row class string, for the other devices criterion 4 asks about.
 *
 * Each read is its own `Panel`, so one unavailable endpoint costs one row. A
 * guessed position is specifically what is avoided: a switch drawn "off" for an
 * account that has two-factor ON is the one wrong answer a security card must
 * not give, which is why there is a red line where the switch would be rather
 * than a switch.
 */
export function SecurityCard({
  twoFactor,
  otherDevices,
  email,
}: {
  twoFactor: Panel<TwoFactorCard>
  /** How many devices other than this one hold a session. */
  otherDevices: Panel<number>
  email: string
}) {
  const password = useDisclosure()
  const setup = useDisclosure()

  return (
    <div className="card p-5">
      <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
        <Icon name="hgi-shield-01" size={16} className="text-muted" />
        Security
      </h3>
      <div className="mt-4 space-y-3">
        <SecurityRow title="Password" description="The password you sign in with">
          <button type="button" className="btn btn-soft btn-sm" onClick={password.onOpen}>
            Change
          </button>
        </SecurityRow>

        <SecurityRow
          title="Two-factor authentication"
          description={twoFactor.ok ? twoFactor.data.status : 'Extra security at sign-in'}
          error={twoFactor.ok ? undefined : twoFactor.error}
        >
          {twoFactor.ok && (
            <SwitchButton
              on={twoFactor.data.enabled}
              label="Two-factor authentication"
              onActivate={setup.onOpen}
            />
          )}
        </SecurityRow>

        <OtherDevicesRow devices={otherDevices} />
      </div>

      <ChangePasswordPanel open={password.open} onClose={password.onClose} />
      {/* Only mounted once its state is known: the panel's whole shape — enrol
          or turn off — is decided by the answer the card could not read. */}
      {twoFactor.ok && (
        <TwoFactorPanel
          open={setup.open}
          onClose={setup.onClose}
          twoFactor={twoFactor.data}
          email={email}
        />
      )}
    </div>
  )
}

/**
 * One row of the card — the kit's class string, verbatim.
 *
 * A `<div>` rather than the kit's `<label>` on the two-factor row: the control
 * there is a button now, and a refusal has to sit inside the row to be beside
 * the control it belongs to. Inside a `<label>`, every click on that message
 * would activate the control again.
 */
function SecurityRow({
  title,
  description,
  error,
  children,
}: {
  title: string
  description: string
  /** The API's own sentence, where this row's control cannot be drawn. */
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-hair bg-canvas px-3.5 py-3">
      <span>
        <span className="block text-[13px] font-medium text-ink">{title}</span>
        <span className="block text-[11px] text-muted">{description}</span>
        {error && (
          <span role="alert" className="mt-1 block text-[11.5px] text-red-500">
            {error}
          </span>
        )}
      </span>
      {children}
    </div>
  )
}

/**
 * The rest of criterion 4 — "and I can sign out of other sessions".
 *
 * A password change already signs this account out everywhere else, and the
 * form says so. This is the same thing on its own, for somebody who does not
 * want to change their password to get it.
 *
 * The count is read rather than assumed, so the row can say "this device only"
 * instead of offering a sign-out with nothing to sign out — and when the count
 * is unavailable it says so and offers nothing, because "we could not ask" is
 * not "there are none".
 */
function OtherDevicesRow({ devices }: { devices: Panel<number> }) {
  const revoke = useFetcher<ActionResult>()
  const error = revoke.data?.ok === false ? revoke.data.error : null
  useSavedToast(
    revoke.state === 'idle' && revoke.data?.ok === true,
    'Signed out on your other devices.',
  )
  useFailureToast(revoke.state === 'idle' ? error : null)

  if (!devices.ok) {
    return (
      <SecurityRow title="Other devices" description="Where else you are signed in" error={devices.error}>
        {null}
      </SecurityRow>
    )
  }

  if (devices.data === 0) {
    return (
      <SecurityRow title="Other devices" description="Where else you are signed in">
        <span
          className="shrink-0 text-[11px] text-muted/60"
          title="No other browser or phone currently holds a session."
        >
          This device only
        </span>
      </SecurityRow>
    )
  }

  return (
    <SecurityRow
      title="Other devices"
      description={`Signed in on ${devices.data} other ${devices.data === 1 ? 'device' : 'devices'}`}
    >
      <revoke.Form method="post">
        <input type="hidden" name="intent" value={REVOKE_OTHER_SESSIONS_INTENT} />
        <button type="submit" className="btn btn-soft btn-sm" disabled={revoke.state !== 'idle'}>
          Sign out
        </button>
      </revoke.Form>
    </SecurityRow>
  )
}
