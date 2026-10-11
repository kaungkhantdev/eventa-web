import type { BadgeTone } from '@/components/ui'
import { MASKED, bangkokDate, bangkokTime, initials } from '@/lib/format'
import type {
  AuditEntryWire,
  AuditRow,
  LoginSessionWire,
  MemberRow,
  MemberStatus,
  MemberWire,
  NotificationCategory,
  NotificationPrefWire,
  NotificationRow,
  PermissionOption,
  PermissionRow,
  PermissionWire,
  RoleCard,
  RoleWire,
  SessionRow,
} from './settings.types'

/** The rules behind the settings screens (US-ACC-*, US-SET-*). */

const STATUS_META: Record<MemberStatus, { tone: BadgeTone; icon: string }> = {
  Active: { tone: 'green', icon: 'hgi-checkmark-badge-01' },
  Invited: { tone: 'amber', icon: 'hgi-mail-send-01' },
  Unconfirmed: { tone: 'amber', icon: 'hgi-clock-01' },
  Suspended: { tone: 'red', icon: 'hgi-cancel-circle' },
}

export function toMemberRow(wire: MemberWire): MemberRow {
  return {
    id: wire.id,
    name: wire.name,
    email: wire.email,
    initials: initials(wire.name),
    role: wire.role,
    roleId: wire.roleId,
    status: wire.status,
    statusTone: STATUS_META[wire.status].tone,
    statusIcon: STATUS_META[wire.status].icon,
    // The two states an admin acts on differently: an invitation can be sent
    // again, and a suspended member is reactivated rather than suspended.
    //
    // `Invited` only — NOT `Unconfirmed`. Someone who signed themselves up has
    // no invitation to resend; offering the button would send them a token for
    // a workspace invite that never existed. Their own confirmation link is
    // re-sent by trying to sign in.
    invited: wire.status === 'Invited',
    suspended: wire.status === 'Suspended',
  }
}

export function toRoleCard(wire: RoleWire): RoleCard {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    permissions: wire.permissions,
    neverOffered: wire.neverOfferedPermissions,
    members: memberCount(wire.memberCount),
    isSystem: wire.isSystem,
  }
}

/** "0 members" reads as a defect; a role nobody holds yet is a normal state. */
function memberCount(count: number): string {
  if (count === 0) return 'No members yet'
  return `${count} ${count === 1 ? 'member' : 'members'}`
}

/**
 * A permission, ready to be offered as a checkbox.
 *
 * Some come back with the key as their own label. "evCreate" is not a sentence
 * to put in front of somebody deciding what a role may do, so a key is spaced
 * out into something readable rather than shown raw.
 */
export function toPermissionOption(wire: PermissionWire): PermissionOption {
  return {
    key: wire.key,
    label: wire.label === wire.key ? humanise(wire.key) : wire.label,
    group: wire.group,
  }
}

function humanise(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * The switches a freshly opened editor starts with, and the set a save submits.
 *
 * The role's own grants, and deliberately nothing derived from the catalog rows
 * drawn beside them, so a key the catalog no longer lists stays in the set.
 * That key has no switch on screen and so cannot be turned off; keeping it
 * here is what stops `RolesPage`, which submits this set verbatim as the `PUT`
 * payload, from withdrawing a grant nobody touched — the same reversal the
 * backfill was removed for. The guarantee needs both halves: narrowing this
 * seed, or submitting anything other than this set, reintroduces it.
 *
 * A never-offered key is absent because nothing here has answered it yet.
 */
export function grantedSeed(role: RoleCard | null): Set<string> {
  return new Set(role?.permissions ?? [])
}

/**
 * The editor's permission rows, with each key's state resolved.
 *
 * `role_permissions` carries three states and only two of them are grants: a
 * row saying yes, a row saying no, and no row at all. The first two are
 * decisions this workspace made; the third is a question nobody here has been
 * asked, and it reaches the editor because the automatic backfill that used to
 * answer it was withdrawn — every version of it silently reversed an
 * organizer's "no". So this marks the gaps, and leaves a refusal unmarked.
 *
 * `options` decides membership and order — a key the catalog has dropped must
 * not surface as a question nobody can answer. Whether that order matches the
 * server's is settled upstream, where the catalog is fetched; this function
 * preserves whatever it is handed rather than sorting it again.
 */
export function toPermissionRows(
  options: readonly PermissionOption[],
  role: RoleCard | null,
  /** The keys the form has switched on right now — `grantedSeed` plus edits. */
  pending: ReadonlySet<string>,
): PermissionRow[] {
  // A role being created has no decisions recorded at all, so every key in the
  // catalog would qualify — a wall of markers saying nothing, in front of
  // somebody who is deciding all of them right now.
  const gaps = new Set(role?.neverOffered ?? [])
  const granted = new Set(role?.permissions ?? [])

  return options.map((option) => ({
    key: option.key,
    label: option.label,
    // Two different answers close the question, and either one is enough.
    //
    // A recorded grant settles it on the server's side: the API reports the two
    // lists disjoint, but a payload that contradicted itself must not leave a
    // switch reading "on" and "never decided" at once — and switching that key
    // off is then an answer too, not a reopened question.
    //
    // The pending set settles it on this screen's side: the organizer has
    // answered the row, and a marker still saying nobody has would contradict
    // the switch beside it until the page was reloaded.
    neverOffered:
      gaps.has(option.key) && !granted.has(option.key) && !pending.has(option.key),
  }))
}

/**
 * Browsers lie about each other, so the order here IS the rule: Edge claims to
 * be Chrome, Chrome claims to be Safari, and every one of them opens with
 * "Mozilla/5.0". The most specific claim has to be tested first.
 */
const BROWSERS: readonly (readonly [RegExp, string])[] = [
  [/\bEdg[e/]/, 'Edge'],
  [/\bOPR\/|\bOpera\b/, 'Opera'],
  [/\bFirefox\//, 'Firefox'],
  [/\bChrome\//, 'Chrome'],
  [/\bSafari\//, 'Safari'],
]

/** Same rule: iPhone and iPad are Mac-like, so they are checked before macOS. */
const PLATFORMS: readonly (readonly [RegExp, string])[] = [
  [/\biPhone\b/, 'iPhone'],
  [/\biPad\b/, 'iPad'],
  [/\bAndroid\b/, 'Android'],
  [/\bWindows\b/, 'Windows'],
  [/\bMac OS X\b|\bMacintosh\b/, 'macOS'],
  [/\bLinux\b|\bX11\b/, 'Linux'],
]

const UNKNOWN_DEVICE = 'Unknown device'

/**
 * A device an organizer can recognise (US-ACC-06).
 *
 * The sessions card exists so somebody can spot a sign-in that was not theirs.
 * The API sends a raw user-agent, and two rows of truncated
 * "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleW…" are identical on
 * screen — which makes the one question the card asks impossible to answer.
 *
 * Deliberately coarse. A version number would age the row without helping
 * anybody recognise it, and a UA nobody anticipated returns a plain label
 * rather than falling back to the raw string this replaced.
 */
export function describeDevice(userAgent: string): string {
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1]
  const platform = PLATFORMS.find(([pattern]) => pattern.test(userAgent))?.[1]
  if (!browser || !platform) return UNKNOWN_DEVICE
  return `${browser} on ${platform}`
}

export function toSessionRow(wire: LoginSessionWire): SessionRow {
  return {
    id: wire.id,
    device: describeDevice(wire.device),
    // `—`, not an empty cell: the API records no address for some sessions
    // (`inet()` is nullable), and a blank reads as a column that failed.
    ipAddress: wire.ipAddress ?? MASKED,
    // Somebody checking whether a sign-in was theirs is reading their own
    // clock, which in this product is Bangkok's.
    signedIn: `${bangkokDate(wire.signedInAt)} · ${bangkokTime(wire.signedInAt)}`,
    isCurrent: wire.isCurrent,
  }
}

/**
 * One audit entry, ready to render (US-ACC-07).
 *
 * Every fact except the title is optional at the source — an entry raised by a
 * background job has no actor, one raised from a console has no IP — so the
 * detail line is assembled from what is present. A template with holes in it
 * would print stray separators around the gaps.
 */
export function toAuditRow(wire: AuditEntryWire): AuditRow {
  return {
    id: wire.id,
    type: wire.type,
    title: wire.title,
    detail: [wire.meta, wire.actorName, wire.ipAddress].filter(Boolean).join(' · '),
    // Somebody auditing their own account is reading their own clock, which in
    // this product is Bangkok's.
    when: `${bangkokDate(wire.occurredAt)} · ${bangkokTime(wire.occurredAt)}`,
  }
}

/** What each notification category is, in the organizer's terms. */
const CATEGORY: Record<NotificationCategory, { title: string; description: string }> = {
  registration: {
    title: 'Registrations',
    description: 'Someone registers for one of your events.',
  },
  payment: { title: 'Payments', description: 'A charge succeeds, fails or is refunded.' },
  sales: { title: 'Sales milestones', description: 'A ticket type sells out or is running low.' },
  feedback: { title: 'Feedback', description: 'An attendee leaves a rating or a comment.' },
  payout: { title: 'Payouts', description: 'Money is on its way to your bank account.' },
  alert: { title: 'Operational alerts', description: 'Something needs your attention today.' },
  task: { title: 'Tasks', description: 'A reminder about work assigned to you.' },
}

export function toNotificationRow(wire: NotificationPrefWire): NotificationRow {
  const meta = CATEGORY[wire.category]
  return {
    category: wire.category,
    title: meta.title,
    description: meta.description,
    emailEnabled: wire.emailEnabled,
    // Unavailable and off are different facts: one is the product not offering
    // it, the other is a choice this person made.
    smsEnabled: wire.smsEnabled,
    smsAvailable: wire.smsAvailable,
  }
}
