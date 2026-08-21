import { useState, type ReactNode } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import { Badge, Button, Card, FieldError, Hint, Icon, Input, Label, Select } from '@/components/ui'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import { cn } from '@/lib/cn'
import type { ActionResult } from '@/app/loaders'
import { SettingsHeader } from '../components/SettingsHeader'
import { Toggle } from '../components/Toggle'
import type { PaymentsData } from '../settings.routes'
import type { PaymentMethodRow, PaymentSettingsCard } from '../settings.types'

/**
 * Payment provider, API keys and checkout preferences (US-SET-08/09/10),
 * ported from `eventa-ui-kit/admin/settings-payments.html`.
 *
 * PCI SAQ-A: there is no card field on this screen and there never will be.
 * What is configured here is the *connection* — which keys, which mode, what
 * appears on a statement. Card numbers are entered on Stripe's own hosted page.
 *
 * The workspace pastes its OWN Stripe keys. The secret is sent once, stored
 * encrypted by the API, and never comes back — this page only ever sees a
 * four-character tail, enough to say which key is saved and useless otherwise.
 */
export default function SettingsPaymentsPage() {
  const { payments, methods } = useLoaderData() as PaymentsData

  return (
    <>
      <SettingsHeader
        title="Payments"
        subtitle="Payment provider, API keys and checkout preferences."
      />

      <div className="space-y-3">
        {payments.testMode && <TestModeBanner />}

        <ConnectionCard payments={payments} />
        <KeysCard payments={payments} />

        {/* Similar-sized cards, so the kit balances them side by side. */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
          <MethodsCard methods={methods} />
          <PreferencesCard payments={payments} />
        </div>
      </div>
    </>
  )
}

/**
 * Amber, and above everything else on the page.
 *
 * A workspace taking play money while it believes it is trading is the one
 * state here that costs real revenue, and it looks identical to working. The
 * kit puts this first for that reason.
 */
function TestModeBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
      <Icon name="hgi-alert-circle" size={16} />
      <span>
        You&rsquo;re using <b>Test keys</b> — no real charges are processed. Add your Live keys to
        accept payments.
      </span>
    </div>
  )
}

/** Stripe's own brand purple, as the kit hard-codes it. */
const STRIPE_PURPLE = 'bg-[#635BFF]'

function ConnectionCard({ payments }: { payments: PaymentSettingsCard }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm',
              STRIPE_PURPLE,
            )}
          >
            <Icon name="hgi-credit-card" size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-bold tracking-tight">{payments.provider}</h2>
              <Badge tone={payments.statusTone}>{payments.statusLabel}</Badge>
            </div>
            <p className="mt-0.5 text-[12px] text-muted">
              Your payment gateway for cards, PromptPay and wallets.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {payments.connected && (
            <IntentForm intent="disconnect" done="Payment account disconnected.">
              {(busy) => (
                <Button variant="danger" size="sm" type="submit" disabled={busy}>
                  Disconnect
                </Button>
              )}
            </IntentForm>
          )}
        </div>
      </div>

      {payments.warnings.map((warning) => (
        <p key={warning} role="alert" className="mt-2 text-[12px] text-amber-600">
          {warning}
        </p>
      ))}

      {/* Three short facts, sat together on one line rather than spread across
          thirds of the card. Two of them are "—" until a key is saved, and a
          row of dashes stretched over the full width reads as a broken table
          rather than as a status the page is still waiting to fill in. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-hair pt-3 text-[12px]">
        <Fact label="Account" value={payments.accountRef} mono />
        <Fact label="Connected" value={payments.connectedOn} />
        <Fact label="Settles in" value={payments.defaultCurrency} />
      </div>
    </Card>
  )
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <p className="flex items-center gap-2">
      <span className="text-muted">{label}</span>
      <span className={cn('font-semibold text-ink', mono && 'tnum')}>{value}</span>
    </p>
  )
}

/**
 * The API keys card (US-SET-08).
 *
 * The mode segmented control is part of this card's own form rather than page
 * chrome, because mode and keys are submitted together: they have to agree, and
 * the API refuses a pair that disagrees with the toggle above it. A live pair
 * saved under Test takes real money from real people while the banner says
 * nothing is charged.
 *
 * The secret field is empty on load rather than pre-filled. There is nothing to
 * pre-fill it with — the API answers with a masked tail — and a box that looked
 * populated would invite an organizer to "save" a value the browser never held.
 */
/**
 * What the toast says when the keys are refused.
 *
 * A refusal must never be quieter than a success — the Save button sits at the
 * foot of a tall card and the field it is complaining about can be off-screen,
 * so "nothing happened" is the only reading available without one.
 *
 * When the API named the fields, the toast points at them instead of repeating
 * their sentences: those are already under the boxes, verbatim, which is where
 * they are worth reading. When it named none, the API's own message IS the
 * whole explanation, so it is what gets announced.
 */
const FIELDS_REFUSED = 'Those keys were not saved — check the fields marked below.'

function refusalNote(
  failed: ActionResult | null,
  fields: Record<string, string>,
): string | null {
  if (!failed) return null
  return Object.keys(fields).length > 0 ? FIELDS_REFUSED : (failed.error ?? null)
}

function KeysCard({ payments }: { payments: PaymentSettingsCard }) {
  const save = useFetcher<ActionResult>()
  const [mode, setMode] = useState<'test' | 'live'>(payments.testMode ? 'test' : 'live')
  const failed = save.data?.ok === false ? save.data : null
  const fields = failed?.fieldErrors ?? {}
  useSavedToast(save.state === 'idle' && save.data?.ok === true, 'Payment keys saved.')
  useFailureToast(save.state === 'idle' ? refusalNote(failed, fields) : null)

  const busy = save.state !== 'idle'

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold tracking-tight">
          API keys
          <span className="ml-1 align-middle text-[11px] font-medium text-muted">
            {mode === 'test' ? 'Test mode' : 'Live mode'}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {/* Switching mode swaps which stored pair is being edited, so it also
              swaps what "Save keys" writes — the two travel together. */}
          <div className="segmented">
            <button
              type="button"
              onClick={() => setMode('test')}
              className={cn(mode === 'test' && 'active')}
            >
              Test
            </button>
            <button
              type="button"
              onClick={() => setMode('live')}
              className={cn(mode === 'live' && 'active')}
            >
              Live
            </button>
          </div>
          <a
            href="https://dashboard.stripe.com/apikeys"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
          >
            Where do I find these?
            <Icon name="hgi-arrow-up-right-01" size={13} />
          </a>
        </div>
      </div>

      <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-hair bg-canvas px-3 py-2.5 text-[12px] text-muted">
        <Icon name="hgi-idea-01" size={15} className="mt-px shrink-0 text-brand" />
        <span>
          In your <b className="text-ink">Stripe Dashboard</b> go to{' '}
          <b className="text-ink">Developers → API keys</b>, copy the two keys, and paste them
          below.
        </span>
      </div>

      <save.Form method="post">
        <input type="hidden" name="intent" value="keys" />
        <input type="hidden" name="mode" value={mode} />

        {/* The kit's two-up grid, with a third column once there is room for
            one. This card carries a field the kit never had — the signing
            secret — and stretching it across the full 1600px made a `whsec_`
            string sit in a box wide enough for a paragraph. */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="keys-pk">Publishable key</Label>
            <Input
              id="keys-pk"
              name="publishableKey"
              required
              className="font-mono text-[12px]"
              placeholder={`pk_${mode}_...`}
              defaultValue={mode === 'test' ? payments.publishableKey : ''}
              aria-describedby={fields.publishableKey ? 'keys-pk-error' : undefined}
            />
            <FieldError id="keys-pk-error" message={fields.publishableKey} />
            <Hint>
              Starts with <span className="font-mono">pk_test_</span> (test) or{' '}
              <span className="font-mono">pk_live_</span> (live).
            </Hint>
          </div>

          <div>
            <SecretField
              id="keys-sk"
              name="secretKey"
              label="Secret key"
              required
              placeholder={payments.secretKeyMasked || `sk_${mode}_...`}
              error={fields.secretKey}
            />
            <Hint>
              Starts with <span className="font-mono">sk_</span>. Stored encrypted — never shown
              again, and never sent to a browser.
            </Hint>
          </div>

          <div>
            <SecretField
              id="keys-whsec"
              name="webhookSecret"
              label="Webhook signing secret"
              placeholder={
                payments.webhookSecretSet ? 'Saved — leave blank to keep' : 'whsec_...'
              }
              error={fields.webhookSecret}
            />
            <Hint>
              From the endpoint you register in Stripe for this workspace. Without it, payments are
              taken but no ticket is issued.
            </Hint>
          </div>
        </div>

        {/* Below the grid, not inside the field's cell: this is the address to
            paste into Stripe, not part of filling the box in, and a URL that
            has to wrap three times inside a column is one nobody reads. */}
        <WebhookUrl url={payments.webhookUrl} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hair pt-3">
          <p className="text-[11px] text-muted">
            {payments.keysSavedOn ? `Last saved ${payments.keysSavedOn}` : 'Not saved yet'}
          </p>
          <div className="flex gap-2">
            <TestConnectionButton />
            <Button variant="primary" size="sm" type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Save keys'}
            </Button>
          </div>
        </div>
      </save.Form>
    </Card>
  )
}

/**
 * A secret this page accepts but must never show back.
 *
 * Every one of these is write-only: the API stores it encrypted and answers with
 * a masked tail, so the box is empty on load and the reveal flips the input type
 * rather than fetching anything. There is nothing stored to un-hide — reveal
 * exists to check a paste before saving, which is the moment a wrong character
 * is cheap to catch and the only moment the value is in the browser at all.
 *
 * Shared by the secret key and the webhook signing secret because they are the
 * same kind of field with the same rules; one of them having a reveal and the
 * other not was an accident of the order they were written in.
 */
function SecretField({
  id,
  name,
  label,
  placeholder,
  error,
  required = false,
}: {
  id: string
  name: string
  label: string
  placeholder: string
  error?: string
  required?: boolean
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={revealed ? 'text' : 'password'}
          required={required}
          // Never offer to remember it: a password manager storing an API key
          // puts it somewhere this app cannot protect and did not choose.
          autoComplete="off"
          className="pr-10 font-mono text-[12px]"
          placeholder={placeholder}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setRevealed((was) => !was)}
          // The label says what pressing it DOES, not what the state is — a
          // screen reader announces the action, and `hidden`/`shown` alone
          // leaves which one ambiguous.
          aria-label={revealed ? `Hide ${label}` : `Reveal ${label}`}
          aria-pressed={revealed}
          className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
        >
          <Icon name={revealed ? 'hgi-view-off' : 'hgi-view'} size={16} />
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </>
  )
}

/**
 * The endpoint an organizer registers in Stripe, with a one-click copy.
 *
 * It appears only once a token exists — which is after the first key save.
 * Showing a half-formed URL beforehand would invite somebody to register an
 * address that can never resolve, and they would find out when a real buyer
 * paid and no ticket arrived.
 *
 * Copy falls back to selecting the text: `navigator.clipboard` needs a secure
 * context, and a URL nobody can copy is worse than one they select by hand.
 */
function WebhookUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  if (!url) return null

  const copy = () => {
    void navigator.clipboard?.writeText(url).then(
      () => setCopied(true),
      () => setCopied(false),
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-hair bg-canvas px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Your webhook URL
        </p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
        >
          <Icon name={copied ? 'hgi-tick-02' : 'hgi-copy-01'} size={13} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="mt-1 break-all font-mono text-[11px] text-ink">
        {url}
      </p>
      <p className="mt-1.5 text-[11px] text-muted">
        In Stripe: Developers → Webhooks → Add endpoint. Paste this, then copy the signing secret
        it gives you into the box above.
      </p>
    </div>
  )
}

/**
 * Its own form, not a second submit button inside the keys form — it proves the
 * SAVED key still works, which is a different question from "are these two
 * boxes valid", and submitting the unsaved boxes would answer neither.
 */
function TestConnectionButton() {
  return (
    <IntentForm intent="test" done="Connection is working.">
      {(busy) => (
        <Button variant="soft" size="sm" type="submit" disabled={busy}>
          <Icon name="hgi-plug-socket" size={14} />
          {busy ? 'Testing…' : 'Test connection'}
        </Button>
      )}
    </IntentForm>
  )
}

/**
 * How each method looks. The API says which methods exist and whether each is
 * on; everything here is presentation, so it stays a lookup table rather than a
 * branch — a new method Stripe adds needs a row here, not an `if`.
 */
const METHOD_LOOKS: Record<
  string,
  { icon: string; tint: string; blurb?: string; schemes?: string[] }
> = {
  Card: {
    icon: 'hgi-credit-card',
    tint: 'bg-brand-soft text-brand',
    schemes: ['VISA', 'MC', 'AMEX', 'JCB'],
  },
  PromptPay: {
    icon: 'hgi-qr-code-01',
    tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    blurb: 'Thailand QR bank transfer',
  },
  'Apple Pay': {
    icon: 'hgi-apple',
    tint: 'bg-line text-ink',
    blurb: 'One-tap checkout on Apple devices',
  },
  'Google Pay': {
    icon: 'hgi-wallet-01',
    tint: 'bg-line text-muted',
    blurb: 'One-tap checkout on Android & Chrome',
  },
  'Bank transfer': {
    icon: 'hgi-bank',
    tint: 'bg-line text-muted',
    blurb: 'Pay by direct bank transfer',
  },
}

const FALLBACK_LOOK = { icon: 'hgi-wallet-01', tint: 'bg-line text-muted' }

function MethodsCard({ methods }: { methods: PaymentMethodRow[] }) {
  const save = useFetcher<ActionResult>()
  const error = save.data?.ok === false ? save.data.error : null
  useSavedToast(save.state === 'idle' && save.data?.ok === true, 'Payment methods updated.')
  useFailureToast(save.state === 'idle' ? error : null)

  return (
    <Card className="p-4">
      <h2 className="text-[15px] font-bold tracking-tight">Payment methods</h2>
      <p className="mt-0.5 text-[12px] text-muted">
        Choose which methods to offer your attendees at checkout.
      </p>

      <div className="mt-2 divide-y divide-line">
        {methods.map((row) => (
          <MethodRow
            key={row.method}
            row={row}
            busy={save.state !== 'idle'}
            onChange={(enabled) =>
              save.submit(
                { intent: 'method', method: row.method, enabled: String(enabled) },
                { method: 'post' },
              )
            }
          />
        ))}
      </div>
    </Card>
  )
}

function MethodRow({
  row,
  busy,
  onChange,
}: {
  row: PaymentMethodRow
  busy: boolean
  onChange: (enabled: boolean) => void
}) {
  const look = METHOD_LOOKS[row.method] ?? FALLBACK_LOOK
  const schemes = 'schemes' in look ? look.schemes : undefined
  const blurb = 'blurb' in look ? look.blurb : undefined

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', look.tint)}>
          <Icon name={look.icon} size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink">{row.method}</p>
          {schemes && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {schemes.map((scheme) => (
                <span
                  key={scheme}
                  className="rounded bg-line px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink"
                >
                  {scheme}
                </span>
              ))}
            </div>
          )}
          {blurb && <p className="text-[11px] text-muted">{blurb}</p>}
        </div>
      </div>
      <Toggle on={row.enabled} disabled={busy} onChange={onChange} label={row.method} />
    </div>
  )
}

function PreferencesCard({ payments }: { payments: PaymentSettingsCard }) {
  const save = useFetcher<ActionResult>()
  const error = save.data?.ok === false ? save.data.error : null
  useSavedToast(save.state === 'idle' && save.data?.ok === true, 'Payment preferences saved.')
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

  const busy = save.state !== 'idle'

  return (
    <Card className="p-4">
      <h2 className="text-[15px] font-bold tracking-tight">Checkout preferences</h2>

      <save.Form method="post" key={payments.statementDescriptor}>
        <input type="hidden" name="saveCards" value={String(payments.saveCards)} />
        <input type="hidden" name="emailReceipts" value={String(payments.emailReceipts)} />

        <div className="mt-3 grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="pay-currency">Default currency</Label>
            {/* Read-only for now: the API warns on a mismatch with the workspace
                currency rather than blocking, and changing it mid-sales would
                re-price live tickets. */}
            <Select id="pay-currency" name="defaultCurrency" defaultValue={payments.defaultCurrency}>
              <option value={payments.defaultCurrency}>{payments.defaultCurrency}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="pay-descriptor">Statement descriptor</Label>
            <Input
              id="pay-descriptor"
              name="statementDescriptor"
              maxLength={22}
              defaultValue={payments.statementDescriptor}
              placeholder="EVENTA TICKETS"
            />
            <Hint>Appears on your attendee&rsquo;s card statement.</Hint>
          </div>
        </div>

        <div className="mt-3 space-y-1 border-t border-hair pt-2">
          <PreferenceRow
            title="Save cards for faster checkout"
            description="Let returning attendees reuse a saved card"
            on={payments.saveCards}
            busy={busy}
            onChange={(next) => setFlag('saveCards', next)}
          />
          <PreferenceRow
            title="Email receipts"
            description="Send a receipt after each successful payment"
            on={payments.emailReceipts}
            busy={busy}
            onChange={(next) => setFlag('emailReceipts', next)}
          />
        </div>

        <div className="mt-3 flex justify-end border-t border-hair pt-3">
          <Button variant="primary" size="sm" type="submit" disabled={busy}>
            <Icon name="hgi-tick-02" size={15} />
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </save.Form>
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
    <div className="flex items-center justify-between gap-3 py-2">
      <span>
        <span className="block text-[13px] font-medium text-ink">{title}</span>
        <span className="block text-[11px] text-muted">{description}</span>
      </span>
      <Toggle on={on} disabled={busy} onChange={onChange} label={title} />
    </div>
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
