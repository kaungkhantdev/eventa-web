/* Demo data for the Create-event wizard (admin/event-form.html). Ported from
   the inline <script>: the highlight icon set, seeded highlight + ticket rows,
   and the five wizard steps with their tip copy. */

export type HighlightIcon = {
  slug: string
  label: string
}

/** Icons offered in each highlight row's dropdown. */
export const HL_ICONS: HighlightIcon[] = [
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

export type Highlight = {
  icon: string
  label: string
}

/** Seeded highlight rows (icon + label). */
export const INITIAL_HIGHLIGHTS: Highlight[] = [
  { icon: 'hgi-mic-01', label: '20+ speakers' },
  { icon: 'hgi-presentation-bar-chart-01', label: 'Hands-on workshops' },
  { icon: 'hgi-sparkles', label: 'Startup showcase' },
  { icon: 'hgi-user-multiple', label: 'Networking lounge' },
]

export type FormTicket = {
  name: string
  price: string
  quantity: string
}

/** Seeded ticket-type rows on the Tickets step. */
export const INITIAL_TICKETS: FormTicket[] = [
  { name: 'General', price: '890', quantity: '600' },
  { name: 'VIP', price: '1900', quantity: '120' },
]

export type WizardStep = {
  label: string
  tip: string
}

export const STEPS: WizardStep[] = [
  { label: 'Basics', tip: 'Give your event a clear title and description, a cover image and a few highlights for the landing page.' },
  { label: 'Date & location', tip: 'Set exactly when your event runs, and whether it is in-person (with a venue) or online.' },
  { label: 'Seating', tip: 'General admission needs no seats. Reserved seating lets attendees pick their spot — preview the seat map here.' },
  { label: 'Tickets', tip: 'Add at least one ticket type with a price and quantity, then set your total capacity and registration window.' },
  { label: 'Review & publish', tip: 'Pick a landing-page template and review your setup. Publishing lets attendees register right away.' },
]

/** Row labels for the reserved-seating preview. */
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
