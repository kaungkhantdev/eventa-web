import { describe, expect, it } from 'vitest'
import { toOrganizationForm, toPaymentSettingsCard, toProfileCard } from './account.mapper'
import type { OrganizationWire, PaymentSettingsWire, ProfileWire } from './settings.types'

const PROFILE: ProfileWire = {
  id: 'u-1',
  name: 'Harper Nelson',
  email: 'harper@eventa.io',
  pendingEmail: null,
  emailVerified: true,
  phone: '+66 81 234 5678',
  phoneVerified: false,
  pendingPhone: null,
  timezone: 'Asia/Bangkok',
  locale: 'en',
  avatarUrl: null,
  city: 'Bangkok',
  dateOfBirth: null,
  bio: null,
  displayCurrency: null,
}

const profile = (patch: Partial<ProfileWire> = {}) => toProfileCard({ ...PROFILE, ...patch })

describe('toProfileCard', () => {
  it('carries the record through', () => {
    expect(profile()).toMatchObject({
      name: 'Harper Nelson',
      email: 'harper@eventa.io',
      phone: '+66 81 234 5678',
      city: 'Bangkok',
      emailVerified: true,
    })
  })

  it('derives initials for the avatar the API has no image for', () => {
    expect(profile().initials).toBe('HN')
  })

  // An empty input is what a form binds to; `null` would render "null".
  it('renders every absent field as empty rather than as null', () => {
    expect(profile({ phone: null, city: null, bio: null, timezone: null })).toMatchObject({
      phone: '',
      city: '',
      bio: '',
      timezone: '',
    })
  })

  it('defaults an unset language to English', () => {
    expect(profile({ locale: null }).locale).toBe('en')
    expect(profile({ locale: 'th' }).locale).toBe('th')
  })

  // A change of address is not complete until it is confirmed, and until then
  // the old one is still the one that works.
  it('reports an address awaiting confirmation', () => {
    expect(profile({ pendingEmail: 'new@eventa.io' }).pendingEmail).toBe('new@eventa.io')
    expect(profile().pendingEmail).toBeNull()
  })
})

const ORGANIZATION: OrganizationWire = {
  id: 1,
  name: 'Acme Events',
  slug: 'acme',
  logoUrl: null,
  address: null,
  website: null,
  taxId: '0105558123456',
  currency: 'THB',
  country: 'TH',
  timezone: 'Asia/Bangkok',
  locale: 'en',
  vatRatePercent: 7,
  statementDescriptor: null,
  version: 3,
}

const organization = (patch: Partial<OrganizationWire> = {}) =>
  toOrganizationForm({ ...ORGANIZATION, ...patch })

describe('toOrganizationForm', () => {
  it('carries the workspace through', () => {
    expect(organization()).toMatchObject({
      name: 'Acme Events',
      slug: 'acme',
      taxId: '0105558123456',
      currency: 'THB',
    })
  })

  it('renders the VAT rate rather than leaving a bare number to the page', () => {
    expect(organization().vatRate).toBe('7%')
    expect(organization({ vatRatePercent: 7.5 }).vatRate).toBe('7.5%')
  })

  // Without it a PATCH would silently overwrite an edit made in another tab.
  it('carries the version the next save has to echo back', () => {
    expect(organization().version).toBe(3)
  })

  it('renders every absent field as empty rather than as null', () => {
    expect(organization()).toMatchObject({ address: '', website: '', statementDescriptor: '' })
  })
})

const PAYMENTS: PaymentSettingsWire = {
  provider: 'stripe',
  mode: 'live',
  status: 'connected',
  accountId: 'acct_1QxYzAbCdEfGhIjK',
  publishableKey: 'pk_live_123',
  connectedAt: '2026-03-14T04:00:00.000Z',
  defaultCurrency: 'THB',
  statementDescriptor: 'ACME EVENTS',
  saveCards: true,
  emailReceipts: true,
  testMode: false,
  liveKeysAccepted: true,
  webhookUrl: 'https://api.eventa.test/api/v1/public/payments/webhook/tok_abc',
}

const payments = (patch: Partial<PaymentSettingsWire> = {}) =>
  toPaymentSettingsCard({ ...PAYMENTS, ...patch })

describe('toPaymentSettingsCard', () => {
  /**
   * The organizer registers this in Stripe by hand, so it is passed through
   * exactly as the API built it — and rendered empty, not as a broken URL,
   * before the first key save mints a token.
   */
  it('carries the workspace’s own webhook endpoint', () => {
    expect(payments().webhookUrl).toBe(
      'https://api.eventa.test/api/v1/public/payments/webhook/tok_abc',
    )
  })

  it('shows no webhook URL before one exists', () => {
    expect(payments({ webhookUrl: null }).webhookUrl).toBe('')
  })

  it('says which provider is connected, and in which mode', () => {
    expect(payments()).toMatchObject({
      provider: 'Stripe',
      connected: true,
      statusLabel: 'Connected · live',
      statusTone: 'green',
    })
  })

  it('marks test mode plainly — money taken there is not real', () => {
    expect(payments({ mode: 'test', testMode: true })).toMatchObject({
      statusLabel: 'Connected · test',
      statusTone: 'amber',
      takingTestPayments: true,
    })
  })

  /**
   * The banner is about a till that works but takes play money. A workspace
   * with no keys saved has no till at all, and the API still reports
   * `testMode` for it because test is what the mode defaults to.
   *
   * Warning them there anyway states two things that are not true: that they
   * are "using Test keys" when they are using none, and — by saying only that
   * REAL charges are not processed — that some charge is. The card underneath
   * already says Not connected, with the empty boxes to fix it.
   */
  it('does not warn about test keys when no keys are saved at all', () => {
    expect(
      payments({ status: 'disconnected', mode: 'test', testMode: true }),
    ).toMatchObject({
      connected: false,
      statusLabel: 'Not connected',
      takingTestPayments: false,
    })
  })

  it('does not warn a workspace that is live', () => {
    expect(payments().takingTestPayments).toBe(false)
  })

  /**
   * Kept separate from the banner on purpose: the Test/Live control seeds from
   * the configured mode, which is a real answer even with nothing saved yet.
   */
  it('still reports the configured mode when nothing is connected', () => {
    expect(payments({ status: 'disconnected', testMode: true }).testMode).toBe(true)
  })

  it('says so when nothing is connected', () => {
    expect(payments({ status: 'disconnected', accountId: null, connectedAt: null })).toMatchObject({
      connected: false,
      statusLabel: 'Not connected',
      statusTone: 'gray',
      accountRef: '—',
      connectedOn: '—',
    })
  })

  // The full account id is a credential-ish identifier and nothing on screen
  // needs it; the last four are enough to tell two accounts apart.
  it('masks the account to its last four', () => {
    expect(payments().accountRef).toBe('••••IjK')
  })

  it('reads the connection date on the Bangkok calendar', () => {
    expect(payments().connectedOn).toBe('Mar 14, 2026')
  })

  it('has no warnings unless the API sent some', () => {
    expect(payments().warnings).toEqual([])
    expect(payments({ warnings: ['Payouts are paused'] }).warnings).toEqual(['Payouts are paused'])
  })

  /**
   * Whether the Live tab may be offered at all.
   *
   * Only the server knows: outside production it refuses live keys outright,
   * because a live key there lets a seed script or a click round staging charge
   * a real card. The page cannot work that out for itself.
   */
  describe('whether this server would take live keys', () => {
    it('passes the API’s answer through', () => {
      expect(payments({ liveKeysAccepted: true }).liveKeysAccepted).toBe(true)
      expect(payments({ liveKeysAccepted: false }).liveKeysAccepted).toBe(false)
    })

    /**
     * Closed by default. An older API that does not send the field would
     * otherwise open a tab whose save is guaranteed to fail — and the failure
     * mode of guessing wrong the other way is a live key where one is refused.
     */
    it('assumes not, when the API says nothing', () => {
      expect(
        payments({ liveKeysAccepted: undefined as unknown as boolean }).liveKeysAccepted,
      ).toBe(false)
    })
  })
})
