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
 * Criteria 1 and 3 are wired here. Criteria 4 and 5 — the password change and
 * two-factor — are NOT: both exist on the API and both are already built in the
 * organizer console as a slide-over apiece, and bringing them to this tab means
 * markup the kit does not draw. The Security card is therefore still the kit's,
 * unwired, rather than half-wired.
 */

/* The kit's own switch, moved here with its CSS because this tab is the only
   thing that uses either. Imperative `.switch` styling from the static kit;
   `checked`/`onChange` make it a controlled React input. */
const SWITCH_CSS = `
.switch{position:relative;display:inline-flex;height:1.25rem;width:2.25rem;flex:none;cursor:pointer;align-items:center}
.switch input{position:absolute;inset:0;opacity:0;cursor:pointer}
.switch .track{height:1.25rem;width:2.25rem;border-radius:9999px;background:rgb(var(--line));transition:background .18s}
.switch .dot{position:absolute;left:.125rem;height:1rem;width:1rem;border-radius:9999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:transform .18s}
.switch input:checked + .track{background:#1ba770}
.switch input:checked ~ .dot{transform:translateX(1rem)}
`

function Switch({
  id,
  checked,
  defaultChecked,
  disabled,
  onChange,
}: {
  id?: string
  checked?: boolean
  defaultChecked?: boolean
  /**
   * Held while the save is in flight. The kit has no disabled styling and none
   * is invented — what this prevents is a second click racing the first, where
   * whichever reply landed last would decide the position of the switch.
   */
  disabled?: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <span className="switch">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
      />
      <span className="track" />
      <span className="dot" />
    </span>
  )
}

export function SettingsTab({
  settings,
  twoFactorEnabled,
  dark,
  onToggleTheme,
}: {
  settings: AttendeeAccountSettings
  /**
   * Read, not guessed. The Security card's own controls are out of scope until
   * the portal has the markup for a password change and a two-factor
   * enrolment, but the SWITCH is a statement about this account either way, and
   * `authApi.me()` already answers it — so rendering a bare `<Switch />` told
   * somebody with two-factor ON that it was off.
   */
  twoFactorEnabled: boolean
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
      <style>{SWITCH_CSS}</style>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NotificationsCard notifications={settings.notifications} />
        <PreferencesCard
          preferences={settings.preferences}
          dark={dark}
          onToggleTheme={onToggleTheme}
        />
        <SecurityCard twoFactorEnabled={twoFactorEnabled} />
        <DangerZoneCard />
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

/* ------------------------------- security -------------------------------- */

/**
 * Criteria 4 and 5, and neither is wired — the kit's markup, untouched.
 *
 * Both endpoints exist (`POST /auth/change-password`, `/me/two-factor/*`) and
 * the organizer console already drives them from `SettingsSecurityPage`. What
 * is missing is the markup: a password change is three boxes and a
 * sign-out-everywhere choice, and enabling two-factor is a QR code, a verify
 * step and a list of recovery codes. The kit draws none of that for the portal,
 * and inventing it here is a change of its own rather than the tail of this
 * one.
 *
 * Two things are NOT left as the kit drew them, because both would have stated
 * something untrue about this person's account rather than merely being
 * unfinished:
 *
 * - "Last changed 3 months ago" is gone. This app holds no
 *   password-changed-at — the API exposes none — so it was invention of the
 *   same kind as the Profile tab's old "12 events attended", and a date is
 *   exactly the sort of detail a reader has no reason to doubt.
 * - The two-factor switch now shows the REAL state from `authApi.me()`, which
 *   the loader already had. A bare `<Switch />` renders off, so an account with
 *   two-factor enabled was told its second factor was not on — the one wrong
 *   answer a security card must not give.
 *
 * Both controls are inert until the flows exist, so both are `disabled`: a
 * control that moves and changes nothing is a worse lie than one that plainly
 * does not move yet.
 */
function SecurityCard({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  return (
    <div className="card p-5">
      <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
        <Icon name="hgi-shield-01" size={16} className="text-muted" />
        Security
      </h3>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-hair bg-canvas px-3.5 py-3">
          <span>
            <span className="block text-[13px] font-medium text-ink">Password</span>
            <span className="block text-[11px] text-muted">
              The password you sign in with
            </span>
          </span>
          <button type="button" className="btn btn-soft btn-sm" disabled>
            Change
          </button>
        </div>
        <label className="flex items-center justify-between rounded-lg border border-hair bg-canvas px-3.5 py-3">
          <span>
            <span className="block text-[13px] font-medium text-ink">
              Two-factor authentication
            </span>
            <span className="block text-[11px] text-muted">Extra security at sign-in</span>
          </span>
          <Switch checked={twoFactorEnabled} disabled />
        </label>
      </div>
    </div>
  )
}

/** US-DISC-14, which is its own story. The kit's markup, unwired. */
function DangerZoneCard() {
  return (
    <div className="card border-red-200 p-5 dark:border-red-500/30">
      <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-red-600 dark:text-red-400">
        <Icon name="hgi-alert-02" size={16} />
        Danger zone
      </h3>
      <p className="mt-2 text-[12px] text-muted">
        Permanently remove your account and all registration data. This cannot be undone.
      </p>
      <button
        type="button"
        className="btn btn-sm mt-4 border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400"
      >
        <Icon name="hgi-delete-02" size={15} />
        Delete account
      </button>
    </div>
  )
}
