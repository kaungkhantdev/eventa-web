/**
 * The settings screens' visual vocabulary — the lookups that turn a stored
 * value into an icon and a tint.
 *
 * They live here rather than in the page because a page that exports anything
 * besides its component breaks Fast Refresh (`react-refresh/only-export-components`
 * says as much), and a lookup no test can import is a lookup nothing stops
 * drifting from the API that feeds it.
 */

/**
 * Every value the `audit_type` pgEnum (`eventa-api/src/db/schema/enums.ts`)
 * can store, which is every value this page can be asked to draw.
 *
 * `AuditEntryDto.type` is declared as a bare `string` and the audit service
 * hands the stored column through unmapped, so nothing on the wire narrows it
 * for us: this union is the whole of the web's knowledge of that enum, and
 * `AUDIT_LOOKS` is a total map of it so a value added here cannot be left
 * without a look of its own.
 */
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
  // Appended in the API for Finance (E9) and the door (E8). All three are
  // written today — `invoices.repository.ts`, `payouts.repository.ts` and
  // `check-in.repository.ts` each insert their own audit type — so all three
  // arrive in this log and need an icon that is not a sign-in's.
  | 'invoice'
  | 'payout'
  | 'checkin'

export interface AuditLook {
  /** A Hugeicons slug; a wrong one renders as tofu, so keep it exact. */
  icon: string
  tint: string
}

/**
 * How each kind of audit entry looks. Presentation only, so it stays a lookup
 * table — a new entry type is one row here rather than a branch anywhere.
 *
 * The three newest borrow the glyph the rest of the product already uses for
 * that act: the Invoices page's `hgi-invoice-01`, the Payouts page's
 * `hgi-bank`, and the attendance report's `hgi-user-check-01`.
 */
export const AUDIT_LOOKS: Record<AuditType, AuditLook> = {
  signin: { icon: 'hgi-login-03', tint: 'bg-brand-soft text-brand' },
  newdev: {
    icon: 'hgi-smart-phone-01',
    tint: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  },
  pwd: {
    icon: 'hgi-shield-key',
    tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  },
  twofa: { icon: 'hgi-security-lock', tint: 'bg-brand-soft text-brand' },
  perm: {
    icon: 'hgi-user-settings-01',
    tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  },
  xport: {
    icon: 'hgi-download-01',
    tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  },
  fail: {
    icon: 'hgi-alert-02',
    tint: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
  },
  apikey: { icon: 'hgi-source-code', tint: 'bg-line text-muted' },
  revoke: { icon: 'hgi-logout-03', tint: 'bg-line text-muted' },
  invoice: {
    icon: 'hgi-invoice-01',
    tint: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
  },
  payout: {
    icon: 'hgi-bank',
    tint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  },
  checkin: {
    icon: 'hgi-user-check-01',
    tint: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300',
  },
}

/**
 * What an entry type this build has never been taught looks like.
 *
 * Deliberately a neutral record glyph. It used to be the sign-in icon, so
 * every type the lookup missed was drawn as a sign-in — a voided invoice, a
 * moved payout and a manual door admission all read as "somebody signed in",
 * which is the one claim a security log must never make by accident.
 */
export const AUDIT_FALLBACK: AuditLook = { icon: 'hgi-note-03', tint: 'bg-line text-muted' }

/**
 * `AuditRow.type` is a plain string, so the narrowing happens here: a value
 * outside the union misses every key and takes the neutral fallback instead of
 * borrowing another kind's icon.
 */
export function auditLook(type: string): AuditLook {
  return AUDIT_LOOKS[type as AuditType] ?? AUDIT_FALLBACK
}
