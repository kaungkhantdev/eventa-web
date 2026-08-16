import type { BadgeTone } from '@/components/ui'

/** Workspace members, roles, security and notification preferences. */

/* ── members ──────────────────────────────────────────────────────────── */

export type MemberStatus = 'Active' | 'Invited' | 'Suspended'

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

/* ── security ─────────────────────────────────────────────────────────── */

export interface LoginSessionWire {
  id: string
  device: string
  ipAddress: string
  signedInAt: string
  expiresAt: string
  isCurrent: boolean
}

export interface TwoFactorWire {
  enabled: boolean
  /** Started but not confirmed — the QR was shown and nothing came back. */
  pending: boolean
  recoveryCodesRemaining: number
}

export interface SessionRow {
  id: string
  device: string
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

export interface NotificationPrefWire {
  category: NotificationCategory
  emailEnabled: boolean
  smsEnabled: boolean
  /** False where the product cannot send an SMS for this category at all. */
  smsAvailable: boolean
}

export interface NotificationRow {
  category: NotificationCategory
  title: string
  description: string
  emailEnabled: boolean
  smsEnabled: boolean
  smsAvailable: boolean
}

/* ── profile, organization and payments ───────────────────────────────── */

/** `GET /me/profile` — the signed-in person's own record. */
export interface ProfileWire {
  id: string
  name: string
  email: string
  /** An address awaiting confirmation; the old one is still in use. */
  pendingEmail: string | null
  emailVerified: boolean
  phone: string | null
  timezone: string | null
  locale: 'en' | 'th' | null
  avatarUrl: string | null
  city: string | null
  dateOfBirth: string | null
  bio: string | null
  displayCurrency: string | null
}

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

/** `GET /organization` — the workspace itself. */
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
export interface PaymentSettingsWire {
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
  testMode: boolean
  warnings: string[]
}
