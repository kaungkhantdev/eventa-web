import { JPG_PNG_IMAGE_TYPES, UPLOAD_MAX_MIB, acceptAttribute } from '@/lib/imageUploads'
import type { ImageRefusal } from '@/lib/imageUploads'

/** The events module's named constants. */

/** How many event pills fit in a square before they roll up into "+N more". */
export const MAX_PILLS_PER_DAY = 3

/** Six weeks — the most any month can span, and a grid that never reflows. */
export const CELLS = 42

/** The namespace every Hugeicons class carries; a slug without it is tofu. */
export const ICON_PREFIX = 'hgi-'

/** Shown when a category has no icon of its own. */
export const DEFAULT_CATEGORY_ICON = 'hgi-folder-01'

/** Icon slugs offered in the create/edit panel's picker. */
export const CATEGORY_ICONS = [
  'hgi-new-releases',
  'hgi-favourite',
  'hgi-presentation-bar-chart-01',
  'hgi-charity',
  'hgi-mic-01',
  'hgi-user-multiple',
  'hgi-briefcase-01',
  'hgi-dumbbell-01',
  'hgi-mortarboard-01',
  'hgi-paint-board',
  'hgi-camera-01',
  'hgi-gift',
  'hgi-music-note-01',
  'hgi-champion',
  'hgi-star',
  'hgi-sparkles',
  'hgi-birthday-cake',
  'hgi-ticket-01',
] as const

/** For the `accept` attribute, so the file picker filters before anyone chooses. */
export const COVER_ACCEPT = acceptAttribute(JPG_PNG_IMAGE_TYPES)

/**
 * The cover field's own wording. A total lookup, so a reason added to the shared
 * type must be worded here before this file compiles.
 *
 * The size message suggests an export size because the dropzone recommends
 * one — that advice is why the copy cannot be shared.
 */
export const REASON: Readonly<Record<ImageRefusal, string>> = {
  'wrong-type': 'That has to be a PNG or JPG image.',
  empty: 'That file is empty.',
  'too-large': `That image is over ${UPLOAD_MAX_MIB}MB. Try a smaller one, or export it at 1600×900.`,
}

/**
 * Which avatar tint a person gets.
 *
 * The API sends no colour — it is presentation, not data — so it is derived
 * from the name, which keeps the same person the same colour on every visit
 * instead of shuffling on each render.
 */
export const AVATAR_TONES = ['brand', 'blue', 'pink', 'amber', 'violet'] as const

/**
 * For a word this build has never been taught. Kept, but no value the API can
 * send reaches it any more.
 */
export const PAYMENT_PILL_FALLBACK = 'bg-canvas text-muted'

export const EVENT_TABS = [
  'overview',
  'registrations',
  'attendees',
  'speakers',
  'agenda',
  'tickets',
] as const

/** The API's own payment-status filters for the registrations tab. */
export const REGISTRATION_FILTERS = ['all', 'paid', 'pending', 'refunded'] as const

/** How many speakers the tab shows before it would need paging of its own. */
export const SPEAKER_LIMIT = 100

/** What the Review step's checklist says a reserved event still needs (US-EVT-05). */
export const SEAT_TYPES_REQUIREMENT = 'a ticket type for every seat'

/** Icons offered in each highlight row's dropdown. */
export const HL_ICONS: { slug: string; label: string }[] = [
  { slug: 'hgi-sparkles', label: 'Sparkles' },
  { slug: 'hgi-mic-01', label: 'Speakers' },
  { slug: 'hgi-user-multiple', label: 'People' },
  { slug: 'hgi-presentation-bar-chart-01', label: 'Talks' },
  { slug: 'hgi-headphones', label: 'Workshops' },
  { slug: 'hgi-star', label: 'Star' },
  { slug: 'hgi-champion', label: 'Award' },
  { slug: 'hgi-ticket-01', label: 'Ticket' },
  { slug: 'hgi-gift', label: 'Gift' },
  { slug: 'hgi-music-note-01', label: 'Music' },
  { slug: 'hgi-camera-01', label: 'Photo' },
  { slug: 'hgi-rocket-01', label: 'Launch' },
  { slug: 'hgi-global', label: 'Global' },
  { slug: 'hgi-favourite', label: 'Heart' },
  { slug: 'hgi-wifi-01', label: 'Wi-Fi' },
  { slug: 'hgi-medal-first-place', label: 'Medal' },
]

/** What the Seating step says, under its hint, while its save leaves the seat map to Assign seats. */
export const SEAT_MAP_DEFERRED_NOTE =
  'New seats need a ticket type. The seat map is saved when you give them one in Assign seats.'

/** What Assign seats says while the types saved from Tickets are still landing. */
export const SAVING_TICKET_TYPES = 'Saving your ticket types…'

/**
 * What the waitlist switch says under it (US-REG-04). Reserved seating has no
 * waitlist: a freed seat would have to be one particular seat, picked for
 * somebody who is not at the map to pick it — so the switch says why it is off
 * instead of looking broken.
 */
export const WAITLIST_HINT: Record<'ga' | 'reserved', string> = {
  ga: 'Let attendees join a waitlist once capacity is reached.',
  reserved: 'Waitlists are for general admission — a freed seat can’t be offered without choosing it.',
}

/**
 * The statuses and visibility whose public page eventa-api will actually serve.
 *
 * Mirrored from its `public-pages.repository`, which returns a row only when
 * the event is PUBLIC, one of these statuses, and has a `publishedAt`. Guessing
 * wider than the server does is what turns a Preview button into a 404: a draft
 * has no public page at all, and neither does an unlisted or private one.
 */
export const LIVE_STATUSES: readonly string[] = ['planned', 'upcoming', 'live']
export const PUBLIC_VISIBILITY = 'public'

/** What the organizer is told when the browser blocks the preview tab (US-PAGE-09). */
export const POPUP_BLOCKED_HINT =
  'Your browser blocked the preview — allow pop-ups for this site and try again.'

export const SAVED_TOAST = 'Changes saved.'
export const SEAT_MAP_DEFERRED_TOAST = 'Saved. Give the new seats a ticket type in Assign seats to save the seat map.'

/**
 * How many events a picker offers. Enough that the search box is doing the
 * narrowing rather than this limit; a workspace past it needs the server-side
 * search the picker's UI is already shaped for.
 */
export const EVENT_OPTIONS_LIMIT = 100

/** `ConfigureReservedDto`'s own ceilings: past them the API refuses the map. */
export const SEAT_ROWS_MAX = 100
export const SEATS_PER_ROW_MAX = 100
export const NO_TICKET_TYPE = 'No ticket type'
/** The "No ticket type" option's value, in a row's dropdown and the paint picker. */
export const NO_TYPE_VALUE = ''
/**
 * A row dropdown's value while the row's seats differ: a disabled "Mixed"
 * placeholder, until a type is picked for the whole row. Never a ticket id,
 * which the API makes a UUID.
 */
export const MIXED_ROW = 'mixed'
/** The API requires a map name; the venue is the sensible default, then this. */
export const DEFAULT_MAP_NAME = 'Main hall'

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/**
 * The API's answer to a delete it will not do because the event has to be
 * cancelled instead — published, or holding registrations or payments.
 */
export const CANCEL_INSTEAD = /cancel it instead/i

/** The longest reason `CancelEventDto` accepts. */
export const CANCEL_REASON_MAX = 500

/**
 * What the organizer is told once it is done. The API's own words: the
 * refunds and notices go out after the request returns (US-EVT-08 AC4).
 */
export const CANCELLED_MESSAGE = 'Event cancelled. Refunds and attendee notices are being processed.'

export const EVENT_VIEWS = ['overview', 'calendar'] as const

/** The orderings offered, spelled as the API spells them. */
export const EVENT_SORTS = ['registrations', 'name', 'date'] as const
export const EVENT_BUCKETS = ['active', 'completed'] as const

/** How many cards the upcoming grid asks for — four rows of the widest layout. */
export const UPCOMING_LIMIT = 12

/**
 * The longest search each endpoint's DTO accepts (`@MaxLength`). Past it the API
 * answers 400 — and a loader that throws takes the whole screen down with it, so
 * the loaders in `events.routes.ts` truncate a pasted URL rather than have it
 * rejected, and the search boxes stop at the same length.
 */
export const MAX_EVENT_SEARCH = 120
export const MAX_CATEGORY_SEARCH = 80

/** Thrown for a delete nothing in the console posts — a bug, not a refusal. */
export const UNCONFIRMED_DELETE = 'This delete was not confirmed.'

/** How many of the workspace's events the "Preview with" switcher offers. */
export const PREVIEW_EVENTS = 3

/**
 * The categories screen is not paged — it asks for the whole set in one go, up
 * to the API's own maximum. That is what lets it sort by event count in the
 * browser without the count on screen disagreeing with the cards below it.
 */
export const CATEGORIES_LIMIT = 100

export const CATEGORY_SORTS = ['name', 'count-desc', 'count-asc'] as const

export const CATEGORY_VIEWS = ['grid', 'list'] as const

export const TEMPLATE_IDS: readonly string[] = ['aurora', 'noir', 'minimal', 'atlas']

/** Long enough to read, short enough to try again. */
export const COPIED_MS = 1500

/** How the event detail page's action names a session removal. */
export const REMOVE_SESSION_FIELDS = { intent: 'remove-session' }

export const SESSION_TYPES = ['Keynote', 'Talk', 'Workshop', 'Panel', 'Break']

/**
 * The cap the counter shows, in CHARACTERS THE ORGANIZER TYPED — not markup.
 * The API allows 10,000 characters of sanitised HTML, so this leaves roughly
 * double the typed length as headroom for tags. Counting the markup instead
 * would make the number jump when someone bolded a word.
 */
export const DESC_MAX = 5000

/** The longest address and colour `UpdatePageDto` accepts. */
export const PAGE_SLUG_MAX = 80
export const PAGE_ACCENT_MAX = 9

/* Scoped CSS ported verbatim from the source page's inline <style> blocks. */
export const SCOPED_CSS = `
.efhouse{background:radial-gradient(120% 90% at 50% -10%, #17201c 0%, #0c110f 60%)}
.efseat{height:16px;width:16px;flex:none;border-radius:5px 5px 2px 2px;background:rgba(255,255,255,.16)}
.efseat-sel{background:#1ba770;box-shadow:0 0 0 2px rgba(27,167,112,.3)}
.efseat-booked{background:rgba(255,255,255,.05)}
.efrowlab{color:rgba(255,255,255,.5);font-size:10px;font-weight:600;width:14px;text-align:center;flex:none}
#desc-editor-wrap{ border:1px solid rgb(var(--hair)); border-radius:10px; background:rgb(var(--surface)); transition:box-shadow .15s ease; }
#desc-editor-wrap:focus-within{ box-shadow:0 0 0 4px rgb(27 167 112 / .15); }
#desc-editor-wrap .ql-toolbar.ql-snow{ border:0; border-bottom:1px solid rgb(var(--line)); border-radius:10px 10px 0 0; padding:7px 8px; }
#desc-editor-wrap .ql-container.ql-snow{ border:0; border-radius:0 0 10px 10px; font-family:inherit; font-size:13px; }
#desc-editor-wrap .ql-editor{ min-height:118px; padding:12px; line-height:1.6; color:rgb(var(--ink)); }
#desc-editor-wrap .ql-editor.ql-blank::before{ left:12px; right:12px; color:rgb(var(--muted)); font-style:normal; }
#desc-editor-wrap .ql-snow .ql-stroke{ stroke:rgb(var(--muted)); }
#desc-editor-wrap .ql-snow .ql-fill{ fill:rgb(var(--muted)); }
#desc-editor-wrap .ql-snow .ql-picker{ color:rgb(var(--ink)); }
#desc-editor-wrap .ql-snow.ql-toolbar button:hover .ql-stroke,
#desc-editor-wrap .ql-snow.ql-toolbar button.ql-active .ql-stroke,
#desc-editor-wrap .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke{ stroke:#1ba770; }
#desc-editor-wrap .ql-snow.ql-toolbar button:hover .ql-fill,
#desc-editor-wrap .ql-snow.ql-toolbar button.ql-active .ql-fill{ fill:#1ba770; }
#desc-editor-wrap .ql-snow.ql-toolbar button:hover,
#desc-editor-wrap .ql-snow.ql-toolbar button.ql-active,
#desc-editor-wrap .ql-snow .ql-picker-label:hover,
#desc-editor-wrap .ql-snow .ql-picker-item:hover,
#desc-editor-wrap .ql-snow .ql-picker-item.ql-selected{ color:#1ba770; }
#desc-editor-wrap .ql-snow .ql-picker-options{ background:rgb(var(--surface)); border-color:rgb(var(--hair))!important; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.14); }
#desc-editor-wrap .ql-snow .ql-tooltip{ background:rgb(var(--surface)); border-color:rgb(var(--hair)); color:rgb(var(--ink)); box-shadow:0 8px 24px rgba(0,0,0,.16); border-radius:8px; }
#desc-editor-wrap .ql-snow .ql-tooltip input[type=text]{ background:rgb(var(--canvas)); border-color:rgb(var(--hair)); color:rgb(var(--ink)); border-radius:6px; }
`

/** A seat to paint: a hit target a thumb can use on a phone, and a visible focus. */
export const PAINTABLE_SEAT =
  'cursor-pointer hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white pointer-coarse:!h-7 pointer-coarse:!w-7'

export const ALL_TYPES = 'All types'

export const MENU_ITEM =
  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink transition hover:bg-line'
