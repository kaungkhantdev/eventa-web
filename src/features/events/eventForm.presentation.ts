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
