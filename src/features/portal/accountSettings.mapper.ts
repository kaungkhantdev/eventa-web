import type {
  AccountNotifications,
  AttendeeNotificationCategory,
  DisplayPreferences,
  NotificationPreferencePatch,
  NotificationPreferenceWire,
  NotificationRowId,
  PreferenceOption,
} from './accountSettings.types'
import { NOTIFICATION_ROW } from './accountSettings.types'
import type { ProfilePatch, ProfileWire } from './profile.types'

/**
 * The Settings tab's rules (US-DISC-12, criteria 1–3).
 *
 * The tab was ported as a column of switches and three selects with nothing
 * behind them — `<Switch defaultChecked />` and `<Switch />`, no handler, no
 * name, no value. Somebody turned SMS alerts on, navigated away, and the
 * choice had never left the browser. Everything those controls read and write
 * now comes from here.
 */

export { NOTIFICATION_ROW }

/* ----------------------------- notifications ----------------------------- */

/**
 * What the API answers for a topic it has never been asked about, copied from
 * `notification-preferences.service.ts` (`DEFAULT_EMAIL` / `DEFAULT_SMS`).
 *
 * Reached only if the API stops sending a row it currently always sends. The
 * safe reading of silence about SMS is "unavailable": it renders as a fact
 * about the product rather than as a switch whose tap can only be refused.
 */
const ABSENT: Omit<NotificationPreferenceWire, 'category'> = {
  emailEnabled: true,
  smsEnabled: false,
  smsAvailable: false,
}

function preference(
  wires: readonly NotificationPreferenceWire[],
  category: AttendeeNotificationCategory,
): Omit<NotificationPreferenceWire, 'category'> {
  return wires.find((wire) => wire.category === category) ?? ABSENT
}

export function toAccountNotifications(
  wires: readonly NotificationPreferenceWire[],
): AccountNotifications {
  const reminder = preference(wires, 'reminder')
  const marketing = preference(wires, 'marketing')

  return {
    eventReminders: { row: NOTIFICATION_ROW.reminders, on: reminder.emailEnabled, available: true },
    smsAlerts: {
      row: NOTIFICATION_ROW.sms,
      on: reminder.smsEnabled,
      available: reminder.smsAvailable,
    },
    marketing: {
      row: NOTIFICATION_ROW.marketing,
      // One row stands for the whole topic, so it cannot read "off" while a
      // promotional text could still arrive (criterion 2).
      on: marketing.emailEnabled || marketing.smsEnabled,
      available: true,
    },
  }
}

/**
 * One row's new position → the category and the partial patch to send.
 *
 * `PATCH /me/notification-preferences/:category` is per category and takes
 * either channel, so each switch is its own small request and sends only the
 * channel it owns. Sending both would re-assert a setting somebody changed in
 * another tab, which is the dual-write this app does not do.
 */
const PATCH_OF_ROW: Record<
  NotificationRowId,
  { category: AttendeeNotificationCategory; body: (enabled: boolean) => NotificationPreferencePatch }
> = {
  [NOTIFICATION_ROW.reminders]: {
    category: 'reminder',
    body: (emailEnabled) => ({ emailEnabled }),
  },
  [NOTIFICATION_ROW.sms]: {
    category: 'reminder',
    body: (smsEnabled) => ({ smsEnabled }),
  },
  [NOTIFICATION_ROW.marketing]: {
    category: 'marketing',
    /**
     * Deliberately asymmetric, and the asymmetry is the criterion.
     *
     * Off has to be off everywhere: "excluded from promotions" is about every
     * promotional channel, not about email, so switching the row off closes
     * both. On re-opens email only — the row says nothing about texts, and the
     * API refuses `smsEnabled: true` for anyone with no phone number, so
     * asserting it here would make turning marketing back on a request that
     * can be refused for a reason the row never mentioned.
     */
    body: (enabled) => (enabled ? { emailEnabled: true } : { emailEnabled: false, smsEnabled: false }),
  },
}

/**
 * `Object.hasOwn`, not `in`: `'toString' in PATCH_OF_ROW` is true of every
 * object, and the lookup that followed would read a function off the prototype.
 */
function rowOf(value: string): NotificationRowId | null {
  return Object.hasOwn(PATCH_OF_ROW, value) ? (value as NotificationRowId) : null
}

/**
 * `null` for a row this file does not know, so the caller sends nothing.
 *
 * Deliberately not a default row: only this app's own switches post here, so an
 * unrecognised one is a bug — and guessing would mean a bad submission quietly
 * switched off somebody's event reminders instead.
 */
export function toNotificationPatch(form: FormData): {
  category: AttendeeNotificationCategory
  body: NotificationPreferencePatch
} | null {
  const id = rowOf(String(form.get('row') ?? ''))
  if (id === null) return null
  const row = PATCH_OF_ROW[id]
  return { category: row.category, body: row.body(form.get('enabled') === 'true') }
}

/* -------------------------- display preferences -------------------------- */

/**
 * The product's one timezone, restated here rather than imported: `@/lib/format`
 * keeps it private and this change owns only `features/portal`.
 */
const BANGKOK = 'Asia/Bangkok'
const THB = 'THB'
const DEFAULT_LOCALE = 'en' as const

/** The kit's own options (`portal/my-events.html`), labels verbatim. */
const TIMEZONE_OPTIONS: readonly PreferenceOption[] = [
  { value: BANGKOK, label: '(GMT+7) Bangkok' },
  { value: 'Europe/London', label: '(GMT+0) London' },
  { value: 'Asia/Tokyo', label: '(GMT+9) Tokyo' },
]

const CURRENCY_OPTIONS: readonly PreferenceOption[] = [
  { value: THB, label: '฿ Thai Baht (THB)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
]

const LOCALES = ['en', 'th'] as const
const isLocale = (value: string): value is (typeof LOCALES)[number] =>
  (LOCALES as readonly string[]).includes(value)

/**
 * The card's options, plus the stored value when it is not among them.
 *
 * A `<select>` whose value matches no option shows its first one instead. The
 * card would then tell somebody their timezone is Bangkok — and write that the
 * next time they changed anything on it.
 */
function withStored(
  options: readonly PreferenceOption[],
  stored: string,
): readonly PreferenceOption[] {
  if (options.some((option) => option.value === stored)) return options
  return [...options, { value: stored, label: stored }]
}

export function toDisplayPreferences(profile: ProfileWire): DisplayPreferences {
  /*
   * Bangkok and Baht when the profile holds nothing, because that is what the
   * interface already does: times render in Bangkok and charges settle in THB
   * whether or not a preference was ever set. An empty select would suggest
   * otherwise, and "Not set" would be a fourth option the kit does not have.
   */
  const timezone = profile.timezone ?? BANGKOK
  const currency = profile.displayCurrency ?? THB

  return {
    locale: profile.locale ?? DEFAULT_LOCALE,
    timezone,
    timezoneOptions: withStored(TIMEZONE_OPTIONS, timezone),
    currency,
    currencyOptions: withStored(CURRENCY_OPTIONS, currency),
  }
}

/* ------------------------- the card going back out ------------------------ */

const CURRENCY_CODE = /^[A-Z]{3}$/

/**
 * One changed select → `PATCH /me/profile`.
 *
 * Deliberately only the three display fields, and only the one that was
 * submitted. `UpdateProfileDto` is a partial patch, so an omitted key is left
 * alone — and both tabs write the same record: a preference save that also
 * sent `name`, `phone` or `bio` would clear whatever the Profile tab had just
 * put there. `toProfilePatch` omits these three for the mirror-image reason.
 *
 * A value outside what the selects offer is a bug in this app rather than a
 * choice somebody made, so nothing is written for it: a guess would overwrite
 * a real setting, and the API would refuse it anyway.
 */
export function toDisplayPreferencesPatch(form: FormData): ProfilePatch {
  const patch: ProfilePatch = {}

  if (form.has('locale')) {
    const locale = String(form.get('locale'))
    if (isLocale(locale)) patch.locale = locale
  }
  if (form.has('timezone')) {
    // An emptied select means "I no longer have one", which the API spells null.
    patch.timezone = String(form.get('timezone')).trim() || null
  }
  if (form.has('displayCurrency')) {
    const currency = String(form.get('displayCurrency')).trim().toUpperCase()
    if (CURRENCY_CODE.test(currency)) patch.displayCurrency = currency
    else if (!currency) patch.displayCurrency = null
  }

  return patch
}
