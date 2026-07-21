/* Demo data for the Security settings page — ported verbatim from the inline
   <script> in admin/settings-security.html. */

/* ---------- Active sessions (static markup in the source) ---------- */

export type Session = {
  device: string
  meta: string
  /** The current device shows a "This device" badge instead of a Revoke button. */
  current: boolean
}

export const SESSIONS: Session[] = [
  { device: 'Chrome on macOS · Bangkok', meta: 'Current session · active now', current: true },
  { device: 'Safari on iPhone 15 · Bangkok', meta: 'Last active 2 hours ago', current: false },
  { device: 'Edge on Windows · Chiang Mai', meta: 'Last active 3 days ago', current: false },
]

/* ---------- Two-factor setup ---------- */

export const TWOFA_SECRET_DISPLAY = 'JBSW Y3DP EHPK 3PXP'
export const TWOFA_OTPAUTH =
  'otpauth://totp/Eventa:info@urbanflowers.co.th?secret=JBSWY3DPEHPK3PXP&issuer=Eventa'

export const RECOVERY_CODES = [
  '3f9a-2b71',
  'a4c0-91de',
  '77bd-e2f4',
  '1e6a-c8b3',
  'b90f-4a27',
  'de51-6c0a',
  '2caf-88e1',
  '9075-3fbd',
] as const

/* ---------- Audit log ---------- */

export type AuditType =
  | 'signin'
  | 'newdev'
  | 'pwd'
  | 'twofa'
  | 'perm'
  | 'xport'
  | 'fail'
  | 'apikey'
  | 'revoke'

export type AuditIcon = { i: string; c: string }

export const AUDIT_ICONS: Record<AuditType, AuditIcon> = {
  signin: { i: 'hgi-login-03', c: 'bg-brand-soft text-brand' },
  newdev: {
    i: 'hgi-smart-phone-01',
    c: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  },
  pwd: {
    i: 'hgi-shield-key',
    c: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  },
  twofa: { i: 'hgi-security-lock', c: 'bg-brand-soft text-brand' },
  perm: {
    i: 'hgi-user-settings-01',
    c: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  },
  xport: {
    i: 'hgi-download-01',
    c: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  },
  fail: {
    i: 'hgi-alert-02',
    c: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
  },
  apikey: { i: 'hgi-source-code', c: 'bg-line text-muted' },
  revoke: { i: 'hgi-logout-03', c: 'bg-line text-muted' },
}

export type AuditEvent = { t: AuditType; title: string; meta: string; time: string }

export const AUDIT_EVENTS: AuditEvent[] = [
  { t: 'signin', title: 'Signed in', meta: 'Chrome on macOS · Bangkok · 203.0.113.24', time: 'Just now' },
  { t: 'xport', title: 'Exported registrations', meta: 'Tech Summit 2026 · CSV · 1,340 rows', time: '2 hr ago' },
  { t: 'perm', title: 'Role changed', meta: 'Ploy S. → Admin · by Harper Nelson', time: 'Yesterday' },
  { t: 'newdev', title: 'New device signed in', meta: 'Safari on iPhone 15 · Bangkok', time: 'Jul 17' },
  { t: 'twofa', title: 'Two-factor authentication enabled', meta: 'Authenticator app', time: 'Jul 16' },
  { t: 'pwd', title: 'Password changed', meta: 'Chrome on macOS · Bangkok', time: 'Jul 16' },
  { t: 'fail', title: 'Failed sign-in attempt', meta: 'Unknown device · 45.61.x.x · blocked', time: 'Jul 15' },
  { t: 'apikey', title: 'API key created', meta: 'Live key · sk_live_••••7f2a', time: 'Jul 12' },
  { t: 'revoke', title: 'Session revoked', meta: 'Edge on Windows · Chiang Mai', time: 'Jul 10' },
  { t: 'xport', title: 'Exported payouts report', meta: 'Year · PDF', time: 'Jul 8' },
]
