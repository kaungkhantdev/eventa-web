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
}

const payments = (patch: Partial<PaymentSettingsWire> = {}) =>
  toPaymentSettingsCard({ ...PAYMENTS, ...patch })

describe('toPaymentSettingsCard', () => {
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
    })
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
})
