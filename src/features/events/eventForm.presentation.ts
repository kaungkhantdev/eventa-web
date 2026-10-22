import { seatRowsApply, type SeatingFacts } from './eventForm.mapper'
import { seatingWaitsForSeatTypes, type SeatMapState } from './eventSeating.mapper'
import { LIVE_STATUSES, PUBLIC_VISIBILITY } from '@/lib/constants/events.constants'

/** The wizard's own vocabulary: its steps and its icon set. */

export type Highlight = {
  icon: string
  label: string
}

/** Each wizard step, named so the page renders it by name rather than by position. */
export type StepKey = 'basics' | 'when' | 'seating' | 'tickets' | 'seats' | 'review'

export type WizardStep = {
  key: StepKey
  label: string
  tip: string
}

/**
 * The wizard's steps, in order — the same six for every event (US-EVT-02).
 * Assign seats follows Tickets because a seat can only be given a type that
 * has been saved; an event with no seat map keeps the step, and it says why
 * there is nothing to assign (`assignSeatsViewOf`).
 */
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
    tip: 'Add at least one ticket type with a price — and a quantity, unless your seat map sets it — then set your total capacity.',
  },
  {
    key: 'seats',
    label: 'Assign seats',
    tip: 'Give each row of the seat map a ticket type — say VIP up front, Normal behind — or pick a type and click or drag across seats to give just those seats it. Each type sells only its own seats.',
  },
  {
    key: 'review',
    label: 'Review & publish',
    tip: 'Pick a landing-page template and review your setup. Publishing lets attendees register right away.',
  },
]

/** The rail's "% completed": the open step counts as done. */
export function stepProgress(index: number): number {
  return Math.round(((index + 1) / STEPS.length) * 100)
}

/** What a step's save asks the route action to write. */
export type SaveIntent = 'save' | 'seating' | 'tickets'

/** Assign seats writes the seat map too: each seat's type travels with the grid. */
const SAVE_INTENT: Record<StepKey, SaveIntent> = {
  basics: 'save',
  when: 'save',
  seating: 'seating',
  tickets: 'tickets',
  seats: 'seating',
  review: 'save',
}

/**
 * Whether this step's save leaves the seat map to Assign seats: Seating, while
 * the map has a seat the API would refuse untyped — on a published, typed map,
 * a seat just added there. Assign seats gives it a type and sends the grid
 * whole (US-EVT-05).
 */
export function seatMapDeferredOn(step: StepKey, event: SeatMapState): boolean {
  return step === 'seating' && seatingWaitsForSeatTypes(event)
}

/**
 * The write a step's save sends. Seating saves the rest of the event instead
 * of the seat map while the map must wait for Assign seats (`seatMapDeferredOn`),
 * and Assign seats saves only the event when there is no seat map to assign.
 */
export function saveIntentOf(step: StepKey, event: SeatMapState): SaveIntent {
  if (seatMapDeferredOn(step, event)) return 'save'
  if (step === 'seats' && !seatRowsApply(event)) return 'save'
  return SAVE_INTENT[step]
}

/**
 * What Assign seats shows: the seats to give types, a save still landing, the
 * way to Tickets — or, for an event with no seat map, why there is nothing to
 * assign.
 */
export type AssignSeatsView = 'rows' | 'saving' | 'empty' | NoSeatsToAssign

/** The events with no seats to give ticket types. */
type NoSeatsToAssign = 'online' | 'ga'

/** What Assign seats says on an event with no seat map (US-EVT-02). */
export const NO_SEATS_TO_ASSIGN: Record<NoSeatsToAssign, string> = {
  online: 'Online events have no seats to assign.',
  ga: 'General admission has no seats to assign. To sell seats by ticket type, choose Reserved seating on the Seating step.',
}

/**
 * What Assign seats shows (US-EVT-05). Only an in-person reserved event has
 * seats to assign; an online event has no seating at all, so it is told that
 * first. A seat can only be given a type the API has stored, and Next on
 * Tickets opens this step while those types are still being saved — so until
 * one is known, a save in flight reads as saving, not as "add your ticket
 * types first".
 */
export function assignSeatsViewOf(event: SeatingFacts, savedTypes: number, saving: boolean): AssignSeatsView {
  if (event.isOnline) return 'online'
  if (!seatRowsApply(event)) return 'ga'
  if (savedTypes > 0) return 'rows'
  return saving ? 'saving' : 'empty'
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
