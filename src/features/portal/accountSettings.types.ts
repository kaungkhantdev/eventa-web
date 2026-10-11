import type { Panel } from '@/app/panels'
/**
 * The attendee's own settings — `/me/notification-preferences` and the three
 * display fields that ride on `/me/profile` (US-DISC-12).
 *
 * Wire shapes mirror eventa-api field for field; nothing outside the mapper
 * reads them.
 */

/**
 * The topics an attendee token is given, from the API's own list
 * (`ATTENDEE_CATEGORIES` in `notification-preferences.service.ts`).
 *
 * The other seven members of `notification_kind` belong to the organizer and
 * are refused for this persona, which is why only these two are named here.
 * Order confirmations and receipts are in NEITHER list on purpose: they are
 * transactional, and nothing in this file can switch them off (criterion 2).
 */
export const ATTENDEE_NOTIFICATION_CATEGORIES = ['reminder', 'marketing'] as const

export type AttendeeNotificationCategory = (typeof ATTENDEE_NOTIFICATION_CATEGORIES)[number]

/** `GET /me/notification-preferences` — the service's `PreferenceView`. */
export interface NotificationPreferenceWire {
  category: AttendeeNotificationCategory
  emailEnabled: boolean
  smsEnabled: boolean
  /** False when there is no phone on file: SMS is unavailable, not "off". */
  smsAvailable: boolean
}

/** `PATCH /me/notification-preferences/:category` — `SetPreferenceDto`. */
export interface NotificationPreferencePatch {
  emailEnabled?: boolean
  smsEnabled?: boolean
}

/* ------------------------------ view models ------------------------------ */

/**
 * Which row of the Notifications card a submission came from.
 *
 * A row is not a category: two of them write to `reminder` over different
 * channels, so the row id is what the form carries and the mapper is what
 * turns it into a category and a patch.
 */
export const NOTIFICATION_ROW = {
  reminders: 'reminders',
  sms: 'sms',
  marketing: 'marketing',
} as const

export type NotificationRowId = (typeof NOTIFICATION_ROW)[keyof typeof NOTIFICATION_ROW]

/** One switch in the Notifications card. */
export interface NotificationSwitch {
  row: NotificationRowId
  on: boolean
  /**
   * False where the channel cannot be used at all. The card renders that as
   * unavailable rather than as an off switch — "we cannot text you" and "do
   * not text me" are different facts, as the organizer console already says.
   */
  available: boolean
}

export interface AccountNotifications {
  /** `reminder` over email — a day before each event. */
  eventReminders: NotificationSwitch
  /** `reminder` over SMS — the same topic, the other channel. */
  smsAlerts: NotificationSwitch
  /** `marketing`, as one row standing for every promotional channel. */
  marketing: NotificationSwitch
}

/** An option in one of the Preferences card's selects. */
export interface PreferenceOption {
  value: string
  /** The kit's own wording, kept verbatim — e.g. `(GMT+7) Bangkok`. */
  label: string
}

/**
 * What the Preferences card shows.
 *
 * The option lists are part of the view model rather than constants in the
 * markup because they depend on the record: a stored value the card does not
 * list has to be added, or the select would show its first option instead and
 * the next save would write that over somebody's real setting.
 */
export interface DisplayPreferences {
  locale: 'en' | 'th'
  timezone: string
  timezoneOptions: readonly PreferenceOption[]
  /** A three-letter code. Display only — every charge settles in THB. */
  currency: string
  currencyOptions: readonly PreferenceOption[]
}

/** Everything the Settings tab renders, mapped at the edge. */
export interface AttendeeAccountSettings {
  /**
   * A panel, because this is the one read on the account page that may fail
   * without costing the reader anything else.
   *
   * The page's five other reads are its subject — who you are, your tickets,
   * your payments — and the loader is deliberately all-or-nothing about them:
   * "a half-loaded account is not worth rendering". Notification switches are
   * not that. They arrived as a sixth call in the same `Promise.all`, which
   * meant one flaky secondary endpoint took away somebody's TICKETS, and
   * `AGENTS.md` asks every async surface for a failed state rather than a dead
   * page. `panel()` still re-throws a 401 to the loader's guard and a
   * programming error to the boundary, so only a real API or network failure
   * degrades to this.
   */
  notifications: Panel<AccountNotifications>
  preferences: DisplayPreferences
}
