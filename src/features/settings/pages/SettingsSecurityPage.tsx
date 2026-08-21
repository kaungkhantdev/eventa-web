import { useFetcher, useLoaderData } from 'react-router'
import {
  Badge,
  Button,
  Card,
  DataTable,
  HeaderUser,
  Hint,
  Icon,
  Input,
  Label,
  PageFooter,
  PageHeader,
} from '@/components/ui'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import type { ActionResult } from '@/app/loaders'
import type { SecurityData } from '../settings.routes'
import type { SessionRow } from '../settings.types'

/**
 * Password, two-factor and sessions (US-ACC-04..07). Ported from the kit.
 *
 * Nothing on this screen is stored or logged. A password and a 2FA code are
 * read out of the form, sent, and forgotten; the secret behind the QR comes
 * from the API when setup starts and never lives in this app's state beyond
 * the fetcher's own response.
 */
export default function SettingsSecurityPage() {
  const data = useLoaderData() as SecurityData

  return (
    <>
      <PageHeader
        title="Security"
        subtitle="Password, two-factor authentication and sessions."
        actions={<HeaderUser />}
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <PasswordCard />
        <TwoFactorCard twoFactor={data.twoFactor} />
      </div>

      <SessionsCard sessions={data.sessions} />

      <PageFooter />
    </>
  )
}

function PasswordCard() {
  const fetcher = useFetcher<ActionResult>()
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const changed = fetcher.state === 'idle' && fetcher.data?.ok === true
  useSavedToast(changed, 'Password changed.')
  useFailureToast(fetcher.state === 'idle' ? error : null)

  return (
    <Card className="p-4">
      <h2 className="text-[15px] font-bold tracking-tight">Password</h2>
      <p className="mt-0.5 text-[12px] text-muted">Change the password you sign in with.</p>

      <fetcher.Form method="post" className="mt-4 space-y-3">
        <input type="hidden" name="intent" value="password" />
        <div>
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <div>
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            required
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-red-500">
            {error}
          </p>
        )}

        <Button variant="primary" type="submit" disabled={fetcher.state !== 'idle'}>
          {fetcher.state === 'idle' ? 'Change password' : 'Changing…'}
        </Button>
      </fetcher.Form>
    </Card>
  )
}

/**
 * Two-factor setup.
 *
 * `start` returns the shared secret and an otpauth URL; both stay inside this
 * fetcher's response. The code the person types is sent straight back to
 * confirm and is never held anywhere else.
 */
function TwoFactorCard({ twoFactor }: { twoFactor: SecurityData['twoFactor'] }) {
  const fetcher = useFetcher<ActionResult & { secret?: string; otpauthUrl?: string }>()
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const secret = fetcher.data && 'secret' in fetcher.data ? fetcher.data.secret : undefined
  const setting = Boolean(secret) || twoFactor.pending

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight">Two-factor authentication</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            A code from your authenticator app, as well as your password.
          </p>
        </div>
        <Badge tone={twoFactor.enabled ? 'green' : 'gray'}>
          {twoFactor.enabled ? 'On' : 'Off'}
        </Badge>
      </div>

      {twoFactor.enabled && twoFactor.recoveryCodesRemaining > 0 && (
        <Hint className="mt-2">
          {twoFactor.recoveryCodesRemaining} recovery codes left.
        </Hint>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {error}
        </p>
      )}

      {twoFactor.enabled ? (
        <fetcher.Form method="post" className="mt-4 space-y-3">
          <input type="hidden" name="intent" value="disable-2fa" />
          <div>
            <Label htmlFor="disable-code">Code from your app</Label>
            <Input
              id="disable-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="123456"
            />
            <Hint>Confirms it is you before turning it off.</Hint>
          </div>
          <Button variant="danger" type="submit" disabled={fetcher.state !== 'idle'}>
            Turn off
          </Button>
        </fetcher.Form>
      ) : (
        <div className="mt-4 space-y-3">
          {!setting && (
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="start-2fa" />
              <Button variant="primary" type="submit" disabled={fetcher.state !== 'idle'}>
                Set up two-factor
              </Button>
            </fetcher.Form>
          )}

          {secret && (
            <div className="rounded-lg bg-canvas p-3">
              <p className="text-[12px] text-muted">
                Add this key to your authenticator app, then enter the code it shows.
              </p>
              <code className="mt-2 block break-all text-[13px] font-semibold text-ink">
                {secret}
              </code>
            </div>
          )}

          {setting && (
            <fetcher.Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="confirm-2fa" />
              <div>
                <Label htmlFor="confirm-code">Code from your app</Label>
                <Input
                  id="confirm-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  placeholder="123456"
                />
              </div>
              <Button variant="primary" type="submit" disabled={fetcher.state !== 'idle'}>
                Turn on
              </Button>
            </fetcher.Form>
          )}
        </div>
      )}
    </Card>
  )
}

function SessionsCard({ sessions }: { sessions: SessionRow[] }) {
  const revoke = useFetcher<ActionResult>()

  return (
    <Card className="mt-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight">Where you are signed in</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            Sign out anywhere you do not recognise.
          </p>
        </div>
        {sessions.length > 1 && (
          <revoke.Form method="post">
            <input type="hidden" name="intent" value="revoke-others" />
            <Button variant="soft" type="submit" disabled={revoke.state !== 'idle'}>
              Sign out everywhere else
            </Button>
          </revoke.Form>
        )}
      </div>

      {revoke.data?.ok === false && (
        <p role="alert" className="mt-2 text-[13px] text-red-500">
          {revoke.data.error}
        </p>
      )}

      <div className="mt-3 overflow-x-auto">
        <DataTable className="min-w-[600px]">
          <thead>
            <tr>
              <th>Device</th>
              <th>IP address</th>
              <th>Signed in</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="font-medium text-ink">
                  {session.device}
                  {session.isCurrent && <span className="badge badge-green ml-2">This device</span>}
                </td>
                <td className="tnum text-muted">{session.ipAddress}</td>
                <td className="tnum text-muted">{session.signedIn}</td>
                <td className="text-right">
                  {/* The session doing the asking is not offered a revoke — it
                      would sign the person out of the page they are using. */}
                  {!session.isCurrent && (
                    <revoke.Form method="post" className="inline">
                      <input type="hidden" name="sessionId" value={session.id} />
                      <button
                        type="submit"
                        className="btn-icon"
                        title="Sign this device out"
                        disabled={revoke.state !== 'idle'}
                      >
                        <Icon name="hgi-logout-03" size={16} />
                      </button>
                    </revoke.Form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </Card>
  )
}
