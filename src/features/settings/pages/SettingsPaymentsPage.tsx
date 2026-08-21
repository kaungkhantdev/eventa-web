import type { ReactNode } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import { Badge, Button, Card, FieldError, Hint, Icon, Input, Label, Select } from '@/components/ui'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import type { ActionResult } from '@/app/loaders'
import { SettingsHeader } from '../components/SettingsHeader'
import { Toggle } from '../components/Toggle'
import type { PaymentsData } from '../settings.routes'
import type { PaymentSettingsCard } from '../settings.types'

/**
 * How money reaches this workspace (US-FIN-01, US-DISC-05).
 *
 * PCI SAQ-A: there is no card field on this screen, and there never will be.
 * What is configured here is the *connection* to the payment provider — which
 * account, which mode, what appears on a statement. Card numbers are entered
 * on the provider's own hosted fields and never enter this app.
 *
 * The workspace pastes its OWN Stripe keys. The secret is sent once, stored
 * encrypted by the API, and never comes back — this page only ever sees a
 * masked tail, enough to say which key is saved and useless for anything else.
 */
export default function SettingsPaymentsPage() {
  const { payments } = useLoaderData() as PaymentsData

  return (
    <>
      <SettingsHeader
        title="Payments"
        subtitle="How you take money, and what buyers see on their statement."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PreferencesCard payments={payments} />
        <ProviderCard payments={payments} />
      </div>
    </>
  )
}

function ProviderCard({ payments }: { payments: PaymentSettingsCard }) {
  return (
    <Card className="h-fit p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-bold tracking-tight">{payments.provider}</p>
          <p className="mt-0.5 text-[12px] text-muted">Your payment provider.</p>
        </div>
        <Badge tone={payments.statusTone}>{payments.statusLabel}</Badge>
      </div>

      {payments.testMode && (
        <Hint className="mt-3">
          Test mode — no real money moves, and these payments are not settled.
        </Hint>
      )}

      {payments.warnings.map((warning) => (
        <p key={warning} role="alert" className="mt-2 text-[12px] text-amber-600">
          {warning}
        </p>
      ))}

      <div className="mt-4 space-y-2 border-t border-hair pt-4 text-[12px]">
        <p className="flex items-center justify-between gap-2">
          <span className="text-muted">Account</span>
          <span className="tnum font-semibold text-ink">{payments.accountRef}</span>
        </p>
        <p className="flex items-center justify-between gap-2">
          <span className="text-muted">Connected</span>
          <span className="font-semibold text-ink">{payments.connectedOn}</span>
        </p>
        <p className="flex items-center justify-between gap-2">
          <span className="text-muted">Settles in</span>
          <span className="font-semibold text-ink">{payments.defaultCurrency}</span>
        </p>
      </div>

      {payments.connected && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-hair pt-4">
          <IntentForm intent="test" done="Connection is working.">
            {(busy) => (
              <Button variant="soft" size="sm" type="submit" disabled={busy}>
                <Icon name="hgi-connect" size={15} />
                {busy ? 'Testing…' : 'Test connection'}
              </Button>
            )}
          </IntentForm>
          <IntentForm intent="disconnect" done="Payment account disconnected.">
            {(busy) => (
              <Button variant="danger" size="sm" type="submit" disabled={busy}>
                Disconnect
              </Button>
            )}
          </IntentForm>
        </div>
      )}

      <KeysCard payments={payments} />
    </Card>
  )
}

/**
 * One posted intent, with its own fetcher so its own outcome is what gets
 * reported. Sharing a fetcher across Test and Disconnect would mean one toast
 * wording for two different things, and a failure from either appearing under
 * both.
 */
function IntentForm({
  intent,
  done,
  children,
}: {
  intent: string
  /** What the toast says when it worked — written for this action alone. */
  done: string
  children: (busy: boolean) => ReactNode
}) {
  const act = useFetcher<ActionResult>()
  const error = act.data?.ok === false ? act.data.error : null
  useSavedToast(act.state === 'idle' && act.data?.ok === true, done)
  useFailureToast(act.state === 'idle' ? error : null)

  return (
    <act.Form method="post">
      <input type="hidden" name="intent" value={intent} />
      {children(act.state !== 'idle')}
    </act.Form>
  )
}

/**
 * The workspace's own Stripe keys (US-SET-08), as the UI kit draws this card.
 *
 * The secret goes up once and never comes back: the API stores it encrypted and
 * answers with a masked tail, which is all this screen needs to say WHICH key is
 * saved. So the field is empty on load rather than pre-filled — there is nothing
 * to pre-fill it with, and a box that looks populated would invite an organizer
 * to "save" a value the browser does not actually hold.
 *
 * Mode is submitted with the keys because the two have to agree. The API refuses
 * a live pair saved under Test: that combination takes real money from real
 * people while the banner above says nothing is charged.
 */
function KeysCard({ payments }: { payments: PaymentSettingsCard }) {
  const save = useFetcher<ActionResult>()
  const failed = save.data?.ok === false ? save.data : null
  const fields = failed?.fieldErrors ?? {}
  const unattached = Object.keys(fields).length === 0 ? (failed?.error ?? null) : null
  useSavedToast(save.state === 'idle' && save.data?.ok === true, 'Payment keys saved.')
  useFailureToast(save.state === 'idle' ? unattached : null)

  return (
    <div className="mt-4 border-t border-hair pt-4">
      <p className="text-[13px] font-bold tracking-tight">API keys</p>
      <p className="mt-0.5 text-[12px] text-muted">
        In your Stripe Dashboard go to Developers → API keys, copy the two keys, and paste them
        below.
      </p>

      <save.Form method="post" className="mt-3">
        <input type="hidden" name="intent" value="keys" />

        <Label htmlFor="keys-mode">Mode</Label>
        <Select id="keys-mode" name="mode" defaultValue={payments.testMode ? 'test' : 'live'}>
          <option value="test">Test — nothing is really charged</option>
          <option value="live">Live — real money</option>
        </Select>

        <Label htmlFor="keys-pk" className="mt-3">
          Publishable key
        </Label>
        <Input
          id="keys-pk"
          name="publishableKey"
          required
          className="font-mono text-[12px]"
          placeholder="pk_test_..."
          aria-describedby={fields.publishableKey ? 'keys-pk-error' : undefined}
        />
        <FieldError id="keys-pk-error" message={fields.publishableKey} />

        <Label htmlFor="keys-sk" className="mt-3">
          Secret key
        </Label>
        <Input
          id="keys-sk"
          name="secretKey"
          type="password"
          required
          autoComplete="off"
          className="font-mono text-[12px]"
          placeholder={payments.secretKeyMasked || 'sk_test_...'}
          aria-describedby={fields.secretKey ? 'keys-sk-error' : undefined}
        />
        <FieldError id="keys-sk-error" message={fields.secretKey} />
        <Hint className="mt-1">
          Starts with sk_. Stored encrypted — never shown again, and never sent to a browser.
        </Hint>

        <Label htmlFor="keys-whsec" className="mt-3">
          Webhook signing secret
        </Label>
        <Input
          id="keys-whsec"
          name="webhookSecret"
          type="password"
          autoComplete="off"
          className="font-mono text-[12px]"
          placeholder={payments.webhookSecretSet ? 'Saved — leave blank to keep' : 'whsec_...'}
        />
        <Hint className="mt-1">
          From the endpoint you register in Stripe for this workspace. Without it, payments are
          taken but no ticket is issued.
        </Hint>


        <Button
          variant="primary"
          size="sm"
          type="submit"
          className="mt-3 w-full"
          disabled={save.state !== 'idle'}
        >
          <Icon name="hgi-tick-02" size={15} />
          {save.state === 'idle' ? 'Save keys' : 'Checking…'}
        </Button>
      </save.Form>

      {payments.keysSavedOn && (
        <p className="mt-2 text-[11px] text-muted">Last saved {payments.keysSavedOn}</p>
      )}
    </div>
  )
}

function PreferencesCard({ payments }: { payments: PaymentSettingsCard }) {
  const save = useFetcher<ActionResult>()
  const error = save.data?.ok === false ? save.data.error : null
  const saved = save.state === 'idle' && save.data?.ok === true
  useSavedToast(saved, 'Payment preferences saved.')
  useFailureToast(save.state === 'idle' ? error : null)

  const setFlag = (field: 'saveCards' | 'emailReceipts', value: boolean) =>
    save.submit(
      {
        statementDescriptor: payments.statementDescriptor,
        saveCards: String(field === 'saveCards' ? value : payments.saveCards),
        emailReceipts: String(field === 'emailReceipts' ? value : payments.emailReceipts),
      },
      { method: 'post' },
    )

  return (
    <Card className="p-5">
      <h3 className="text-[14px] font-bold tracking-tight">Checkout preferences</h3>
      <p className="mt-0.5 text-[12px] text-muted">
        What buyers see, and what happens after they pay.
      </p>

      <save.Form method="post" key={payments.statementDescriptor}>
        <input type="hidden" name="saveCards" value={String(payments.saveCards)} />
        <input type="hidden" name="emailReceipts" value={String(payments.emailReceipts)} />
        <div className="mt-4">
          <Label htmlFor="pay-descriptor">Statement descriptor</Label>
          <Input
            id="pay-descriptor"
            name="statementDescriptor"
            maxLength={22}
            defaultValue={payments.statementDescriptor}
            placeholder="ACME EVENTS"
          />
          <Hint>Up to 22 characters — what appears on a buyer's bank statement.</Hint>
        </div>
        <div className="mt-4 flex justify-end border-t border-hair pt-4">
          <Button variant="primary" size="sm" type="submit" disabled={save.state !== 'idle'}>
            <Icon name="hgi-tick-02" size={15} />
            {save.state === 'idle' ? 'Save' : 'Saving…'}
          </Button>
        </div>
      </save.Form>

      <div className="mt-2 divide-y divide-line border-t border-hair">
        <PreferenceRow
          title="Let buyers save a card"
          description="Their card is stored by the provider, never by Eventa."
          on={payments.saveCards}
          busy={save.state !== 'idle'}
          onChange={(next) => setFlag('saveCards', next)}
        />
        <PreferenceRow
          title="Email a receipt"
          description="Sent automatically once a payment clears."
          on={payments.emailReceipts}
          busy={save.state !== 'idle'}
          onChange={(next) => setFlag('emailReceipts', next)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {error}
        </p>
      )}
    </Card>
  )
}

function PreferenceRow({
  title,
  description,
  on,
  busy,
  onChange,
}: {
  title: string
  description: string
  on: boolean
  busy: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-[12px] text-muted">{description}</p>
      </div>
      <Toggle on={on} disabled={busy} onChange={onChange} label={title} />
    </div>
  )
}
