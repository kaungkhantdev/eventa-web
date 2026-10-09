import { useId } from 'react'
import type { Panel } from '@/app/panels'
import { useFetcher } from 'react-router'
import { Hint, Icon } from '@/components/ui'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import type { ActionResult } from '@/app/loaders'
import type {
  AccountNotifications,
  AttendeeAccountSettings,
  DisplayPreferences,
  NotificationSwitch,
} from '../accountSettings.types'
import { DISPLAY_PREFERENCE_INTENT, NOTIFICATION_INTENT } from '../myEvents.routes'
import type { AttendeeSecurity } from '../security.types'
import { DangerZoneCard } from './DangerZoneCard'
import { SecurityCard } from './SecurityCard'
import { Switch, SwitchStyles } from './Switch'

/**
 * "My Account" → Settings (US-DISC-12), lifted out of `MyEventsPage` whole.
 *
 * The markup is the kit's (`portal/my-events.html`), class string for class
 * string. What changed is that there is now something behind it: it was ported
 * as a column of `<Switch defaultChecked />` and `<Switch />` with no handler
 * and three `<select>`s with no name and no value, so an attendee turned
 * "SMS alerts" on, navigated away, and the choice had never left the browser.
 * The theme switch was the one control that worked, and still does.
 *
 * All five criteria are wired now. Criteria 1 and 3 are here; 4 and 5 moved to
 * `SecurityCard` with the two slide-overs they need, and US-DISC-14 to
 * `DangerZoneCard` with its confirmation — three files rather than one, because
 * this tab is four independent cards and each of those two is a flow.
 */

export function SettingsTab({
  settings,
  security,
  email,
  dark,
  onToggleTheme,
}: {
  settings: AttendeeAccountSettings
  /**
   * Read, not guessed (criteria 4–5, US-DISC-14).
   *
   * Three supplementary reads, each its own panel: two-factor standing, how
   * many other devices hold a session, and what deleting the account would
   * forfeit. A bare `<Switch />` renders off, so an account with two-factor
   * enabled used to be told its second factor was not on — the one wrong
   * answer a security card must not give.
   */
  security: AttendeeSecurity
  /** Named on the recovery-code file, so it is usable a year later. */
  email: string
  /**
   * The theme comes from the page rather than from `useTheme()` here: two
   * instances of that hook keep two copies of `dark`, and the header's toggle
   * would leave this switch showing the theme the page used to be in.
   */
  dark: boolean
  onToggleTheme: () => void
}) {
  return (
    <>
      {/* Outside the grid, so its four children are the four cards the kit
          draws and nothing else. */}
      <SwitchStyles />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NotificationsCard notifications={settings.notifications} />
        <PreferencesCard
          preferences={settings.preferences}
          dark={dark}
          onToggleTheme={onToggleTheme}
        />
        <SecurityCard
          twoFactor={security.twoFactor}
          otherDevices={security.otherDevices}
          email={email}
        />
        <DangerZoneCard deletion={security.deletion} />
      </div>
    </>
  )
}

/* ---------------------------- notifications ------------------------------ */

const ROWS = {
  email: 'flex items-center justify-between py-3 first:pt-0',
  middle: 'flex items-center justify-between py-3',
  marketing: 'flex items-center justify-between py-3 last:pb-0',
}

/**
 * The switches, or why they are not there.
 *
 * Their read is the one on this page allowed to fail on its own — see the
 * `notifications` panel in `accountSettings.types.ts`. The always-on email row
 * still renders, because it states a product rule rather than a stored
 * preference and is true whether or not the endpoint answered.
 */
function NotificationsCard({
  notifications,
}: {
  notifications: Panel<AccountNotifications>
}) {
  return (
    <div className="card p-5">
      <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
        <Icon name="hgi-notification-03" size={16} className="text-muted" />
        Notifications
      </h3>
      <div className="mt-4 divide-y divide-line">
        {/*
         * Not a switch, and the only row here that never was one. The API puts
         * order confirmations and receipts in neither persona's topic list on
         * purpose — they are transactional, and criterion 2 promises they keep
         * arriving even with marketing off. A switch over them would offer to
         * turn off something nothing can turn off.
         */}
        <FixedRow
          className={ROWS.email}
          title="Email notifications"
          description="Order confirmations and updates"
          note="Always on"
          explanation="Order confirmations and receipts are always sent."
        />
        {!notifications.ok ? (
          /*
           * The API's own sentence, not ours: it is written for the person
           * reading it. No switches are drawn at all rather than drawn in a
           * guessed position — a switch showing "off" for a preference nobody
           * could read is the one answer that would be worse than none.
           */
          <p role="alert" className="py-3 text-[12px] text-red-500">
            {notifications.error}
          </p>
        ) : (
          <NotificationSwitches notifications={notifications.data} />
        )}
      </div>
    </div>
  )
}

/** The three stored preferences, once they have actually been read. */
function NotificationSwitches({
  notifications,
}: {
  notifications: AccountNotifications
}) {
  return (
    <>
        <SwitchRow
          className={ROWS.middle}
          title="Event reminders"
          description="A day before each event"
          state={notifications.eventReminders}
        />
        {notifications.smsAlerts.available ? (
          <SwitchRow
            className={ROWS.middle}
            title="SMS alerts"
            description="Time-sensitive changes only"
            state={notifications.smsAlerts}
          />
        ) : (
          /*
           * Unavailable, not off. The API reports `smsAvailable: false` when
           * there is no phone on file and refuses to turn SMS on, so an off
           * switch here would be a control whose every tap is rejected — the
           * same distinction the organizer console's notification screen draws.
           */
          <FixedRow
            className={ROWS.middle}
            title="SMS alerts"
            description="Time-sensitive changes only"
            note="No phone on file"
            explanation="Add a phone number on the Profile tab to turn on SMS alerts."
          />
        )}
        <SwitchRow
          className={ROWS.marketing}
          title="Marketing & promotions"
          description="New events you may like"
          state={notifications.marketing}
        />
    </>
  )
}

/** The kit's two lines of row text, which every row has. */
function RowText({ title, description }: { title: string; description: string }) {
  return (
    <>
      <span className="block text-[13px] font-medium text-ink">{title}</span>
      <span className="block text-[11px] text-muted">{description}</span>
    </>
  )
}

/**
 * One switch, one request.
 *
 * `PATCH /me/notification-preferences/:category` is per category, so each row
 * owns its own fetcher: one in flight does not freeze the others, and a refusal
 * is reported against the switch that caused it. The fetcher revalidates the
 * loader, so the position shown after a save is the API's, never this app's
 * guess at it.
 *
 * The row is a `<div>` with the label tied to the input by `htmlFor`, where the
 * kit wrapped the whole row in a `<label>`: the error has to sit inside the row
 * to be beside the control, and inside a `<label>` every click on it would flip
 * the switch again.
 */
function SwitchRow({
  className,
  title,
  description,
  state,
}: {
  className: string
  title: string
  description: string
  state: NotificationSwitch
}) {
  const id = useId()
  const toggle = useFetcher<ActionResult>()
  const error = toggle.data?.ok === false ? toggle.data.error : null
  useFailureToast(toggle.state === 'idle' ? error : null)

  const set = (enabled: boolean) =>
    toggle.submit(
      { intent: NOTIFICATION_INTENT, row: state.row, enabled: String(enabled) },
      { method: 'post' },
    )

  return (
    <div className={className}>
      <span>
        {/* No class: `.label` is the form-label style and this is the kit's
            plain row text, which carries its own. */}
        <label htmlFor={id}>
          <RowText title={title} description={description} />
        </label>
        {error && (
          <span role="alert" className="mt-1 block text-[12px] text-red-500">
            {error}
          </span>
        )}
      </span>
      <Switch
        id={id}
        checked={state.on}
        disabled={toggle.state !== 'idle'}
        onChange={(next) => set(next)}
      />
    </div>
  )
}

/**
 * A row whose right-hand side is a fact rather than a control.
 *
 * Both uses are channels nothing can switch here, and a disabled switch would
 * read as "off, and you could turn it on" — which is what the console's
 * notification screen says in the same situation, and why it draws no switch
 * either.
 */
function FixedRow({
  className,
  title,
  description,
  note,
  explanation,
}: {
  className: string
  title: string
  description: string
  note: string
  /** Why there is no switch, for the tooltip. */
  explanation: string
}) {
  return (
    <div className={className}>
      <span>
        <RowText title={title} description={description} />
      </span>
      <span className="shrink-0 text-[11px] text-muted/60" title={explanation}>
        {note}
      </span>
    </div>
  )
}

/* ----------------------------- preferences ------------------------------- */

function PreferencesCard({
  preferences,
  dark,
  onToggleTheme,
}: {
  preferences: DisplayPreferences
  dark: boolean
  onToggleTheme: () => void
}) {
  const id = useId()
  const save = useFetcher<ActionResult>()
  const error = save.data?.ok === false ? save.data.error : null
  useSavedToast(save.state === 'idle' && save.data?.ok === true, 'Preferences saved.')
  useFailureToast(save.state === 'idle' ? error : null)

  /*
   * Each select saves itself, as each switch does. The kit draws no Save button
   * on this card and none is added — and the patch carries only the one field
   * that changed, so choosing a timezone cannot clear a bio the Profile tab
   * just wrote to the same record.
   *
   * Each is keyed on the loaded value, so a refused save puts back what the
   * server still holds rather than leaving the choice on screen as if it had
   * been taken.
   */
  const choose = (name: string, value: string) =>
    save.submit({ intent: DISPLAY_PREFERENCE_INTENT, [name]: value }, { method: 'post' })

  return (
    <div className="card p-5">
      <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
        <Icon name="hgi-globe-02" size={16} className="text-muted" />
        Preferences
      </h3>
      <div className="mt-4 space-y-3.5">
        <div>
          <label className="label" htmlFor={`${id}-locale`}>
            Language
          </label>
          <select
            id={`${id}-locale`}
            className="select"
            key={preferences.locale}
            defaultValue={preferences.locale}
            onChange={(e) => choose('locale', e.target.value)}
          >
            <option value="en">English</option>
            <option value="th">ไทย (Thai)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`${id}-timezone`}>
            Timezone
          </label>
          <select
            id={`${id}-timezone`}
            className="select"
            key={preferences.timezone}
            defaultValue={preferences.timezone}
            onChange={(e) => choose('timezone', e.target.value)}
          >
            {preferences.timezoneOptions.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>
          {/*
           * Said plainly, because this is the one preference that sounds like
           * it moves the times on screen and must not. Criterion 3 anchors
           * event times to each event's own timezone, which is what
           * `toMyEventRow` already renders them in; the setting is the member's
           * own zone, which eventa-api holds for what it sends them.
           */}
          <Hint className="mt-1">Event times still show in each event’s own timezone.</Hint>
        </div>
        <div>
          <label className="label" htmlFor={`${id}-currency`}>
            Currency
          </label>
          <select
            id={`${id}-currency`}
            className="select"
            key={preferences.currency}
            defaultValue={preferences.currency}
            onChange={(e) => choose('displayCurrency', e.target.value)}
          >
            {preferences.currencyOptions.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
          {/*
           * `UpdateProfileDto` calls this display-only and criterion 3 says
           * charges settle in Baht. Nothing in this app converts a price yet,
           * so the hint says what actually happens rather than letting the
           * presence of a currency box imply a card will be charged in it.
           */}
          <Hint className="mt-1">Prices are charged in Thai Baht whichever you pick.</Hint>
        </div>
        <label className="flex items-center justify-between pt-1">
          <span>
            <span className="block text-[13px] font-medium text-ink">Dark mode</span>
            <span className="block text-[11px] text-muted">Switch the interface theme</span>
          </span>
          {/* The one control on this tab that was already wired — to `useTheme`,
              which is the whole of what it does. Left exactly as it was. */}
          <Switch checked={dark} onChange={onToggleTheme} />
        </label>
      </div>
    </div>
  )
}
