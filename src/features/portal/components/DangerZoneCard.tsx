import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { Icon, Modal } from '@/components/ui'
import { messageOf, session } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import type { Panel } from '@/app/panels'
import { DELETE_CONFIRMATION, isDeleteConfirmed, toDeleteBody } from '../security.mapper'
import { securityApi } from '../security.api'
import type { DeletionWarning } from '../security.types'
import { CodeField } from './CodeField'
import { PasswordField } from './PasswordField'

/** One dialog on one page, so the id can be quoted in the footer's `form=`. */
const FORM_ID = 'portal-delete-account'

/**
 * "My Account" → Settings → Danger zone (US-DISC-14).
 *
 * The kit's card, with something behind the button. The flow is the story's
 * four criteria in order: say what is lost, warn about non-refundable tickets,
 * demand an explicit confirmation and the password again, and — if any of that
 * fails — change nothing.
 *
 * The preflight is read, never assumed. `GET /me/account/deletion` is the only
 * thing that knows which upcoming paid tickets this account would forfeit and
 * whether re-verification also needs an authenticator code, so when it is
 * unavailable this card offers no deletion at all: criterion 2 is a *warning*,
 * and an irreversible button over an unknown consequence is worse than a
 * button that is not there yet. The API's own sentence says why.
 */
export function DangerZoneCard({ deletion }: { deletion: Panel<DeletionWarning> }) {
  const confirm = useDisclosure()

  return (
    <div className="card border-red-200 p-5 dark:border-red-500/30">
      <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-red-600 dark:text-red-400">
        <Icon name="hgi-alert-02" size={16} />
        Danger zone
      </h3>
      <p className="mt-2 text-[12px] text-muted">
        Permanently remove your account and all registration data. This cannot be undone.
      </p>

      {deletion.ok ? (
        <>
          <button
            type="button"
            onClick={confirm.onOpen}
            className="btn btn-sm mt-4 border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400"
          >
            <Icon name="hgi-delete-02" size={15} />
            Delete account
          </button>
          <DeleteAccountModal
            open={confirm.open}
            onClose={confirm.onClose}
            warning={deletion.data}
          />
        </>
      ) : (
        /* No button rather than a button that cannot keep criterion 2's
           promise — the API's words, because they were written for the reader. */
        <p role="alert" className="mt-4 text-[12px] text-red-500">
          {deletion.error}
        </p>
      )}
    </div>
  )
}

/**
 * The confirmation (US-DISC-14, criteria 1–4).
 *
 * Two gates, and neither can be clicked through: the exact word `DELETE` typed
 * by hand, and the account password again — plus an authenticator code when the
 * API says one is required. The primary button stays disabled until the phrase
 * is right, so the dialog cannot be dismissed into a deletion by a stray Return
 * or a double-tap on the card's own button.
 *
 * The call goes straight to `securityApi` rather than through the route action,
 * because there is no page to revalidate afterwards: on success the session is
 * over. The API has already revoked every token, so the local ones are dropped
 * — `session.end()`, not a logout call that could only 401 — and the API's own
 * closing sentence is carried to the sign-in page by the toast, which lives
 * outside the router.
 *
 * On a refusal — a wrong password, a wrong code, an account that signs in with
 * a social provider and has no password to re-verify — nothing has happened,
 * the dialog stays open, and the reason is the API's.
 */
function DeleteAccountModal({
  open,
  onClose,
  warning,
}: {
  open: boolean
  onClose: () => void
  warning: DeletionWarning
}) {
  const id = useId()
  const [typed, setTyped] = useState('')
  const deletion = useAccountDeletion()
  const armed = isDeleteConfirmed(typed)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void deletion.remove(new FormData(event.currentTarget))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete your account"
      /* The kit's `.modal` has no height cap, and this one's content varies:
         a code field appears when 2FA is on, and the forfeit list is as long
         as the reader's upcoming tickets. Without this, a short viewport puts
         the footer — and the way out — below the fold. */
      className="max-h-[90vh] overflow-y-auto"
      footer={
        <div className="flex w-full gap-2">
          <button type="button" className="btn btn-soft flex-1" onClick={onClose}>
            Keep my account
          </button>
          <button
            type="submit"
            form={FORM_ID}
            className="btn btn-danger flex-1"
            disabled={!armed || deletion.busy}
          >
            {deletion.busy ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        <p className="leading-relaxed">
          Your profile, your saved events and your registration history are scheduled for removal,
          and you are signed out everywhere. This cannot be undone.
        </p>
        {/* Not invented: the API retains financial records disassociated from
            the profile for the legal retention period (US-DISC-14's note). */}
        <p className="text-[12px] leading-relaxed">
          Payment and tax records are kept in anonymised form for the legal retention period, no
          longer linked to you.
        </p>

        <ForfeitWarning warning={warning} />

        <form id={FORM_ID} onSubmit={submit} className="space-y-3.5 border-t border-hair pt-3.5">
          <div>
            <label className="label" htmlFor={`${id}-confirm`}>
              Type {DELETE_CONFIRMATION} to confirm
            </label>
            <input
              id={`${id}-confirm`}
              name="confirm"
              type="text"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder={DELETE_CONFIRMATION}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="input tracking-wider"
            />
          </div>

          <PasswordField
            id={`${id}-password`}
            name="password"
            label="Your password"
            autoComplete="current-password"
            hint="Asked again so nobody else can delete your account from your screen."
          />

          {/* Only when the API says re-verification needs one. */}
          {warning.requiresTwoFactorCode && (
            <CodeField
              id={`${id}-code`}
              label="Authenticator or recovery code"
              hint="Two-factor is on for this account, so a code is required as well."
            />
          )}

          {deletion.error && (
            <p role="alert" className="text-[13px] text-red-500">
              {deletion.error}
            </p>
          )}
        </form>
      </div>
    </Modal>
  )
}

/**
 * Criterion 2 — the non-refundable tickets, if there are any.
 *
 * Nothing is drawn when there is nothing to forfeit: an empty "you will lose"
 * box reads as a warning somebody has to decode, and `totalAtRisk` is `null`
 * rather than `฿0` precisely so this can tell the two apart.
 */
function ForfeitWarning({ warning }: { warning: DeletionWarning }) {
  if (warning.orders.length === 0) return null

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-500/40 dark:bg-red-500/10">
      <p className="text-[12px] font-semibold text-red-700 dark:text-red-300">
        You have upcoming tickets you have paid for. They are not refunded
        {warning.totalAtRisk && <> — {warning.totalAtRisk} in all</>}.
      </p>
      {/* Bounded: the only part of this dialog whose length is somebody's
          booking history rather than a fixed design. */}
      <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto">
        {warning.orders.map((order) => (
          <li key={order.reference} className="text-[11.5px] text-red-800/90 dark:text-red-300/90">
            <span className="font-medium">{order.eventName}</span> · {order.when} ·{' '}
            {order.tickets} · <span className="tnum">{order.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The one request, and what happens to the session after it.
 *
 * Shaped like `usePhotoUpload` on the Profile tab: the component owns the call
 * so it can own what follows, which here is ending the session rather than
 * revalidating a loader.
 */
function useAccountDeletion() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(form: FormData): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      const { message } = await securityApi.deleteAccount(toDeleteBody(form))
      // Every token for this account is already revoked server-side, so there
      // is nothing to log out of — drop the local ones and leave.
      session.end()
      toast.success(message)
      navigate('/portal/login', { replace: true })
    } catch (cause) {
      // Nothing was deleted; the API says why, in its own words.
      setError(messageOf(cause))
      setBusy(false)
    }
  }

  return { busy, error, remove }
}
