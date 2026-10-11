import { useId, useState } from 'react'
import { useFetcher, useRevalidator } from 'react-router'
import { Hint, Icon, Panel, RecoveryCodes} from '@/components/ui'
import { messageOf } from '@/lib/api'
import { useSavedToast } from '@/lib/useSavedToast'
import type { ActionResult } from '@/app/loaders'
import { qrDataUrl } from '../lib/qr'
import { TWO_FACTOR_DISABLE_INTENT } from '../myEvents.routes'
import { securityApi } from '../security.api'
import type { TwoFactorCard, TwoFactorStartWire } from '../security.types'
import { CodeField } from './CodeField'

/**
 * Two-factor, in one panel for both directions (US-DISC-12, criterion 5).
 *
 * The switch on the card does not save a setting, so this is where the work
 * is. Enrolling is three steps — mint a seed, prove it with a code, keep the
 * recovery codes — and even turning it off needs a current code first, which
 * is why both directions live in one panel that knows which state it is in:
 * from the reader's side they are the same conversation, "prove it is you".
 *
 * Start and confirm go straight to `securityApi` rather than through the route
 * action, which is the opposite of how the rest of this page saves. The reason
 * is that both answers ARE the point: a shared seed and a list of recovery
 * codes, neither of which the API will ever repeat, and `guardedAction` reports
 * `{ ok: true }` and discards what the call returned. There is no loader read
 * that could fetch either back, so the response is rendered where it arrives
 * and dropped when the panel closes. The organizer console tries to read a
 * secret off an action result and therefore shows no key at all; see `notes`.
 *
 * Nothing here is stored. The seed and the codes live in this component's state
 * for as long as the panel is open and are not written anywhere else.
 */

type Enrolment =
  | { step: 'invite' }
  | { step: 'scan'; seed: TwoFactorStartWire }
  /** The one moment the recovery codes exist anywhere the reader can see. */
  | { step: 'codes'; codes: string[] }

export function TwoFactorPanel({
  open,
  onClose,
  twoFactor,
  email,
}: {
  open: boolean
  onClose: () => void
  twoFactor: TwoFactorCard
  /** Named on the saved recovery-code file, so it is usable a year later. */
  email: string
}) {
  const enrolment = useEnrolment()

  /**
   * Closing drops the seed and the codes.
   *
   * The panel element stays mounted — that is how the kit's `.panel` transition
   * works — so without this an abandoned enrolment would still be on screen the
   * next time it opened, offering a seed the API has since replaced.
   */
  function close() {
    enrolment.reset()
    onClose()
  }

  return (
    <Panel
      open={open}
      onClose={close}
      title={twoFactor.enabled ? 'Turn off two-factor' : 'Set up two-factor'}
      subtitle={
        twoFactor.enabled
          ? 'Your password alone will be enough to sign in.'
          : 'A one-time code at sign-in, from an app on your phone.'
      }
    >
      {twoFactor.enabled ? (
        <DisableForm twoFactor={twoFactor} onDone={close} />
      ) : (
        <Enrol state={enrolment} email={email} onDone={close} />
      )}
    </Panel>
  )
}

/* -------------------------------- turning off ---------------------------- */

/**
 * One call, but it still wants a code — so it is a form, not a switch.
 *
 * Through the route action, because unlike the other two steps it has nothing
 * to say beyond "it worked", and the switch on the card has to re-read the
 * server's answer afterwards. The fetcher revalidates the loader, so it does.
 */
function DisableForm({
  twoFactor,
  onDone,
}: {
  twoFactor: TwoFactorCard
  onDone: () => void
}) {
  const id = useId()
  const act = useFetcher<ActionResult>()
  const error = act.data?.ok === false ? act.data.error : null
  useSavedToast(act.state === 'idle' && act.data?.ok === true, 'Two-factor turned off.', onDone)

  return (
    <act.Form method="post" className="space-y-4">
      <input type="hidden" name="intent" value={TWO_FACTOR_DISABLE_INTENT} />
      <p className="text-[12.5px] leading-relaxed text-muted">
        Enter a current code from your authenticator app to confirm it is you. Turning this off
        means your password alone will be enough to sign in.
      </p>
      <CodeField
        id={id}
        label="Authenticator or recovery code"
        hint={
          twoFactor.recoveryCodesRemaining > 0
            ? 'A recovery code works here too, if you no longer have the app.'
            : undefined
        }
      />
      <button type="submit" className="btn btn-danger" disabled={act.state !== 'idle'}>
        {act.state === 'idle' ? 'Turn off' : 'Turning off…'}
      </button>
      {error && (
        <p role="alert" className="text-[13px] text-red-500">
          {error}
        </p>
      )}
    </act.Form>
  )
}

/* -------------------------------- enrolling ------------------------------ */

/**
 * The three steps, and the one request each.
 *
 * Shaped like `usePhotoUpload` on the Profile tab and for the same reason: the
 * interesting part of each response cannot go through a route action, so the
 * component owns the call, its busy state and its refusal.
 */
function useEnrolment() {
  const revalidator = useRevalidator()
  const [state, setState] = useState<Enrolment>({ step: 'invite' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(act: () => Promise<Enrolment>): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      setState(await act())
    } catch (cause) {
      // The API's own sentence — "Two-factor is already on", a wrong code.
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  return {
    state,
    busy,
    error,
    /** A fresh seed every time: an abandoned enrolment is restarted, not resumed. */
    begin: () => run(async () => ({ step: 'scan', seed: await securityApi.startTwoFactor() })),
    confirm: (code: string) =>
      run(async () => {
        const { recoveryCodes } = await securityApi.confirmTwoFactor(code)
        // The switch on the card reads the server, so make it re-read before
        // the codes are shown — the panel stays open, and it would otherwise
        // sit over a switch still saying "off".
        await revalidator.revalidate()
        // Deliberately no toast. Every other save on this page announces
        // itself in the corner, but a toast here lands on top of the one
        // sentence that must be read — that the codes below will not be shown
        // again — at the exact moment it appears. The step IS the
        // confirmation, and it says more than a toast could.
        return { step: 'codes', codes: recoveryCodes }
      }),
    reset: () => {
      setState({ step: 'invite' })
      setError(null)
    },
  }
}

type EnrolmentState = ReturnType<typeof useEnrolment>

function Enrol({
  state,
  email,
  onDone,
}: {
  state: EnrolmentState
  email: string
  onDone: () => void
}) {
  return (
    <div className="space-y-4">
      {state.state.step === 'invite' && <Invite state={state} />}
      {state.state.step === 'scan' && <Scan seed={state.state.seed} state={state} />}
      {state.state.step === 'codes' && (
        <>
          <RecoveryCodes codes={state.state.codes} email={email} />
          <button type="button" className="btn btn-primary w-full" onClick={onDone}>
            I have saved my recovery codes
          </button>
        </>
      )}
      {state.error && (
        <p role="alert" className="text-[13px] text-red-500">
          {state.error}
        </p>
      )}
    </div>
  )
}

function Invite({ state }: { state: EnrolmentState }) {
  return (
    <>
      <p className="text-[12.5px] leading-relaxed text-muted">
        You will scan a code with an authenticator app —{' '}
        <span className="font-medium text-ink">Google Authenticator, 1Password or Authy</span> —
        and enter the 6-digit code it shows. After that, signing in asks for a code as well as
        your password.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => void state.begin()}
        disabled={state.busy}
      >
        {state.busy ? 'Starting…' : 'Start setup'}
      </button>
    </>
  )
}

/**
 * The QR, the key behind it, and the code that proves the app has it.
 *
 * The seed is in the picture and in the key beside it, which is what enrolment
 * is; it is in no URL, no storage and no log, and it is gone when the panel
 * closes. `qrDataUrl` answers `null` for a payload it cannot encode, in which
 * case the key alone is offered rather than a broken image.
 */
function Scan({ seed, state }: { seed: TwoFactorStartWire; state: EnrolmentState }) {
  const id = useId()
  const qr = qrDataUrl(seed.otpauthUri)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = String(new FormData(event.currentTarget).get('code') ?? '').trim()
    void state.confirm(code)
  }

  return (
    <>
      {qr ? (
        <div className="flex justify-center rounded-xl border border-hair bg-white p-4">
          <img src={qr} alt="" width={160} height={160} className="h-40 w-40" />
        </div>
      ) : (
        <Hint>This code could not be drawn. Enter the key below in your app instead.</Hint>
      )}

      <div>
        <label className="label" htmlFor={`${id}-key`}>
          Can’t scan? Enter this key
        </label>
        <div className="rounded-lg border border-hair bg-canvas px-3 py-2">
          <code
            id={`${id}-key`}
            className="block select-all break-all font-mono text-[12.5px] tracking-wider text-ink"
          >
            {seed.secret}
          </code>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <CodeField id={`${id}-code`} label="Enter the 6-digit code" />
        <button type="submit" className="btn btn-primary w-full" disabled={state.busy}>
          <Icon name="hgi-shield-key" size={16} />
          {state.busy ? 'Checking…' : 'Turn on two-factor'}
        </button>
      </form>
    </>
  )
}
