import { useFetcher, useLoaderData } from 'react-router'
import { Badge, Button, Card, Hint, Icon, Input, Label } from '@/components/ui'
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
 * Connecting an account is deliberately not a form here either: it is an
 * OAuth hand-off the provider owns, and pasting an account id into this page
 * would be a worse version of it.
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
  const act = useFetcher<ActionResult>()
  const error = act.data?.ok === false ? act.data.error : null

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

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {error}
        </p>
      )}

      {payments.connected ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-hair pt-4">
          <act.Form method="post">
            <input type="hidden" name="intent" value="test" />
            <Button variant="soft" size="sm" type="submit" disabled={act.state !== 'idle'}>
              <Icon name="hgi-connect" size={15} />
              Test connection
            </Button>
          </act.Form>
          <act.Form method="post">
            <input type="hidden" name="intent" value="disconnect" />
            <Button variant="danger" size="sm" type="submit" disabled={act.state !== 'idle'}>
              Disconnect
            </Button>
          </act.Form>
        </div>
      ) : (
        <Hint className="mt-4 border-t border-hair pt-4">
          Connecting an account happens on {payments.provider}, not here. Contact support to start
          the hand-off.
        </Hint>
      )}
    </Card>
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
      {saved && <p className="mt-3 text-[13px] text-brand">Saved.</p>}
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
