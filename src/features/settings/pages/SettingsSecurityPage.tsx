import { useState, type ReactNode } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Badge,
  Button,
  Card,
  Hint,
  Icon,
  Input,
  Label,
  Panel,
  PageFooter,
  Toggle,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import { cn } from '@/lib/cn'
import type { ActionResult } from '@/app/loaders'
import { SettingsHeader } from '../components/SettingsHeader'
import { auditLook } from '../settings.presentation'
import type { SecurityData } from '../settings.routes'
import type { AuditRow, SessionRow } from '../settings.types'

/**
 * Password, two-factor and sessions (US-ACC-04..07), ported from
 * `eventa-ui-kit/admin/settings-security.html`.
 *
 * Nothing on this screen is stored or logged by this app. A password and a 2FA
 * code are read out of a form, sent, and forgotten; the secret behind the QR
 * comes from the API when setup starts and never outlives that fetcher's
 * response.
 *
 * The kit puts each action behind a slide-over rather than inline, and that is
 * worth keeping: a password form sitting open on a settings page invites a
 * browser to offer to fill it, and leaves three password boxes on screen for
 * anyone walking past.
 */
export default function SettingsSecurityPage() {
  const data = useLoaderData() as SecurityData

  return (
    <>
      <SettingsHeader
        title="Security"
        subtitle="Password, two-factor authentication and sessions."
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SecurityActionsCard twoFactor={data.twoFactor} audit={data.audit} />
        <SessionsCard sessions={data.sessions} />
      </div>

      <PageFooter />
    </>
  )
}

function SecurityActionsCard({
  twoFactor,
  audit,
}: {
  twoFactor: SecurityData['twoFactor']
  audit: AuditRow[]
}) {
  const password = useDisclosure()
  const setup = useDisclosure()
  const log = useDisclosure()

  return (
    <>
      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
          <Icon name="hgi-shield-key" size={17} className="text-muted" />
          Security
        </h2>

        <div className="mt-4 space-y-3">
          <ActionRow title="Password" description="Change the password you sign in with.">
            <Button variant="soft" size="sm" className="shrink-0" onClick={password.onOpen}>
              Change
            </Button>
          </ActionRow>

          <ActionRow
            title="Two-factor authentication"
            description="Require a one-time code at sign-in"
          >
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={twoFactor.enabled ? 'green' : 'gray'}>
                {twoFactor.enabled ? 'On' : 'Off'}
              </Badge>
              {/* Turning it ON opens the setup flow — a switch cannot enrol an
                  authenticator by itself. Turning it OFF also opens it, because
                  the API asks for a current code before it will disable. */}
              <Toggle
                on={twoFactor.enabled}
                onChange={setup.onOpen}
                label="Two-factor authentication"
                transition="transition-transform"
              />
            </div>
          </ActionRow>

          <ActionRow title="Audit log" description="Sign-ins, permission changes &amp; exports">
            <Button variant="soft" size="sm" className="shrink-0" onClick={log.onOpen}>
              View log
            </Button>
          </ActionRow>
        </div>
      </Card>

      <ChangePasswordPanel open={password.open} onClose={password.onClose} />
      <TwoFactorPanel open={setup.open} onClose={setup.onClose} twoFactor={twoFactor} />
      <AuditLogPanel open={log.open} onClose={log.onClose} rows={audit} />
    </>
  )
}

function ActionRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-hair bg-canvas px-3.5 py-3">
      <span>
        <span className="block text-[13px] font-medium text-ink">{title}</span>
        <span className="block text-[11px] text-muted">{description}</span>
      </span>
      {children}
    </div>
  )
}

/**
 * A password box with a reveal, as the kit draws all three.
 *
 * Reveal flips the input type and nothing else: no password is ever fetched
 * into this page. It exists so somebody can check what they typed before
 * committing to it, which on a *confirm* field is the difference between a
 * clear mismatch and a mystery.
 */
function PasswordField({
  id,
  name,
  label,
  autoComplete,
  hint,
}: {
  id: string
  name: string
  label: string
  autoComplete: string
  hint?: string
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={revealed ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          className="pr-10"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setRevealed((was) => !was)}
          aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={revealed}
          className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
        >
          <Icon name={revealed ? 'hgi-view-off' : 'hgi-view'} size={16} />
        </button>
      </div>
      {hint && <Hint>{hint}</Hint>}
    </div>
  )
}

/**
 * Changing the password (US-ACC-04).
 *
 * The confirm field is checked here, in the browser, and only here: it is not a
 * security rule, it is a typo guard, and the API has no business being told the
 * same secret twice to compare it. The real rules — length, composition, and
 * whether the current password is right — belong to the server and come back as
 * its own message.
 */
function ChangePasswordPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const change = useFetcher<ActionResult>()
  const [mismatch, setMismatch] = useState(false)
  const error = change.data?.ok === false ? change.data.error : null
  useSavedToast(change.state === 'idle' && change.data?.ok === true, 'Password changed.', onClose)
  useFailureToast(change.state === 'idle' ? error : null)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = new FormData(event.currentTarget)
    const differs = form.get('newPassword') !== form.get('confirmPassword')
    setMismatch(differs)
    if (differs) event.preventDefault()
  }

  return (
    <Panel
      open={open}
      onClose={onClose}
      title="Change password"
      footer={
        <div className="flex gap-2">
          <Button variant="soft" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="change-password"
            className="flex-1"
            disabled={change.state !== 'idle'}
          >
            {change.state === 'idle' ? 'Update password' : 'Updating…'}
          </Button>
        </div>
      }
    >
      <change.Form id="change-password" method="post" onSubmit={submit} className="space-y-4">
        <input type="hidden" name="intent" value="password" />

        <PasswordField
          id="current-password"
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
        />
        <PasswordField
          id="new-password"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters, with a number and a symbol."
        />
        <PasswordField
          id="confirm-password"
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
        />

        {mismatch && (
          <p role="alert" className="text-[12px] text-red-500">
            Those two do not match. Retype the new password.
          </p>
        )}
        {error && (
          <p role="alert" className="text-[13px] text-red-500">
            {error}
          </p>
        )}
      </change.Form>
    </Panel>
  )
}

/**
 * Two-factor, in one panel for both directions (US-ACC-05).
 *
 * Enrolling and disabling are the same conversation from the person's side —
 * "prove it is you with a code" — and the API asks for one either way, so a
 * single panel that knows which state it is in beats two that do not.
 *
 * The shared secret arrives from `start` and lives only in this fetcher's
 * response. It is never put in the URL, never stored, and gone on close.
 */
function TwoFactorPanel({
  open,
  onClose,
  twoFactor,
}: {
  open: boolean
  onClose: () => void
  twoFactor: SecurityData['twoFactor']
}) {
  const act = useFetcher<ActionResult & { secret?: string; otpauthUri?: string }>()
  const error = act.data?.ok === false ? act.data.error : null
  const secret = act.data && 'secret' in act.data ? act.data.secret : undefined
  const enrolling = Boolean(secret) || twoFactor.pending
  useFailureToast(act.state === 'idle' ? error : null)
  useSavedToast(
    act.state === 'idle' && act.data?.ok === true,
    twoFactor.enabled ? 'Two-factor turned off.' : 'Two-factor is on.',
    onClose,
  )

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={
        twoFactor.enabled
          ? 'Turn off two-factor authentication'
          : 'Set up two-factor authentication'
      }
    >
      {twoFactor.enabled ? (
        <act.Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="disable-2fa" />
          <p className="text-[12.5px] leading-relaxed text-muted">
            Enter a current code from your authenticator app. Turning this off means your password
            alone will be enough to sign in.
          </p>
          <CodeField id="disable-code" label="Enter the 6-digit code" />
          {twoFactor.recoveryCodesRemaining > 0 && (
            <Hint>{twoFactor.recoveryCodesRemaining} recovery codes left.</Hint>
          )}
          <Button variant="danger" type="submit" disabled={act.state !== 'idle'}>
            Turn off
          </Button>
        </act.Form>
      ) : (
        <div className="space-y-4">
          <p className="text-[12.5px] leading-relaxed text-muted">
            Add the key below to an authenticator app —{' '}
            <span className="font-medium text-ink">Google Authenticator, 1Password or Authy</span>{' '}
            — then enter the 6-digit code to finish.
          </p>

          {!enrolling && (
            <act.Form method="post">
              <input type="hidden" name="intent" value="start-2fa" />
              <Button variant="primary" type="submit" disabled={act.state !== 'idle'}>
                Start setup
              </Button>
            </act.Form>
          )}

          {secret && (
            <div>
              <Label htmlFor="twofa-key">Can&rsquo;t scan? Enter this key</Label>
              <div className="flex items-center gap-2 rounded-lg border border-hair bg-canvas px-3 py-2">
                <code
                  id="twofa-key"
                  className="flex-1 select-all break-all font-mono text-[13px] tracking-wider text-ink"
                >
                  {secret}
                </code>
              </div>
            </div>
          )}

          {enrolling && (
            <act.Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="confirm-2fa" />
              <CodeField id="confirm-code" label="Enter the 6-digit code" />
              <Button variant="primary" type="submit" disabled={act.state !== 'idle'}>
                <Icon name="hgi-shield-key" size={16} />
                Enable 2FA
              </Button>
            </act.Form>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {error}
        </p>
      )}
    </Panel>
  )
}

function CodeField({ id, label }: { id: string; label: string }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name="code"
        type="text"
        inputMode="numeric"
        maxLength={6}
        autoComplete="one-time-code"
        required
        placeholder="000000"
        className="tnum text-center text-[16px] font-semibold tracking-[0.4em]"
      />
    </div>
  )
}

function AuditLogPanel({
  open,
  onClose,
  rows,
}: {
  open: boolean
  onClose: () => void
  rows: AuditRow[]
}) {
  return (
    <Panel
      open={open}
      onClose={onClose}
      title="Audit log"
      subtitle="Sign-ins, permission changes and exports."
      footer={
        <Button variant="soft" className="w-full" onClick={onClose}>
          Close
        </Button>
      }
    >
      {rows.length === 0 ? (
        <p className="text-[13px] text-muted">Nothing has been recorded yet.</p>
      ) : (
        <div className="divide-y divide-line">
          {rows.map((row) => (
            <AuditEntry key={row.id} row={row} />
          ))}
        </div>
      )}
    </Panel>
  )
}

function AuditEntry({ row }: { row: AuditRow }) {
  const look = auditLook(row.type)

  return (
    <div className="flex items-start gap-3 py-3 first:pt-0">
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', look.tint)}>
        <Icon name={look.icon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink">{row.title}</p>
        {row.detail && <p className="mt-0.5 break-words text-[12px] text-muted">{row.detail}</p>}
      </div>
      <span className="shrink-0 whitespace-nowrap text-[11px] text-muted">{row.when}</span>
    </div>
  )
}

function SessionsCard({ sessions }: { sessions: SessionRow[] }) {
  const revoke = useFetcher<ActionResult>()
  const error = revoke.data?.ok === false ? revoke.data.error : null
  useFailureToast(revoke.state === 'idle' ? error : null)

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold tracking-tight">Active sessions</h2>
        {sessions.length > 1 && (
          <revoke.Form method="post">
            <input type="hidden" name="intent" value="revoke-others" />
            <Button variant="soft" size="sm" type="submit" disabled={revoke.state !== 'idle'}>
              Sign out everywhere else
            </Button>
          </revoke.Form>
        )}
      </div>

      {/* The kit's list sits under a heading alone; here the heading shares its
          row with a button, so the list needs its own gap rather than the kit's
          `first:pt-0`, which would leave the first device touching the title. */}
      <div className="mt-3 divide-y divide-line border-t border-hair pt-1">
        {sessions.map((session) => (
          <div key={session.id} className="flex flex-wrap items-center gap-3 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-line text-muted">
              <Icon name="hgi-smart-phone-01" size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{session.device}</p>
              <p className="text-[11px] text-muted">
                <span className="tnum">{session.ipAddress}</span> · {session.signedIn}
              </p>
            </div>
            {/* The session doing the asking is not offered a revoke — it would
                sign the person out of the page they are using. */}
            {session.isCurrent ? (
              <Badge tone="green">This device</Badge>
            ) : (
              <revoke.Form method="post">
                <input type="hidden" name="sessionId" value={session.id} />
                <Button
                  variant="soft"
                  size="sm"
                  type="submit"
                  className="shrink-0"
                  disabled={revoke.state !== 'idle'}
                >
                  Revoke
                </Button>
              </revoke.Form>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
