import { seatRowsApply, type SeatingFacts } from './eventForm.mapper'
import { seatingWaitsForRowTypes, type SeatMapState } from './eventSeating.mapper'

/** The wizard's own vocabulary: its steps and its icon set. */

export type Highlight = {
  icon: string
  label: string
}

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

/** Each wizard step, named so the page renders it by name rather than by position. */
export type StepKey = 'basics' | 'when' | 'seating' | 'tickets' | 'seats' | 'review'

export type WizardStep = {
  key: StepKey
  label: string
  tip: string
}

/** Every step there can be, in order. `wizardStepsOf` says which an event shows. */
export const STEPS: readonly WizardStep[] = [
  {
    key: 'basics',
    label: 'Basics',
    tip: 'Give your event a clear title and description, a cover image and a few highlights for the landing page.',
  },
  {
    key: 'when',
    label: 'Date & location',
    tip: 'Set exactly when your event runs, and whether it is in-person (with a venue) or online.',
  },
  {
    key: 'seating',
    label: 'Seating',
    tip: 'General admission needs no seats. Reserved seating lets attendees pick their spot — preview the seat map here.',
  },
  {
    key: 'tickets',
    label: 'Tickets',
    tip: 'Add at least one ticket type with a price and quantity, then set your total capacity.',
  },
  {
    key: 'seats',
    label: 'Assign seats',
    tip: 'Give each row of the seat map a ticket type — say VIP up front, Normal behind. Each type sells only its own rows.',
  },
  {
    key: 'review',
    label: 'Review & publish',
    tip: 'Pick a landing-page template and review your setup. Publishing lets attendees register right away.',
  },
]

/**
 * The steps this event's wizard shows (US-EVT-02). Assign seats is only for an
 * in-person reserved event — the one kind with seat rows to give ticket types
 * (US-EVT-05) — and it follows Tickets because a row can only be given a type
 * that has been saved.
 */
export function wizardStepsOf(event: SeatingFacts): WizardStep[] {
  return seatRowsApply(event) ? [...STEPS] : STEPS.filter((step) => step.key !== 'seats')
}

/** What a step's save asks the route action to write. */
export type SaveIntent = 'save' | 'seating' | 'tickets'

/** Assign seats writes the seat map too: each row's type travels with the grid. */
const SAVE_INTENT: Record<StepKey, SaveIntent> = {
  basics: 'save',
  when: 'save',
  seating: 'seating',
  tickets: 'tickets',
  seats: 'seating',
  review: 'save',
}

/**
 * The write a step's save sends. Seating saves the rest of the event instead
 * of the seat map while the map has a row the API would refuse untyped — on a
 * published, typed map, a row just added there: Assign seats gives it a type
 * and sends the grid whole (US-EVT-05).
 */
export function saveIntentOf(step: StepKey, event: SeatMapState): SaveIntent {
  if (step === 'seating' && seatingWaitsForRowTypes(event)) return 'save'
  return SAVE_INTENT[step]
}

/**
 * The open step's place, kept on the rail. Switching Reserved to General
 * admission drops Assign seats, and the step that was open must still exist.
 */
export function clampStep(index: number, stepCount: number): number {
  return Math.max(0, Math.min(stepCount - 1, index))
}

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
 * Capacity for the summary rail — the number, or a dash when there is none.
 *
 * An unset capacity is not a capacity of nought. Rendering `0` says "nobody may
 * come", which is the opposite of what a blank field means: as many as the
 * ticket tiers allow. The same distinction the house rules draw for a masked
 * amount, which shows "—" rather than ฿0.
 */
export function summaryCapacity(typed: string): string {
  const capacity = Number(typed.trim())
  if (!typed.trim() || !Number.isFinite(capacity) || capacity <= 0) return '—'
  return capacity.toLocaleString('en-US')
}

/**
 * What the wizard's last button says.
 *
 * A draft is published; an event that is already live is saved. Offering
 * "Publish event" over a published conference describes an action the organizer
 * cannot take and does not want, and leaves them hunting for the Save that the
 * wizard has been doing quietly on every step.
 */
export function finalLabel(isDraft: boolean, saving: boolean): string {
  if (isDraft) return saving ? 'Publishing…' : 'Publish event'
  return saving ? 'Saving…' : 'Save changes'
}

/**
 * The header's save button.
 *
 * "Save as draft" is only true for an event that does not exist yet — that
 * click creates a draft. On one that already exists, published or not, the same
 * click saves the open step and changes no status, and calling it "draft" read
 * as an offer to unpublish. Nobody pressed it, so a one-field edit meant
 * clicking Next to the end of the wizard.
 */
export function headerSaveLabel(exists: boolean, saving: boolean): string {
  if (saving) return 'Saving…'
  return exists ? 'Save changes' : 'Save as draft'
}

/* ------------------------------ landing preview --------------------------- */

/** What the API has stored for this event; null while it has never been saved. */
export interface SavedEvent {
  slug: string
  status: string
  visibility: string
}

/** What is in the boxes right now — what a draft preview is built from. */
export interface TypedEvent {
  title: string
  venue: string
  online: boolean
  highlights: Highlight[]
}

/**
 * The statuses and visibility whose public page eventa-api will actually serve.
 *
 * Mirrored from its `public-pages.repository`, which returns a row only when
 * the event is PUBLIC, one of these statuses, and has a `publishedAt`. Guessing
 * wider than the server does is what turns a Preview button into a 404: a draft
 * has no public page at all, and neither does an unlisted or private one.
 */
const LIVE_STATUSES: readonly string[] = ['planned', 'upcoming', 'live']
const PUBLIC_VISIBILITY = 'public'

/** The slug to preview by, or null when there is no public page to preview. */
function publicSlugOf(saved: SavedEvent | null): string | null {
  if (!saved || !saved.slug) return null
  const served = saved.visibility === PUBLIC_VISIBILITY && LIVE_STATUSES.includes(saved.status)
  return served ? saved.slug : null
}

/** The typed highlights as `icon:label` pairs, the way `toDraftPreview` reads them. */
function packedHighlights(typed: TypedEvent): string {
  return typed.highlights
    .map((h) => (h.label.trim() ? `${h.icon}:${h.label.trim()}` : null))
    .filter((entry): entry is string => entry !== null)
    .join('|')
}

/** The wizard's own fields, packed the way `toDraftPreview` unpacks them. */
function draftParams(typed: TypedEvent): URLSearchParams {
  const params = new URLSearchParams()
  const title = typed.title.trim()
  const venue = typed.venue.trim()
  const highlights = packedHighlights(typed)
  if (title) params.set('title', title)
  if (venue) params.set('venue', venue)
  if (typed.online) params.set('online', '1')
  if (highlights) params.set('hl', highlights)
  return params
}

/**
 * The same fields laid over a live page, the way `overlayDraft` reads them.
 * Every one is stated, empty or not: over a saved page an absent field means
 * "keep the saved one", so a cleared one would otherwise not show as cleared.
 */
function overlayParams(slug: string, typed: TypedEvent): URLSearchParams {
  return new URLSearchParams({
    event: slug,
    title: typed.title.trim(),
    venue: typed.venue.trim(),
    online: typed.online ? '1' : '0',
    hl: packedHighlights(typed),
  })
}

/**
 * Where Preview goes (US-PAGE-09).
 *
 * Two different pages behind one button, because there are two different
 * things to look at. Once an event is live its page really exists, so the
 * preview is that page — the agenda, speakers, tickets and FAQs the organizer
 * actually entered — with what is typed in the wizard laid over it, saved or
 * not. Before then nothing is published, so the page is built from what is in
 * the form, which shows the design and the typed copy and nothing borrowed.
 */
export function landingPreviewHref(
  template: string,
  saved: SavedEvent | null,
  typed: TypedEvent,
): string {
  const slug = publicSlugOf(saved)
  const params = slug === null ? draftParams(typed) : overlayParams(slug, typed)
  const query = params.toString()
  return `/landing/${template}${query ? `?${query}` : ''}`
}

/** What the organizer is told when the browser blocks the preview tab (US-PAGE-09). */
export const POPUP_BLOCKED_HINT =
  'Your browser blocked the preview — allow pop-ups for this site and try again.'

/**
 * Open the preview in a new tab; false when the browser blocked it.
 *
 * Not with "noopener": that makes `window.open` answer null whether or not a
 * tab opened, so a blocked one could not be told apart. The opener is cut
 * afterwards instead, which leaves the new page just as unable to reach back.
 */
export function openPreviewTab(
  href: string,
  open: (url: string, target: string) => Window | null,
): boolean {
  const tab = open(href, '_blank')
  if (!tab) return false
  tab.opener = null
  return true
}
