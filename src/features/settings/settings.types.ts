import type { BadgeTone } from '@/components/ui'

/** Workspace members, roles, security and notification preferences. */

/* ── members ──────────────────────────────────────────────────────────── */

/**
 * `Invited` — an admin created this account and it is waiting to be accepted.
 * `Unconfirmed` — they signed themselves up; the email is not proven yet.
 * Different facts, different follow-up, so never one value (US-ACC-01/02).
 */
export type MemberStatus = 'Active' | 'Invited' | 'Unconfirmed' | 'Suspended'

export interface MemberWire {
  /** Membership id — not the user's. Suspending addresses the membership. */
  id: number
  userId: string
  name: string
  email: string
  roleId: number
  role: string
  status: MemberStatus
}

export interface MemberRow {
  id: number
  name: string
  email: string
  initials: string
  role: string
  roleId: number
  status: MemberStatus
  statusTone: BadgeTone
  /** Hugeicons slug shown inside the status pill. */
  statusIcon: string
  /** True while they have not accepted — the invite can be resent. */
  invited: boolean
  suspended: boolean
}

/* ── roles ────────────────────────────────────────────────────────────── */

export type PermissionGroup = 'Events' | 'Registrations' | 'Finance' | 'Settings'

export interface PermissionWire {
  key: string
  group: PermissionGroup
  label: string
}

export interface RoleWire {
  id: number
  name: string
  description: string
  permissions: string[]
  /**
   * Keys with no decision recorded for this role — never granted, and never
   * turned off either. A key in neither list was turned off deliberately, and
   * that difference is the whole contract: an automatic backfill was withdrawn
   * because nothing on disk could tell "never offered" from "an organizer said
   * no", so the gap is reported here and a person closes it.
   */
  neverOfferedPermissions: string[]
  /** Live members holding this role. */
  memberCount: number
  /** Built-in roles every workspace starts with. */
  isSystem: boolean
}

export interface RoleCard {
  id: number
  name: string
  description: string
  permissions: string[]
  /** Keys this role has no recorded decision for — see `RoleWire`. */
  neverOffered: string[]
  /** `3 members`, or `No members yet`. */
  members: string
  isSystem: boolean
}

/** One permission, ready for a checkbox. */
export interface PermissionOption {
  key: string
  /** The API's label, or the key itself when it has none recorded. */
  label: string
  group: PermissionGroup
}

/** One permission as the roles editor draws it, with its state resolved. */
export interface PermissionRow {
  key: string
  label: string
  /**
   * True only for the third state — this role has no decision recorded for the
   * key. The switch is off either way; this is what lets the editor say *why*,
   * instead of drawing a gap and a refusal identically.
   */
  neverOffered: boolean
}

/* ── security ─────────────────────────────────────────────────────────── */

/**
 * The account wires come from `@/lib/api`: the attendee portal reads the very
 * same `/me/*` routes, and this file used to carry a second, independently
 * hand-written copy of each — which had already drifted (`ipAddress` was
 * `string` here and `string | null` there; the API says nullable).
 */
import type { NotificationPreferenceWire as SharedNotificationWire } from '@/lib/api'

export type {
  LoginSessionWire,
  NotificationPreferencePatch,
  RecoveryCodesWire,
  TwoFactorStartWire,
  TwoFactorWire,
} from '@/lib/api'

export interface SessionRow {
  id: string
  device: string
  /** `—` where the API recorded none; a blank cell reads as a bug. */
  ipAddress: string
  /** `Aug 14, 2026 · 16:37`, Bangkok. */
  signedIn: string
  isCurrent: boolean
}

/* ── notifications ────────────────────────────────────────────────────── */

export type NotificationCategory =
  | 'registration'
  | 'payment'
  | 'sales'
  | 'feedback'
  | 'payout'
  | 'alert'
  | 'task'

/** This console's own category set over the shared wire shape. */
export type NotificationPrefWire = SharedNotificationWire<NotificationCategory>

export interface NotificationRow {
  category: NotificationCategory
  title: string
  description: string
  emailEnabled: boolean
  smsEnabled: boolean
  smsAvailable: boolean
}

/* ── profile, organization and payments ───────────────────────────────── */

/**
 * `ProfileWire` comes from `@/lib/api`: the attendee portal's Profile tab
 * edits the same `/me/profile` row, and this file used to carry a second,
 * independently hand-written copy of the shape.
 */
export type { ProfilePatch, ProfileWire } from '@/lib/api'

export interface ProfileCard {
  name: string
  email: string
  initials: string
  avatarUrl: string | null
  emailVerified: boolean
  /** The address awaiting confirmation, or `null` when none is. */
  pendingEmail: string | null
  phone: string
  timezone: string
  locale: 'en' | 'th'
  city: string
  bio: string
}

/**
 * `GET /organization` — the workspace itself.
 *
 * The logo upload the API issues is not declared here: it is `IssuedUpload` in
 * `@/lib/signedUpload`, one shape for every image this app uploads, with the
 * note on what its signed headers bind and why they go verbatim.
 */
export interface OrganizationWire {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  address: string | null
  website: string | null
  taxId: string | null
  currency: string
  country: string
  timezone: string
  locale: string
  vatRatePercent: number
  statementDescriptor: string | null
  /** Echoed back on PATCH so a stale form cannot overwrite a newer edit. */
  version: number
}

export interface OrganizationForm {
  name: string
  slug: string
  logoUrl: string | null
  address: string
  website: string
  taxId: string
  currency: string
  country: string
  timezone: string
  /** Already rendered — `7%`, not `7`. */
  vatRate: string
  statementDescriptor: string
  version: number
}

/** `GET /payment-settings` — how money reaches this workspace. */
/**
 * What the API says about stored keys. Note what is absent, deliberately: the
 * secret key and the webhook signing secret. `secretKeyMasked` answers the only
 * question the screen has — WHICH key is saved — and is useless for anything else.
 */
/** One payment method as the API reports it (US-SET-09). */
export interface PaymentMethodWire {
  method: string
  enabled: boolean
}

/**
 * A method row as the kit draws it: the API says which methods exist and
 * whether each is on; the icon, blurb and card-scheme badges are presentation
 * and live in the page's own lookup table.
 */
export interface PaymentMethodRow {
  method: string
  enabled: boolean
}

/** One audit entry as the API reports it (US-ACC-07). */
export interface AuditEntryWire {
  id: number
  type: string
  title: string
  meta: string | null
  actorName: string | null
  ipAddress: string | null
  occurredAt: string
}

/**
 * An audit row as the kit draws it: the API supplies the facts, and the icon
 * and tint come from a lookup keyed on `type`. `when` is already formatted in
 * Asia/Bangkok — no page does that arithmetic itself.
 */
export interface AuditRow {
  id: number
  type: string
  title: string
  /** Actor, IP and anything else the entry carried, joined for one line. */
  detail: string
  when: string
}

/** Counts beside the logo — derived by the API, never stored. */
export interface OrganizationSummaryWire {
  eventsHosted: number
  teamMembers: number
}

export interface StoredKeysWire {
  mode: 'test' | 'live'
  publishableKey: string
  secretKeyMasked: string
  webhookSecretSet: boolean
  savedAt: string | null
}

export interface PaymentSettingsWire {
  webhookUrl: string | null
  provider: 'stripe'
  mode: 'test' | 'live'
  status: 'disconnected' | 'connected'
  accountId: string | null
  publishableKey: string | null
  connectedAt: string | null
  defaultCurrency: string
  statementDescriptor: string | null
  saveCards: boolean
  emailReceipts: boolean
  testMode: boolean
  /** Whether THIS server accepts live keys — false outside production. */
  liveKeysAccepted: boolean
  warnings?: string[]
}

export interface PaymentSettingsCard {
  provider: string
  connected: boolean
  /** `Connected · live` or `Not connected`. */
  statusLabel: string
  statusTone: BadgeTone
  /** Masked to the last four; the full id is not needed on screen. */
  accountRef: string
  connectedOn: string
  defaultCurrency: string
  statementDescriptor: string
  saveCards: boolean
  emailReceipts: boolean
  /** The configured mode — seeds the Test/Live control even before any save. */
  testMode: boolean
  /** True only when a CONNECTED workspace is on test keys — the banner's fact. */
  takingTestPayments: boolean
  warnings: string[]
  /** The stored publishable key — public by design, so shown in full. */
  publishableKey: string
  /** Last four of the stored secret — never the key. Empty when none is saved. */
  secretKeyMasked: string
  /** Whether a webhook signing secret is stored. Never the secret itself. */
  webhookSecretSet: boolean
  /** When the keys were last saved, already formatted. Empty when never. */
  keysSavedOn: string
  /** This workspace's own webhook endpoint. Empty until keys are first saved. */
  webhookUrl: string
  /** Whether this server would accept live keys at all — gates the Live tab. */
  liveKeysAccepted: boolean
}
