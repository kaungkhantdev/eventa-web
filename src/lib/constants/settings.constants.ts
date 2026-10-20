import { UPLOADABLE_IMAGE_TYPES, UPLOAD_MAX_MIB, acceptAttribute } from '@/lib/imageUploads'
import type { ImageRefusal } from '@/lib/imageUploads'

/** The settings module's named constants. */

export const DEFAULT_LOCALE = 'en' as const

export const PROVIDER_NAMES: Record<string, string> = { stripe: 'Stripe' }

/** How many characters of the account id are enough to tell two apart. */
export const ACCOUNT_TAIL = 3

/** The API route. Behind the bearer token, so fetched through `useDownload`. */
export const AUDIT_EXPORT_PATH = '/audit/export'

/** Bangkok keeps UTC+7 all year, so a day there is always exactly this long. */
export const DAY_MS = 24 * 60 * 60 * 1000

/** Where an Admin connects, reconnects and disconnects Google Calendar. */
export const INTEGRATIONS_PATH = '/admin/settings-integrations'

/** The search parameter eventa-api's callback redirects back with. */
export const CALENDAR_RETURN_PARAM = 'calendar'

export const ADMIN_NOTE = 'Only an Admin can connect or disconnect Google Calendar.'

export const FOLLOWABLE_PROTOCOLS = new Set(['https:', 'http:'])

export const LOGO_ACCEPT = acceptAttribute(UPLOADABLE_IMAGE_TYPES)

/**
 * The logo card's own wording. A total lookup, so a reason added to the shared
 * type must be worded here before this file compiles — no refusal can reach
 * somebody as a blank message.
 */
export const REFUSAL: Readonly<Record<ImageRefusal, string>> = {
  'wrong-type': 'A logo has to be a JPEG, PNG or WebP image.',
  empty: 'That file is empty.',
  'too-large': `That logo is over ${UPLOAD_MAX_MIB}MB. Try a smaller one, or export it at 512×512.`,
}

/**
 * The permission eventa-api's `calendar-connection.controller.ts` requires on
 * `POST /calendar-connection/connect` and `/disconnect`. Reading the status
 * needs none, which is why an Organizer or Staff member still sees it.
 */
export const MANAGE_INTEGRATIONS = 'setIntegrations'

/** Said when storage refuses the bytes — the workspace's own wording. */
export const STORAGE_PUT_FAILED = 'The upload could not be sent to storage.'

/**
 * The permission eventa-api's `organization.controller.ts` requires on
 * `PATCH /organization` and on every logo route. Reading the profile needs
 * none, which is why an Organizer or Staff member can still open the page.
 */
export const EDIT_ORGANIZATION = 'setSettings'

/** The icon the kit puts beside each group heading in the edit panel. */
export const GROUP_ICONS: Record<string, string> = {
  Events: 'hgi-calendar-03',
  Registrations: 'hgi-user-add-01',
  Finance: 'hgi-wallet-01',
  Settings: 'hgi-settings-01',
}

export const FALLBACK_GROUP_ICON = 'hgi-shield-user'

/**
 * What the mark on an undecided row means, said once instead of on every row
 * that carries it.
 *
 * The mark stays on the row because naming WHICH keys are open is the only part
 * an organizer can act on, one switch at a time — not because gaps are rare.
 * They are the common case: 21 of 32 roles have no row for at least one catalog
 * key, and a Staff role is missing 12 of the 15. What makes a count in a banner
 * the wrong shape is that the state is transitional and self-clearing — not one
 * role carries a recorded refusal, and the first save from the role panel
 * (`RolePanel` in `RolesPage.tsx`) answers every switch, after which the marks
 * are gone for good. A form with unanswered questions in it is not a fault to
 * announce above itself.
 *
 * Those three numbers are a SNAPSHOT of one database, taken 2026-10-09, and not
 * a property of the product — re-run them before relying on them:
 *
 *     docker exec eventa-postgres-1 psql -U eventa -d eventa -At -c "
 *       SELECT (SELECT count(*) FROM roles),
 *              (SELECT count(*) FROM permissions),
 *              (SELECT count(*) FROM role_permissions WHERE granted = false),
 *              (SELECT count(*) FROM roles r WHERE EXISTS (
 *                 SELECT 1 FROM permissions p WHERE NOT EXISTS (
 *                   SELECT 1 FROM role_permissions rp
 *                    WHERE rp.role_id = r.id AND rp.permission_key = p.key)))"
 *
 * It is a legend rather than a tooltip because a tooltip reaches neither a
 * keyboard nor a screen reader, and this is the only place the difference
 * between an open question and a refusal is written down.
 *
 * The wording stops short of "never offered" — which is what the API's own
 * field is called — because no database can support that claim. Migration
 * `0067_backfill_system_role_grants.sql` in eventa-api records that a revoke
 * used to DELETE the row rather than write a `granted = false` tombstone, so in
 * a workspace older than that convention an absent row is either a question
 * nobody was asked or a refusal a past release erased. Being unable to tell
 * those two apart is the whole reason the automatic backfill was withdrawn, and
 * a legend promising the first reading would hand an organizer exactly the
 * false certainty that backfill acted on.
 */
export const NEW_PERMISSION_LEGEND =
  'Permissions marked New have no answer on record for this role — either nobody here has been ' +
  'asked about them yet, or an earlier release deleted the no when somebody turned one off. ' +
  'Saving answers every switch on this form, so one left off is recorded as a no.'

/**
 * How each built-in role looks, as the kit colours them. Keyed on name because
 * that is what the kit distinguishes; a role somebody created gets the neutral
 * tile rather than borrowing a meaning it does not have.
 */
export const ROLE_LOOKS: Record<string, { icon: string; tint: string }> = {
  Admin: {
    icon: 'hgi-shield-key',
    tint: 'bg-purple-50 text-purple-600 dark:bg-purple-400/15 dark:text-purple-300',
  },
  Organizer: { icon: 'hgi-shield-user', tint: 'bg-brand-soft text-brand' },
  Staff: {
    icon: 'hgi-user-check-01',
    tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  },
  Attendee: { icon: 'hgi-user-circle', tint: 'bg-line text-muted' },
}

export const CUSTOM_ROLE_LOOK = { icon: 'hgi-shield-user', tint: 'bg-line text-muted' }

/** As many permissions as the kit's card shows before the rest are counted. */
export const BULLETS_SHOWN = 3

export const BLURB =
  "Sends each meeting's calendar invite to the guest, adds a Google Meet link to video meetings and sets a reminder 15 minutes before."

/** Google's own blue, in the tints the payment methods' tiles use. */
export const TILE_TINT = 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'

/**
 * A tile per category. The kit tints the ones that matter to running an event
 * and leaves the rest neutral — product updates are not an operational signal,
 * and colouring them the same would say they were.
 */
export const CATEGORY_ICONS: Record<string, { icon: string; muted?: boolean }> = {
  registration: { icon: 'hgi-user-add-01' },
  payment: { icon: 'hgi-wallet-01' },
  sales: { icon: 'hgi-tag-01' },
  feedback: { icon: 'hgi-star' },
  payout: { icon: 'hgi-bank' },
  alert: { icon: 'hgi-alert-02' },
  task: { icon: 'hgi-time-schedule', muted: true },
}

export const FALLBACK_ICON = { icon: 'hgi-megaphone-01', muted: true }

export const TIMEZONES = ['Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'UTC']

/** Stripe's own brand purple, as the kit hard-codes it. */
export const STRIPE_PURPLE = 'bg-[#635BFF]'

/**
 * The keys-refused toast when the API named the fields, whose own sentences are
 * already under the boxes (see `refusalNote` in `SettingsPaymentsPage.tsx`).
 */
export const FIELDS_REFUSED = 'Those keys were not saved — check the fields marked below.'

/**
 * How each method looks. The API says which methods exist and whether each is
 * on; everything here is presentation, so it stays a lookup table rather than a
 * branch — a new method Stripe adds needs a row here, not an `if`.
 */
export const METHOD_LOOKS: Record<
  string,
  { icon: string; tint: string; blurb?: string; schemes?: string[] }
> = {
  Card: {
    icon: 'hgi-credit-card',
    tint: 'bg-brand-soft text-brand',
    schemes: ['VISA', 'MC', 'AMEX', 'JCB'],
  },
  PromptPay: {
    icon: 'hgi-qr-code-01',
    tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    blurb: 'Thailand QR bank transfer',
  },
  'Apple Pay': {
    icon: 'hgi-apple',
    tint: 'bg-line text-ink',
    blurb: 'One-tap checkout on Apple devices',
  },
  'Google Pay': {
    icon: 'hgi-wallet-01',
    tint: 'bg-line text-muted',
    blurb: 'One-tap checkout on Android & Chrome',
  },
  'Bank transfer': {
    icon: 'hgi-bank',
    tint: 'bg-line text-muted',
    blurb: 'Pay by direct bank transfer',
  },
}

export const FALLBACK_LOOK = { icon: 'hgi-wallet-01', tint: 'bg-line text-muted' }

/**
 * The phone's three submissions, each its own form — and all OUTSIDE the
 * details form, because forms cannot nest: a nested one is dropped by the
 * browser and its button silently submits the outer form instead.
 */
export const PHONE_REQUEST_FORM_ID = 'settings-profile-phone'
export const PHONE_CONFIRM_FORM_ID = 'settings-profile-phone-code'
export const PHONE_REMOVE_FORM_ID = 'settings-profile-phone-remove'

/** Long enough that a fast typist gets one request, short enough to feel live. */
export const SEARCH_SETTLE_MS = 300

/**
 * Browsers lie about each other, so the order here IS the rule: Edge claims to
 * be Chrome, Chrome claims to be Safari, and every one of them opens with
 * "Mozilla/5.0". The most specific claim has to be tested first.
 */
export const BROWSERS: readonly (readonly [RegExp, string])[] = [
  [/\bEdg[e/]/, 'Edge'],
  [/\bOPR\/|\bOpera\b/, 'Opera'],
  [/\bFirefox\//, 'Firefox'],
  [/\bChrome\//, 'Chrome'],
  [/\bSafari\//, 'Safari'],
]

/** Same rule: iPhone and iPad are Mac-like, so they are checked before macOS. */
export const PLATFORMS: readonly (readonly [RegExp, string])[] = [
  [/\biPhone\b/, 'iPhone'],
  [/\biPad\b/, 'iPad'],
  [/\bAndroid\b/, 'Android'],
  [/\bWindows\b/, 'Windows'],
  [/\bMac OS X\b|\bMacintosh\b/, 'macOS'],
  [/\bLinux\b|\bX11\b/, 'Linux'],
]

export const UNKNOWN_DEVICE = 'Unknown device'

export const GROUP_ORDER = ['Events', 'Registrations', 'Finance', 'Settings'] as const

/** How much recent activity the audit panel shows before deferring to export. */
export const AUDIT_PAGE_SIZE = 20

/** The phone's three submissions on the console's profile form (US-SET-01). */
export const PHONE_REQUEST_INTENT = 'phone'
export const PHONE_CONFIRM_INTENT = 'phone-code'
export const PHONE_REMOVE_INTENT = 'phone-remove'

/** The Integrations page's two submissions (US-MTG-08). */
export const CONNECT_CALENDAR_INTENT = 'connect'
export const DISCONNECT_CALENDAR_INTENT = 'disconnect'
