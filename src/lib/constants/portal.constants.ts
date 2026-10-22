import type { Persona } from '@/lib/persona'
import { DEFAULT_PAGE_SIZE } from '@/lib/paging'
import { JPG_PNG_IMAGE_TYPES, acceptAttribute } from '@/lib/imageUploads'
import type { JpgPngImageType } from '@/lib/imageUploads'

/** The portal module's named constants. */

/**
 * The product's one timezone, which the portal's account settings offer and
 * fall back to. `@/lib/format` keeps its own copy private.
 */
export const BANGKOK = 'Asia/Bangkok'
export const THB = 'THB'
export const DEFAULT_LOCALE = 'en' as const

export const LOCALES = ['en', 'th'] as const

export const CURRENCY_CODE = /^[A-Z]{3}$/

/**
 * The topics an attendee token is given, from the API's own list
 * (`ATTENDEE_CATEGORIES` in `notification-preferences.service.ts`).
 *
 * The other seven members of `notification_kind` belong to the organizer and
 * are refused for this persona, which is why only these two are named here.
 * Order confirmations and receipts are in NEITHER list on purpose: they are
 * transactional, and nothing on the Notifications card can switch them off
 * (criterion 2).
 */
export const ATTENDEE_NOTIFICATION_CATEGORIES = ['reminder', 'marketing'] as const

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

export const UNAVAILABLE_FALLBACK = 'Unavailable'
export const WAITLIST_OPEN = 'Sold out · join the waitlist'

/**
 * Where "Back to event" goes.
 *
 * The checkout payload carries no event type, so the type-specific template
 * Discover picks cannot be worked out in `toCheckoutView` — aurora is the
 * general-purpose one and every template reads the same event.
 */
export const BACK_TEMPLATE = 'aurora'

export const ORDINAL: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' }

export const PROMPT_PAY = 'PromptPay'
export const FAILED = 'failed'

/**
 * The one persona whose saved profile fills the buyer boxes.
 *
 * Named once and read, through `prefillsFromProfile`, by both rules —
 * `toBuyerDefaults` in `features/portal/checkout.mapper.ts` and `savedProfile`
 * in `features/portal/checkout.routes.ts` — because "whose details pre-fill"
 * and "whose profile is worth fetching" have to be the same answer: a loader
 * that fetched for somebody the mapper then ignores would spend a round trip
 * to achieve nothing, and one that fetched for fewer would leave a signed-in
 * attendee retyping details the product already holds.
 */
export const PREFILLING_PERSONA: Persona = 'attendee'

export const MISSING_EVENT = 'This registration link does not name an event.'

/**
 * The checkout action's own discriminants, named so `revalidateCheckout`
 * (`features/portal/checkout.routes.ts`) cannot drift from them.
 */
export const QUOTE_INTENT = 'quote'
export const BOOK_INTENT = 'book'
export const WAITLIST_INTENT = 'waitlist'

export const HOME = '/portal/discover'

export const NOTICE_TONES = {
  brand: 'bg-brand-soft text-brand',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
} as const

/** One form on one page, so the id can be quoted in a footer `form=`. */
export const CHANGE_PASSWORD_PANEL_FORM_ID = 'portal-change-password'

/** One dialog on one page, so the id can be quoted in the footer's `form=`. */
export const DANGER_ZONE_CARD_FORM_ID = 'portal-delete-account'

/** How often to re-read the order while a PromptPay code is on screen. */
export const POLL_MS = 5_000

/** Long enough to read what was booked, short enough not to feel stuck. */
export const HANDOFF_MS = 1_200

/**
 * The email-change form's id, named once because three elements have to agree
 * on it: the form, the box the kit left in the details grid, and its button.
 *
 * A fixed id rather than `useId()`, as the checkout page's `form="booking"`
 * already does — there is one Profile tab on one page, and the id has to be
 * quotable in a `form=` attribute.
 */
export const EMAIL_FORM_ID = 'portal-profile-email'

/**
 * The phone's three submissions, each its own form — and like the email's,
 * all OUTSIDE the details form, because forms cannot nest: a nested one is
 * dropped by the browser and its button silently submits the outer form
 * instead.
 */
export const PHONE_REQUEST_FORM_ID = 'portal-profile-phone'
export const PHONE_CONFIRM_FORM_ID = 'portal-profile-phone-code'
export const PHONE_REMOVE_FORM_ID = 'portal-profile-phone-remove'

export const ROWS = {
  email: 'flex items-center justify-between py-3 first:pt-0',
  middle: 'flex items-center justify-between py-3',
  marketing: 'flex items-center justify-between py-3 last:pb-0',
}

/**
 * The kit's `.switch` rule set, plus the `aria-checked` look and button reset that
 * `SwitchButton` (`features/portal/components/Switch.tsx`) needs.
 */
export const SWITCH_CSS = `
.switch{position:relative;display:inline-flex;height:1.25rem;width:2.25rem;flex:none;cursor:pointer;align-items:center}
.switch input{position:absolute;inset:0;opacity:0;cursor:pointer}
.switch .track{height:1.25rem;width:2.25rem;border-radius:9999px;background:rgb(var(--line));transition:background .18s}
.switch .dot{position:absolute;left:.125rem;height:1rem;width:1rem;border-radius:9999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:transform .18s}
.switch input:checked + .track{background:#00c066}
.switch input:checked ~ .dot{transform:translateX(1rem)}
button.switch{appearance:none;background:none;border:0;padding:0}
.switch[aria-checked="true"] .track{background:#00c066}
.switch[aria-checked="true"] .dot{transform:translateX(1rem)}
`

/** Why there is no QR: a void ticket admits nobody, so none is drawn for it. */
export const NO_LONGER_VALID = 'This ticket is no longer valid and will not admit anyone.'
export const UNDRAWABLE = 'This code could not be drawn.'

/** The most `GET /me/saved-events` sends in one page. */
export const SAVED_PAGE_LIMIT = 48

export const FREE = 'Free'
/** The kit drew three; a card with two people should not claim a third. */
export const MAX_FACES = 3

/** The strip's leading chip, which clears the category filter rather than sets it. */
export const ALL_CATEGORIES = 'All events'

/** How each urgency badge reads. */
export const BADGE_LABEL: Record<'waitlist' | 'selling_fast', string> = {
  waitlist: 'Waitlist',
  selling_fast: 'Selling fast',
}

/**
 * What the card says when a heart cannot be recorded. US-DISC-03 names the
 * message, so it is this rather than the API's or the network's own sentence;
 * the heart itself reverts, because it only ever showed the press.
 */
export const SAVE_FAILED = "Couldn't save right now."
export const UNSAVE_FAILED = "Couldn't remove it from saved right now."

/** A grid row is three cards wide, so the page comes in whole rows. */
export const DISCOVER_PAGE_SIZE = 12

export const UNTITLED_TICKET = 'Admission'

/** In line for a sold-out ticket, with no seat offered yet (US-REG-04). */
export const WAITLISTED = 'waitlisted'

/** Turned down by the organizer (US-REG-02). */
export const REJECTED = 'rejected'
export const AWAITING_APPROVAL = 'Awaiting approval'

export const NOT_APPROVED = 'The organizer did not approve this registration.'

/** What became of a rejected registration's money — nothing to say if none was taken. */
export const REJECTED_MONEY: Readonly<Partial<Record<string, string>>> = {
  refunded: 'Your payment has been refunded.',
  paid: 'Your payment is being refunded.',
}

/** Statuses that owe nothing, whatever the payment fields say. */
export const OWES_NOTHING: ReadonlySet<string> = new Set([WAITLISTED, REJECTED])

/** Money reached the organizer — and stays a fact once it has gone back. */
export const MONEY_CHANGED_HANDS: ReadonlySet<string> = new Set(['paid', 'refunded'])

/** The receipt's heading, for each of the three things its figures can mean. */
export const RECEIPT_HEADING = {
  owed: 'What you owe',
  paid: 'What you paid',
  neither: 'Order total',
} as const

/** How the offer is turned down — true only because it is made only for a ticketed order. */
export const NOT_NOW = 'Not now — your ticket is already in your email'

/** For somebody already signed in, the offer's whole point: where every booking is. */
export const SIGNED_IN_PROMPT =
  'You’re signed in — My Events lists every booking made with your account’s email.'

/**
 * The ticket statuses that still admit — the API's own rule for a valid pass
 * (`attendee-tickets.service.ts`). A scanned ticket is still the guest's.
 */
export const ADMITS: ReadonlySet<string> = new Set(['issued', 'checked_in'])

/** The methods the API will start a payment for (`PayOrderDto`). */
export const GUEST_ORDER_METHODS = ['Card', 'PromptPay'] as const

/** The account offer's submission; the payment form has no intent of its own. */
export const ACCOUNT_LINK_INTENT = 'account-link'

/** The seat-hold clock's units (`features/portal/lib/countdown.ts`). */
export const MS_PER_SECOND = 1000
export const SECONDS_PER_MINUTE = 60

export const SVG_DATA_URL = 'data:image/svg+xml;charset=utf-8,'

/** How many payments a page of the history shows. */
export const HISTORY_SIZE = DEFAULT_PAGE_SIZE

/**
 * Which of the two things the Profile tab can submit this is.
 *
 * Named once and shared with the tab's hidden field: the save is the default,
 * and moving the sign-in address is the one that has to say so.
 */
export const EMAIL_CHANGE_INTENT = 'email'

/**
 * The number is proved by a texted code, so it takes three submissions where
 * the rest of the details form takes one (US-DISC-11 AC3).
 */
export const PHONE_REQUEST_INTENT = 'phone'
export const PHONE_CONFIRM_INTENT = 'phone-code'
export const PHONE_REMOVE_INTENT = 'phone-remove'

/** One notification switch (US-DISC-12, criterion 1). */
export const NOTIFICATION_INTENT = 'notification'

/** One of the Preferences card's selects (criterion 3). */
export const DISPLAY_PREFERENCE_INTENT = 'preference'

/**
 * The Security card's three submissions (criteria 4–5).
 *
 * Only three of the five security calls are here, and the division is not
 * arbitrary: `guardedAction` reports `{ ok: true }` and discards whatever the
 * call answered, which is exactly right for these — none of them has anything
 * to say beyond "it worked", and each changes something the loader re-reads.
 *
 * Starting and confirming an enrolment are the opposite: their whole value IS
 * the answer — a seed, and the recovery codes the API will never show again —
 * and there is no loader read that could fetch either of them back. Those two
 * go straight to `securityApi` from the panel that shows them, as the profile
 * photo's three steps already do, and are gone when it closes. Deleting the
 * account is likewise not a submission the page can revalidate after: there is
 * no page left.
 */
export const PASSWORD_CHANGE_INTENT = 'change-password'
export const REVOKE_OTHER_SESSIONS_INTENT = 'revoke-other-sessions'
export const TWO_FACTOR_DISABLE_INTENT = 'disable-two-factor'

export const SAVE_OFF =
  'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60'
export const SAVE_ON =
  'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white text-red-500 shadow-sm transition'

/** Alpha suffixes, lightening each circle in the stack. */
export const TINTS = ['dd', '99', '55'] as const

/** Where somebody whose order lapsed can start again. */
export const DISCOVER = '/portal/discover'

/* Nothing on My Events is filtered — the tabs are component state and the only
   query parameters are the payment history's page and page size — so an empty
   list there always means "you have not done this yet", never "a filter hid it".
   That makes the way forward the same in every case: go and find an event.
   Attendee pages never answer emptiness with "create one". */
export const DISCOVER_ACTION = { label: 'Discover events', to: '/portal/discover', icon: 'hgi-search-01' }

export const SEAT_CSS = `
.house { background: radial-gradient(120% 90% at 50% -10%, #17201c 0%, #0c110f 60%); }
.seat {
  position: relative; height: 30px; width: 30px; border-radius: 9px 9px 4px 4px;
  display: grid; place-items: center; font-size: 11px; font-weight: 600;
  transition: background .12s, box-shadow .12s, color .12s; user-select: none;
}
.seat::after { content: ''; position: absolute; bottom: -3px; left: 4px; right: 4px; height: 3px; border-radius: 2px; background: inherit; opacity: .55; }
.seat-avail  { background: rgba(255,255,255,.08); color: rgba(255,255,255,.72); cursor: pointer; }
.seat-avail:hover { background: rgba(0,192,102,.4); color: #fff; }
.seat-sel    { background: #00c066; color: #fff; cursor: pointer; box-shadow: 0 0 0 3px rgba(0,192,102,.28); }
.seat-booked { background: rgba(255,255,255,.035); color: rgba(255,255,255,.16); cursor: not-allowed; }
.rowlab { color: rgba(255,255,255,.4); font-size: 12px; font-weight: 600; width: 18px; text-align: center; }
`

export const PORTAL_CHECKOUT_PAGE_METHODS = [
  { method: 'Card' as const, icon: 'hgi-credit-card', title: 'Card', sub: 'Visa · Mastercard' },
  { method: 'PromptPay' as const, icon: 'hgi-qr-code-01', title: 'PromptPay', sub: 'Thai QR · banking app' },
]

/** Not done, not wrong — the money or the organizer is still to come. */
export const WAITING_TONE = 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'

export const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
}

/** What the ends of the 0–10 scale mean, for whoever cannot see the anchors. */
export const NPS_ENDS: Record<number, string> = {
  0: '0 — not at all likely',
  10: '10 — extremely likely',
}

/** The icon on the card's badge — one shape, since the API sends no type here. */
export const EVENT_ICON = 'hgi-calendar-03'

/** Where a refused link sends somebody, since the page cannot know their booking. */
export const ASK_FOR_A_NEW_LINK =
  'Ask for a new link from your booking confirmation — or, if you have already chosen a password, sign in.'

/** Fixed by the link the API emails: `${PUBLIC_WEB_URL}/portal/register?claim=…`. */
export const CLAIM_PARAM = 'claim'

export const INCOMPLETE_CLAIM_LINK =
  'This link is incomplete. Open the most recent link in your email, or ask for a new one from your booking confirmation.'

export const STORAGE_PUT_FAILED = 'The photo could not be sent to storage.'

/**
 * What the badge beside the address says.
 *
 * Amber, not red: an unconfirmed change is a step somebody still has to take,
 * not a fault. The old address goes on working until the link is opened, so
 * nothing is broken while this is showing.
 */
export const VERIFIED = { tone: 'green', label: 'Verified' } as const
export const PENDING = { tone: 'amber', label: 'Pending' } as const

/**
 * A strict subset of the API's allow-list on purpose. The server also takes
 * WebP, but the profile photo card says "JPG or PNG", so offering a third type
 * would make the copy wrong. Nothing here accepts a type the server would
 * refuse.
 */
export const ACCEPTED_PHOTO_TYPES = JPG_PNG_IMAGE_TYPES

/** For the file input's `accept`, so the picker offers what we will take. */
export const PHOTO_ACCEPT_ATTRIBUTE = acceptAttribute(ACCEPTED_PHOTO_TYPES)

/**
 * What the profile photo card calls each type on screen — "JPG", where the
 * settings logo card says "JPEG". Per-feature copy, which is why it is not
 * shared.
 *
 * Exhaustive over the allow-list it names, so widening that list upstream
 * fails to compile here rather than leaving a type unnamed in a sentence.
 */
export const NAME_OF: Readonly<Record<JpgPngImageType, string>> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
}

/** The `localStorage` key a signed-out visitor's saves live under (`savedEvents.ts`). */
export const SAVED_EVENTS_STORAGE_KEY = 'eventa.savedEvents'

/** The kit's own subtitle, kept for the one state it actually describes. */
export const NEVER_SET_UP = 'Extra security at sign-in'
/** An enrolment that was started and abandoned — a seed with nothing behind it. */
export const UNFINISHED = 'Setup was started but never finished'

/**
 * The exact phrase the danger zone makes somebody type.
 *
 * `DELETE_CONFIRMATION` in eventa-api's `DeleteAccountDto`, which checks it
 * again with `@Equals` — this is the gate, not the check.
 */
export const DELETE_CONFIRMATION = 'DELETE'

/** The 0–10 scale a recommendation question is answered on. */
export const MIN_NPS_SCORE = 0
export const MAX_NPS_SCORE = 10
