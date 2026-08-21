import { MASKED, bangkokDate, initials } from '@/lib/format'
import type {
  StoredKeysWire,
  OrganizationForm,
  OrganizationWire,
  PaymentSettingsCard,
  PaymentSettingsWire,
  ProfileCard,
  ProfileWire,
} from './settings.types'

/**
 * The three account screens: who you are, who the workspace is, and how money
 * reaches it (US-ACC-01/02/03, US-DISC-11).
 *
 * PCI SAQ-A: nothing here touches a card. The payment screen shows the state
 * of the connection to the provider — connected or not, which mode, which
 * account — and the card details live entirely on the provider's side.
 */

/** A form binds to a string; `null` in an input renders the word "null". */
const text = (value: string | null | undefined): string => value ?? ''

const DEFAULT_LOCALE = 'en' as const

export function toProfileCard(profile: ProfileWire): ProfileCard {
  return {
    name: profile.name,
    email: profile.email,
    initials: initials(profile.name),
    avatarUrl: profile.avatarUrl,
    emailVerified: profile.emailVerified,
    // A change of address is not done until it is confirmed, and the old one
    // still works until then — so it is shown rather than quietly swapped.
    pendingEmail: profile.pendingEmail,
    phone: text(profile.phone),
    timezone: text(profile.timezone),
    locale: profile.locale ?? DEFAULT_LOCALE,
    city: text(profile.city),
    bio: text(profile.bio),
  }
}

export function toOrganizationForm(organization: OrganizationWire): OrganizationForm {
  return {
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.logoUrl,
    address: text(organization.address),
    website: text(organization.website),
    taxId: text(organization.taxId),
    currency: organization.currency,
    country: organization.country,
    timezone: organization.timezone,
    vatRate: `${organization.vatRatePercent}%`,
    statementDescriptor: text(organization.statementDescriptor),
    // Echoed back on save, so a form opened before somebody else's edit is
    // refused rather than silently overwriting it.
    version: organization.version,
  }
}

const PROVIDER_NAMES: Record<string, string> = { stripe: 'Stripe' }

/** How many characters of the account id are enough to tell two apart. */
const ACCOUNT_TAIL = 3

export function toPaymentSettingsCard(
  settings: PaymentSettingsWire,
  keys?: StoredKeysWire,
): PaymentSettingsCard {
  const connected = settings.status === 'connected'
  return {
    provider: PROVIDER_NAMES[settings.provider] ?? settings.provider,
    connected,
    statusLabel: connected ? `Connected · ${settings.mode}` : 'Not connected',
    // Test mode is amber on purpose: a workspace that looks connected but is
    // taking play money is a state somebody needs to notice.
    statusTone: connected ? (settings.mode === 'live' ? 'green' : 'amber') : 'gray',
    accountRef: maskAccount(settings.accountId),
    connectedOn: settings.connectedAt ? bangkokDate(settings.connectedAt) : MASKED,
    defaultCurrency: settings.defaultCurrency,
    statementDescriptor: text(settings.statementDescriptor),
    saveCards: settings.saveCards,
    emailReceipts: settings.emailReceipts,
    testMode: settings.testMode,
    warnings: settings.warnings ?? [],
    // Never the key. The API only ever sends a tail, and this only passes it on.
    secretKeyMasked: keys?.secretKeyMasked ?? '',
    webhookSecretSet: keys?.webhookSecretSet ?? false,
    keysSavedOn: keys?.savedAt ? bangkokDate(keys.savedAt) : '',
  }
}

/** Nothing on screen needs the whole identifier; its tail distinguishes it. */
function maskAccount(accountId: string | null): string {
  if (!accountId) return MASKED
  return `••••${accountId.slice(-ACCOUNT_TAIL)}`
}
