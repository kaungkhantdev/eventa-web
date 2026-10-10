import { describe, expect, it } from 'vitest'
import {
  NOTIFICATION_ROW,
  toAccountNotifications,
  toDisplayPreferences,
  toDisplayPreferencesPatch,
  toNotificationPatch,
} from './accountSettings.mapper'
import type { NotificationPreferenceWire } from './accountSettings.types'
import type { ProfileWire } from './profile.types'

/**
 * The Settings tab's rules (US-DISC-12, criteria 1–3).
 *
 * The kit shipped this tab as a column of switches with nothing behind them:
 * an attendee turned "SMS alerts" on, left the page, and the choice had never
 * left the browser. Every test here is about a control that now writes to the
 * API, and about the three facts the markup could not tell apart on its own —
 * a channel that is off, a channel that is unavailable, and a channel that
 * cannot be switched at all.
 */

const prefs = (over: Partial<NotificationPreferenceWire>[] = []): NotificationPreferenceWire[] => [
  { category: 'reminder', emailEnabled: true, smsEnabled: false, smsAvailable: true, ...over[0] },
  { category: 'marketing', emailEnabled: false, smsEnabled: false, smsAvailable: true, ...over[1] },
]

const profile = (over: Partial<ProfileWire> = {}): ProfileWire => ({
  id: 'u-1',
  name: 'Araya Phanit',
  email: 'araya@example.co.th',
  pendingEmail: null,
  emailVerified: true,
  phone: '+66812345678',
  phoneVerified: false,
  pendingPhone: null,
  timezone: 'Asia/Bangkok',
  locale: 'en',
  avatarUrl: null,
  city: 'Bangkok',
  dateOfBirth: '1994-03-15',
  bio: null,
  displayCurrency: 'THB',
  ...over,
})

describe('the notification switches', () => {
  it('reads each row from the channel it actually controls', () => {
    const rows = toAccountNotifications(
      prefs([{ emailEnabled: true, smsEnabled: true }, { emailEnabled: true }]),
    )

    expect(rows.eventReminders.on).toBe(true)
    expect(rows.smsAlerts.on).toBe(true)
    expect(rows.marketing.on).toBe(true)
  })

  it('shows SMS as unavailable rather than as off when there is no phone on file', () => {
    // The two are different facts, and the API says which: `smsAvailable` is
    // false with nowhere to send a text, and `PATCH` refuses to turn it on.
    // An off switch would invite a tap that can only ever be refused.
    const rows = toAccountNotifications(prefs([{ smsAvailable: false, smsEnabled: false }]))

    expect(rows.smsAlerts.available).toBe(false)
    expect(rows.smsAlerts.on).toBe(false)
    expect(rows.eventReminders.available).toBe(true)
  })

  it('reads marketing as on while any promotional channel is still live', () => {
    // Criterion 2 is about being excluded from promotions, not about email.
    // One switch stands for the topic, so it cannot read "off" while a
    // promotional text could still arrive.
    const rows = toAccountNotifications(prefs([{}, { emailEnabled: false, smsEnabled: true }]))

    expect(rows.marketing.on).toBe(true)
  })

  it('falls back to the API’s own defaults for a topic it sent no row for', () => {
    const rows = toAccountNotifications([])

    // The API's defaults, not kinder ones: `DEFAULT_EMAIL` is true for every
    // topic it knows, marketing included. A switch drawn off while the server
    // would still send is the same lie as the markup this replaces, only
    // pointing the other way.
    expect(rows.eventReminders.on).toBe(true)
    expect(rows.marketing.on).toBe(true)
    // Unavailable, not off: nothing said a phone was on file.
    expect(rows.smsAlerts.available).toBe(false)
  })
})

describe('switching one row', () => {
  const flip = (row: string, enabled: boolean): FormData => {
    const form = new FormData()
    form.append('row', row)
    form.append('enabled', String(enabled))
    return form
  }

  it('sends only the channel that changed, to that row’s own category', () => {
    // The PATCH is per category and partial, so flipping email must not
    // re-assert an SMS setting that changed somewhere else.
    expect(toNotificationPatch(flip(NOTIFICATION_ROW.reminders, false))).toEqual({
      category: 'reminder',
      body: { emailEnabled: false },
    })
    expect(toNotificationPatch(flip(NOTIFICATION_ROW.sms, true))).toEqual({
      category: 'reminder',
      body: { smsEnabled: true },
    })
  })

  it('closes every promotional channel when marketing is switched off', () => {
    expect(toNotificationPatch(flip(NOTIFICATION_ROW.marketing, false))).toEqual({
      category: 'marketing',
      body: { emailEnabled: false, smsEnabled: false },
    })
  })

  it('writes nothing at all for a row it does not know', () => {
    // There is no sensible guess: defaulting to a row would mean a bad
    // submission silently switched off somebody's event reminders. `toString`
    // is in here because `'toString' in obj` is true of every object, and the
    // lookup has to be of the table's own keys.
    expect(toNotificationPatch(flip('spam', true))).toBeNull()
    expect(toNotificationPatch(flip('toString', true))).toBeNull()
    expect(toNotificationPatch(new FormData())).toBeNull()
  })

  it('re-opens only email when marketing is switched back on', () => {
    // Deliberately asymmetric: the row says nothing about texts, and the API
    // refuses `smsEnabled: true` for anyone with no phone number — so turning
    // marketing on must not be a request that can be refused.
    expect(toNotificationPatch(flip(NOTIFICATION_ROW.marketing, true))).toEqual({
      category: 'marketing',
      body: { emailEnabled: true },
    })
  })
})

describe('the display preferences', () => {
  it('shows what the profile holds', () => {
    const shown = toDisplayPreferences(
      profile({ timezone: 'Asia/Tokyo', locale: 'th', displayCurrency: 'USD' }),
    )

    expect(shown.timezone).toBe('Asia/Tokyo')
    expect(shown.locale).toBe('th')
    expect(shown.currency).toBe('USD')
  })

  it('offers a stored timezone the card does not list', () => {
    // Otherwise the select falls back to its first option, telling somebody
    // their zone is Bangkok and writing that the next time they save.
    const shown = toDisplayPreferences(profile({ timezone: 'America/New_York' }))

    expect(shown.timezoneOptions.map((o) => o.value)).toContain('America/New_York')
    expect(shown.timezone).toBe('America/New_York')
  })

  it('offers a stored currency the card does not list', () => {
    const shown = toDisplayPreferences(profile({ displayCurrency: 'JPY' }))

    expect(shown.currencyOptions.map((o) => o.value)).toContain('JPY')
    expect(shown.currency).toBe('JPY')
  })

  it('shows Bangkok and Baht when nothing is stored', () => {
    // What the interface already does: every time on screen is Bangkok's and
    // every charge settles in Baht, whether or not a preference was ever set.
    const shown = toDisplayPreferences(profile({ timezone: null, displayCurrency: null }))

    expect(shown.timezone).toBe('Asia/Bangkok')
    expect(shown.currency).toBe('THB')
    // No duplicate: the default is one of the card's own options.
    expect(shown.timezoneOptions.filter((o) => o.value === 'Asia/Bangkok')).toHaveLength(1)
  })

  it('falls back to English when no language is stored', () => {
    expect(toDisplayPreferences(profile({ locale: null })).locale).toBe('en')
  })
})

describe('saving one display preference', () => {
  const chose = (name: string, value: string): FormData => {
    const form = new FormData()
    form.append(name, value)
    return form
  }

  it('patches only the control that was changed', () => {
    expect(toDisplayPreferencesPatch(chose('timezone', 'Asia/Tokyo'))).toEqual({
      timezone: 'Asia/Tokyo',
    })
    expect(toDisplayPreferencesPatch(chose('locale', 'th'))).toEqual({ locale: 'th' })
    expect(toDisplayPreferencesPatch(chose('displayCurrency', 'USD'))).toEqual({
      displayCurrency: 'USD',
    })
  })

  it('never carries the fields the Profile tab owns', () => {
    // Both tabs PATCH the same record. A preference save that sent an empty
    // name, phone or bio would clear what the other tab had just saved.
    const patch = toDisplayPreferencesPatch(chose('timezone', 'Asia/Tokyo'))

    expect(Object.keys(patch)).toEqual(['timezone'])
  })

  it('clears a timezone that came back empty rather than sending ""', () => {
    expect(toDisplayPreferencesPatch(chose('timezone', ''))).toEqual({ timezone: null })
  })

  it('normalises a currency code to the three upper-case letters the API takes', () => {
    expect(toDisplayPreferencesPatch(chose('displayCurrency', 'usd'))).toEqual({
      displayCurrency: 'USD',
    })
  })

  it('writes nothing at all rather than guessing at a value it does not know', () => {
    // These cannot come from the card's own selects, so they are a bug here,
    // not a choice somebody made — and a guess would overwrite a real setting.
    expect(toDisplayPreferencesPatch(chose('locale', 'fr'))).toEqual({})
    expect(toDisplayPreferencesPatch(chose('displayCurrency', 'Baht'))).toEqual({})
  })
})
