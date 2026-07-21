import { useState } from 'react'
import { Button, Label, Hint, Input, Select, Icon, Segmented } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SettingsHeader } from '../components/SettingsHeader'
import { Toggle } from '../components/Toggle'

type Mode = 'test' | 'live'

/** The two key sets the mode toggle swaps between — Live keys are unset until
 *  the merchant pastes them, so switching to Live clears the fields. */
const KEYS: Record<Mode, { pub: string; secret: string }> = {
  test: { pub: 'pk_test_51P9xEventa0aB3kY7cQ', secret: 'sk_test_51P9xEventa7hV6tL1pX' },
  live: { pub: '', secret: '' },
}

export default function SettingsPaymentsPage() {
  const [mode, setMode] = useState<Mode>('test')
  const [pub, setPub] = useState(KEYS.test.pub)
  const [secret, setSecret] = useState(KEYS.test.secret)
  const [showSecret, setShowSecret] = useState(false)

  const [methods, setMethods] = useState({
    cards: true,
    promptpay: true,
    applepay: true,
    googlepay: false,
    bank: false,
  })
  const [prefs, setPrefs] = useState({ saveCards: true, receipts: true })

  const onMode = (next: Mode) => {
    setMode(next)
    setPub(KEYS[next].pub)
    setSecret(KEYS[next].secret)
    setShowSecret(false)
  }

  const connected = pub.trim() !== ''
  const modeLabel = mode === 'test' ? 'Test mode' : 'Live mode'

  return (
    <>
      <SettingsHeader
        title="Payments"
        subtitle="Payment provider, API keys and checkout preferences."
      />

      <div className="space-y-3">
        {/* test-mode banner */}
        {mode === 'test' && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
            <Icon name="hgi-alert-circle" size={16} />
            <span>
              You're using <b>Test keys</b> — no real charges are processed. Add your Live keys to
              accept payments.
            </span>
          </div>
        )}

        {/* connection status (full width — it's the header/context) */}
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#635BFF] text-white shadow-sm">
                <Icon name="hgi-credit-card" size={20} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-bold tracking-tight">Stripe</h2>
                  <span className={cn('badge', connected ? 'badge-green' : 'badge-gray')}>
                    <Icon
                      name={connected ? 'hgi-checkmark-badge-01' : 'hgi-alert-circle'}
                      size={12}
                    />
                    {connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted">
                  Your payment gateway for cards, PromptPay and wallets.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Segmented
                items={[
                  { value: 'test', label: 'Test' },
                  { value: 'live', label: 'Live' },
                ]}
                value={mode}
                onChange={onMode}
              />
              <button
                type="button"
                className="btn btn-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
              >
                Disconnect
              </button>
            </div>
          </div>
        </section>

        {/* API keys (paste from Stripe) */}
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold tracking-tight">
              API keys{' '}
              <span className="ml-1 align-middle text-[11px] font-medium text-muted">
                {modeLabel}
              </span>
            </h2>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
            >
              Where do I find these?
              <Icon name="hgi-arrow-up-right-01" size={13} />
            </a>
          </div>
          <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-hair bg-canvas px-3 py-2.5 text-[12px] text-muted">
            <Icon name="hgi-idea-01" size={15} className="mt-px shrink-0 text-brand" />
            <span>
              In your <b className="text-ink">Stripe Dashboard</b> go to{' '}
              <b className="text-ink">Developers → API keys</b>, copy the two keys, and paste them
              below.
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Publishable key</Label>
              <Input
                className="font-mono text-[12px]"
                placeholder="pk_test_..."
                value={pub}
                onChange={(e) => setPub(e.target.value)}
              />
              <Hint>
                Starts with <span className="font-mono">pk_test_</span> (test) or{' '}
                <span className="font-mono">pk_live_</span> (live).
              </Hint>
            </div>
            <div>
              <Label>Secret key</Label>
              <div className="relative">
                <Input
                  className="pr-10 font-mono text-[12px]"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="sk_test_..."
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((s) => !s)}
                  className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
                  title="Reveal"
                >
                  <Icon name={showSecret ? 'hgi-view-off' : 'hgi-view'} size={16} />
                </button>
              </div>
              <Hint>
                Starts with <span className="font-mono">sk_</span>. Stored encrypted — never shown to
                attendees.
              </Hint>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hair pt-3">
            <p className="text-[11px] text-muted">Last saved Jul 9, 2026 · 14:22</p>
            <div className="flex gap-2">
              <Button variant="soft" size="sm">
                <Icon name="hgi-plug-socket" size={14} />
                Test connection
              </Button>
              <Button variant="primary" size="sm">
                Save keys
              </Button>
            </div>
          </div>
        </section>

        {/* config: methods + checkout preferences side by side */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
          {/* payment methods */}
          <section className="card p-4">
            <h2 className="text-[15px] font-bold tracking-tight">Payment methods</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Choose which methods to offer your attendees at checkout.
            </p>
            <div className="mt-2 divide-y divide-line">
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                    <Icon name="hgi-credit-card" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">Cards</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink">
                        VISA
                      </span>
                      <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink">
                        MC
                      </span>
                      <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink">
                        AMEX
                      </span>
                      <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink">
                        JCB
                      </span>
                    </div>
                  </div>
                </div>
                <Toggle
                  on={methods.cards}
                  onChange={(v) => setMethods((m) => ({ ...m, cards: v }))}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <Icon name="hgi-qr-code-01" size={16} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">PromptPay</p>
                    <p className="text-[11px] text-muted">Thailand QR bank transfer</p>
                  </div>
                </div>
                <Toggle
                  on={methods.promptpay}
                  onChange={(v) => setMethods((m) => ({ ...m, promptpay: v }))}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-line text-ink">
                    <Icon name="hgi-apple" size={16} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">Apple Pay</p>
                    <p className="text-[11px] text-muted">One-tap checkout on Apple devices</p>
                  </div>
                </div>
                <Toggle
                  on={methods.applepay}
                  onChange={(v) => setMethods((m) => ({ ...m, applepay: v }))}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-line text-muted">
                    <Icon name="hgi-wallet-01" size={16} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">Google Pay</p>
                    <p className="text-[11px] text-muted">One-tap checkout on Android &amp; Chrome</p>
                  </div>
                </div>
                <Toggle
                  on={methods.googlepay}
                  onChange={(v) => setMethods((m) => ({ ...m, googlepay: v }))}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-1">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-line text-muted">
                    <Icon name="hgi-bank" size={16} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">Bank transfer</p>
                    <p className="text-[11px] text-muted">Pay by direct bank transfer</p>
                  </div>
                </div>
                <Toggle
                  on={methods.bank}
                  onChange={(v) => setMethods((m) => ({ ...m, bank: v }))}
                />
              </div>
            </div>
          </section>

          {/* checkout preferences */}
          <section className="card p-4">
            <h2 className="text-[15px] font-bold tracking-tight">Checkout preferences</h2>
            <div className="mt-3 grid grid-cols-1 gap-4">
              <div>
                <Label>Default currency</Label>
                <Select defaultValue="Thai Baht (฿ THB)">
                  <option>Thai Baht (฿ THB)</option>
                  <option>US Dollar ($ USD)</option>
                  <option>Euro (€ EUR)</option>
                  <option>Singapore Dollar (S$ SGD)</option>
                </Select>
              </div>
              <div>
                <Label>Statement descriptor</Label>
                <Input defaultValue="EVENTA TICKETS" maxLength={22} />
                <Hint>Appears on your attendee's card statement.</Hint>
              </div>
            </div>
            <div className="mt-3 space-y-1 border-t border-hair pt-2">
              <label className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="block text-[13px] font-medium text-ink">
                    Save cards for faster checkout
                  </span>
                  <span className="block text-[11px] text-muted">
                    Let returning attendees reuse a saved card
                  </span>
                </span>
                <Toggle
                  on={prefs.saveCards}
                  onChange={(v) => setPrefs((p) => ({ ...p, saveCards: v }))}
                />
              </label>
              <label className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="block text-[13px] font-medium text-ink">Email receipts</span>
                  <span className="block text-[11px] text-muted">
                    Send a receipt after each successful payment
                  </span>
                </span>
                <Toggle
                  on={prefs.receipts}
                  onChange={(v) => setPrefs((p) => ({ ...p, receipts: v }))}
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end border-t border-hair pt-3">
              <Button variant="primary">Save changes</Button>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
