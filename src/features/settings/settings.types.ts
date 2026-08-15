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
