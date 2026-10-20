/** The attendees module's named constants. */

export const FORM_ID = 'attendee-contact-form'

/** The DTO's own limits — past them the API answers 400 (`@MaxLength`). */
export const MAX_NAME = 120

export const MAX_EMAIL = 254

export const MAX_PHONE = 24

/**
 * The hidden input carrying the row's version, named here so the panel that
 * writes it and the action that reads it cannot drift apart — the same reason
 * `storedInput` exists.
 */
export const VERSION_INPUT = 'stored-version'

export const SEGMENTS = ['all', 'new', 'checked_in', 'vip'] as const

export const SORTS = ['recent', 'name', 'events', 'tickets'] as const

export const MAX_SEARCH = 120

/** The URL parameter naming whose profile panel is open. */
export const PROFILE_PARAM = 'profile'

/** How far back the panel's timeline reaches before deferring to the audit log. */
export const TIMELINE_LIMIT = 20

/** The one kind of record `GET /audit` can be asked the trail of today. */
export const ATTENDEE_SUBJECT = 'attendee'

/** What the edit panel asks for; anything else on this route is an invitation. */
export const CONTACT_INTENT = 'contact'

/** The three details an organizer may correct, as the row stores them. */
export const CONTACT_FIELDS = ['name', 'email', 'phone'] as const

export const ALL_TAGS = 'All tags'

export const MAX_SEARCH_LENGTH = 120

/**
 * Inviting somebody to an event (US-REG-06).
 *
 * ONE NAMED PERSON, which is what the story asks for: "Given I enter a
 * recipient name, email and exactly one event". This was a textarea of
 * addresses with no name field — a bulk invite that appears in no story and
 * that no endpoint accepts. Two of the story's five criteria (the recipient
 * name, and the inline error when it is missing) could not be met by a form
 * with nowhere to type one, and the route it posted to was the event-wide
 * broadcast, which refused every request.
 *
 * The event is required: an invitation is to something, and the API has no
 * notion of a workspace-wide one.
 */
/** `SendInviteDto`: `@MaxLength(120)` on the name, 250 on the note. */
export const MAX_RECIPIENT_NAME = 120

export const MAX_INVITE_MESSAGE = 250

export const ALL_EVENTS = 'All events'

export const PAID = 'paid'

export const REJECT = 'Reject'

/** Said before the click: this rejection gives the buyer's money back (US-REG-02). */
export const REJECT_AND_REFUND = 'Reject and refund'

/**
 * The kit's four pills. `all` sends no status, so every bucket is counted.
 *
 * Three statuses deliberately have none: `confirmed`, `rejected` and
 * `expired`. The API could serve a tab for any of them today —
 * `ListRegistrationsDto.status` accepts every `order_status` member — so this
 * is a choice, not a limitation, and it is worth saying why `expired` did not
 * get one along with its count.
 *
 * It cannot be justified on its own merits. `expired` is neither rarer nor
 * more actionable than `rejected`: both are terminal, and `canApprove`,
 * `canReject` and `canOffer` are all false on either, so a pill would open a
 * page of rows with every control disabled. (That alone is not the argument —
 * `cancelled` has a pill and is just as finished.) The point is that the three
 * without one are not distinguishable from each other, so the only
 * non-arbitrary choices are a pill for none of them or for all three, and all
 * three means a six-pill status browser in place of a four-pill work queue.
 * That is a change to the kit's design, which is the visual contract this app
 * ports rather than something to redecide while closing a count gap.
 *
 * What that costs is real and worth stating rather than glossing: expired
 * rows are findable only by looking under All, narrowed by event or search.
 * `tabOf` falls back to `all` for a tab it does not know, so not even a
 * hand-typed `?tab=expired` reaches them. If reconciliation turns out to need
 * them separately, the count is already published and a pill is one line
 * here, one in `TAB_STATUS` and one in `TAB_LABEL`.
 */
export const REG_TABS = ['all', 'pending', 'waitlist', 'cancelled'] as const

/** How many events the filter offers; the API's own maximum for one page. */
export const EVENT_OPTIONS = 100

/** How many tiers the "Add registration" panel can choose between. */
export const TIER_OPTIONS = 100
