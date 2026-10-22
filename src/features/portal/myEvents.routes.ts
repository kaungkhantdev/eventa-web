import { attendeeAction, attendeeData, queryOf, type LoaderArgs } from '@/app/loaders'
import { mapPanel, panel, type Panel } from '@/app/panels'
import { authApi } from '@/features/auth/api'
import type { Me } from '@/features/auth/types'
import { isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { intParam } from '@/lib/urlFilters'
import { accountSettingsApi } from './accountSettings.api'
import {
  toAccountNotifications,
  toDisplayPreferences,
  toDisplayPreferencesPatch,
  toNotificationPatch,
} from './accountSettings.mapper'
import type { AttendeeAccountSettings } from './accountSettings.types'
import { myEventsApi } from './myEvents.api'
import { toMyEventRow, toPaymentTotals, toTicketPass, toTransactionRow } from './myEvents.mapper'
import type { MyEventRow, PaymentTotals, TicketPass, TransactionRow } from './myEvents.types'
import { profileApi } from './profile.api'
import { toAttendeeProfileCard, toProfilePatch } from './profile.mapper'
import type { AttendeeProfileCard } from './profile.types'
import { securityApi } from './security.api'
import { countOtherDevices, toDeletionWarning, toTwoFactorCard } from './security.mapper'
import type { AttendeeSecurity } from './security.types'
import { DISPLAY_PREFERENCE_INTENT, EMAIL_CHANGE_INTENT, HISTORY_SIZE, NOTIFICATION_INTENT, PASSWORD_CHANGE_INTENT, PHONE_CONFIRM_INTENT, PHONE_REMOVE_INTENT, PHONE_REQUEST_INTENT, REVOKE_OTHER_SESSIONS_INTENT, TWO_FACTOR_DISABLE_INTENT } from '@/lib/constants/portal.constants'

/**
 * The attendee's own account page (US-DISC-07/09/10).
 *
 * Behind the attendee guard, not the organizer one: these are `/me/*` routes
 * scoped to whoever holds the token.
 */

export interface MyEventsData {
  /** Who is signed in — the header chip reads it. */
  me: Me
  /** The Profile tab's own record, which `me` is too thin to fill (US-DISC-11). */
  profile: AttendeeProfileCard
  /** The Settings tab's switches and selects (US-DISC-12). */
  settings: AttendeeAccountSettings
  /**
   * The Settings tab's Security card and danger zone (US-DISC-12 criteria 4–5,
   * US-DISC-14).
   *
   * Two-factor standing comes from `GET /me/two-factor` rather than from
   * `me.twoFactorEnabled`, which the tab used to be handed: both answer the
   * same question, and the one that also knows about pending enrolments and
   * recovery codes is the one to keep. Two sources for a security fact is how
   * they come to disagree.
   */
  security: AttendeeSecurity
  upcoming: MyEventRow[]
  past: MyEventRow[]
  transactions: TransactionRow[]
  window: PageWindow
  totals: PaymentTotals
}

export function historyQueryOf(params: URLSearchParams) {
  const limit = intParam(params, 'limit', HISTORY_SIZE)
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : HISTORY_SIZE,
  }
}

/**
 * What this page can submit, and what each one does.
 *
 * A table rather than a chain of `if`s, because the account page keeps gaining
 * submissions — four now across two tabs, all posting to this one action.
 */
const SUBMISSIONS: Record<string, (form: FormData) => Promise<unknown>> = {
  [EMAIL_CHANGE_INTENT]: (form) => profileApi.changeEmail(String(form.get('email') ?? '').trim()),

  /** Holds the number and texts a code to it; the old one keeps working. */
  [PHONE_REQUEST_INTENT]: (form) =>
    profileApi.requestPhoneCode(String(form.get('phone') ?? '').trim()),

  [PHONE_CONFIRM_INTENT]: (form) =>
    profileApi.confirmPhoneCode(String(form.get('code') ?? '').trim()),

  [PHONE_REMOVE_INTENT]: () => profileApi.removePhone(),

  [NOTIFICATION_INTENT]: (form) => {
    const patch = toNotificationPatch(form)
    // A row the mapper does not know is a bug here, not a choice somebody
    // made: nothing is sent rather than some other switch being written.
    if (patch === null) return Promise.resolve(null)
    return accountSettingsApi.setNotification(patch.category, patch.body)
  },

  /**
   * A display preference is part of the profile, so it goes through the same
   * client as the Profile tab — and carries only the select that changed, so
   * saving a timezone cannot clear a bio.
   */
  [DISPLAY_PREFERENCE_INTENT]: (form) => {
    const patch = toDisplayPreferencesPatch(form)
    // The selects only ever offer values the API takes, so nothing recognised
    // means a bug here rather than a choice: an empty patch would touch the
    // record and report back a save that never happened.
    return Object.keys(patch).length === 0 ? Promise.resolve(null) : profileApi.saveProfile(patch)
  },

  /**
   * Criterion 4. The confirm box never leaves the browser — the API has no
   * business being told the same new secret twice to compare it.
   */
  [PASSWORD_CHANGE_INTENT]: (form) =>
    securityApi.changePassword(
      String(form.get('currentPassword') ?? ''),
      String(form.get('newPassword') ?? ''),
    ),

  [REVOKE_OTHER_SESSIONS_INTENT]: () => securityApi.revokeOtherSessions(),

  /** Criterion 5 in reverse, and the API still asks for a current code. */
  [TWO_FACTOR_DISABLE_INTENT]: (form) =>
    securityApi.disableTwoFactor(String(form.get('code') ?? '').trim()),
}

/** The details form is the one submission with no intent of its own. */
const SAVE_PROFILE = (form: FormData) => profileApi.saveProfile(toProfilePatch(form))

export const myEventsRoute = {
  loader: attendeeData(async ({ request }: LoaderArgs): Promise<MyEventsData> => {
    // Independent reads; the page shows every tab at once, so a half-loaded
    // account is not worth rendering.
    const [
      me,
      profile,
      registrations,
      payments,
      summary,
      preferences,
      twoFactor,
      sessions,
      deletion,
    ] = await Promise.all([
      authApi.me(),
      profileApi.profile(),
      myEventsApi.registrations(),
      myEventsApi.payments(historyQueryOf(queryOf(request))),
      myEventsApi.paymentSummary(),
      panel(accountSettingsApi.notifications()),
      // The Security card and the danger zone. Supplementary, so each is its
      // own panel: the page's subject is somebody's tickets, and none of these
      // three is worth taking them away for.
      panel(securityApi.twoFactor()),
      panel(securityApi.sessions()),
      panel(securityApi.deletionWarning()),
    ])

    return {
      me,
      profile: toAttendeeProfileCard(profile),
      // Both halves of the Settings tab: the switches from their own endpoint,
      // the selects off the same `/me/profile` record the Profile tab reads.
      settings: {
        notifications: mapPanel(preferences, toAccountNotifications),
        preferences: toDisplayPreferences(profile),
      },
      security: {
        twoFactor: mapPanel(twoFactor, toTwoFactorCard),
        otherDevices: mapPanel(sessions, countOtherDevices),
        deletion: mapPanel(deletion, toDeletionWarning),
      },
      upcoming: registrations.upcoming.map(toMyEventRow),
      past: registrations.past.map(toMyEventRow),
      transactions: payments.items.map(toTransactionRow),
      window: pageWindow(payments.meta),
      totals: toPaymentTotals(summary),
    }
  }),

  /**
   * Everything the two tabs can submit (US-DISC-11 criteria 1–2, US-DISC-12
   * criteria 1 and 3).
   *
   * Through the route rather than a handler in the component so the loader
   * revalidates on success and the tabs re-read the saved record — there is no
   * second copy of it to go stale. A refusal comes back as `ActionResult` and is
   * shown beside the control, in the API's own words.
   *
   * The photo is deliberately not here: its bytes go straight from the browser
   * to storage, which is not a form post. See `ProfileTab`.
   */
  action: attendeeAction(async ({ request }: LoaderArgs) => {
    const form = await request.formData()
    return (SUBMISSIONS[String(form.get('intent') ?? '')] ?? SAVE_PROFILE)(form)
  }),
}

/** Where the ticket modal loads one ticket's pass from — the route below. */
export const ticketPassPath = (ticketId: string) =>
  `/portal/my-events/tickets/${encodeURIComponent(ticketId)}`

/**
 * A resource route: one ticket's pass and its printable copy, fetched when the
 * ticket modal opens it (US-DISC-07). Not part of the page's data — an order of
 * four is eight requests to answer a question nobody asked.
 *
 * A refusal comes back as data and is never thrown: a fetcher's thrown error
 * replaces the page — or, after a revalidation, the whole app — with an error
 * screen, over one ticket that would not open.
 */
export const ticketPassRoute = {
  loader: attendeeData(async ({ params }: LoaderArgs): Promise<Panel<TicketPass>> => {
    const ticketId = params.ticketId ?? ''
    const [pass, printed] = await Promise.all([
      panel(myEventsApi.ticket(ticketId)),
      panel(myEventsApi.printablePass(ticketId)),
    ])
    return mapPanel(pass, (wire) => toTicketPass(wire, printed))
  }),
}
