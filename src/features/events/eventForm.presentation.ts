/** The wizard's own vocabulary: its steps, its icon set and the seat-row letters. */

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

export type WizardStep = {
  label: string
  tip: string
}

export const STEPS: WizardStep[] = [
  {
    label: 'Basics',
    tip: 'Give your event a clear title and description, a cover image and a few highlights for the landing page.',
  },
  {
    label: 'Date & location',
    tip: 'Set exactly when your event runs, and whether it is in-person (with a venue) or online.',
  },
  {
    label: 'Seating',
    tip: 'General admission needs no seats. Reserved seating lets attendees pick their spot — preview the seat map here.',
  },
  {
    label: 'Tickets',
    tip: 'Add at least one ticket type with a price and quantity, then set your total capacity.',
  },
  {
    label: 'Review & publish',
    tip: 'Pick a landing-page template and review your setup. Publishing lets attendees register right away.',
  },
]

/** Row labels for the reserved-seating preview. */
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

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

/** The wizard's own fields, packed the way `toDraftPreview` unpacks them. */
function draftParams(typed: TypedEvent): URLSearchParams {
  const params = new URLSearchParams()
  const title = typed.title.trim()
  const venue = typed.venue.trim()
  if (title) params.set('title', title)
  if (venue) params.set('venue', venue)
  if (typed.online) params.set('online', '1')
  const packed = typed.highlights
    .map((h) => (h.label.trim() ? `${h.icon}:${h.label.trim()}` : null))
    .filter((entry): entry is string => entry !== null)
  if (packed.length) params.set('hl', packed.join('|'))
  return params
}

/**
 * Where Preview goes.
 *
 * Two different pages behind one button, because there are two different
 * things to look at. Once an event is live its page really exists, and the
 * only honest preview is that page — the same URL an attendee opens, with the
 * agenda, speakers, tickets and FAQs the organizer actually entered. Before
 * then nothing is published, so the page is built from what is in the form,
 * which shows the design and the typed copy and nothing borrowed.
 *
 * Note the first branch shows what is SAVED, not what is on screen: it is a
 * fetch of the live page. The caller is responsible for saying so.
 */
export function landingPreviewHref(
  template: string,
  saved: SavedEvent | null,
  typed: TypedEvent,
): string {
  const slug = publicSlugOf(saved)
  const params = slug === null ? draftParams(typed) : new URLSearchParams({ event: slug })
  const query = params.toString()
  return `/landing/${template}${query ? `?${query}` : ''}`
}
