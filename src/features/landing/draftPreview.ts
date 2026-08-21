import type { LandingEvent, LandingHighlight } from './types'

/**
 * The create-event wizard's "preview this template" (US-PAGE-02).
 *
 * A draft has not been saved, so there is no slug to fetch and nothing on the
 * API to fetch it from — the organizer is looking at what they have typed in
 * the form beside them. This builds a page out of exactly that and nothing
 * else: no agenda, no speakers, no tickets, no FAQs, because a draft has none
 * and the templates leave a section out rather than head an empty one.
 *
 * The kit filled the gaps from a demo event. Showing somebody another event's
 * speakers under their own title is not a preview of their page.
 */

const UNTITLED = 'Your event'
const HIGHLIGHT_SEPARATOR = '|'
const DEFAULT_HIGHLIGHT_ICON = 'hgi-sparkles'

/** Everything a draft cannot know. Stated once, so the omissions are visible. */
const BLANK: LandingEvent = {
  slug: '',
  title: UNTITLED,
  kicker: '',
  tagline: '',
  category: '',
  dateText: '',
  timeText: '',
  venue: '',
  city: '',
  address: '',
  priceFrom: '',
  seating: '',
  seatsLeft: 0,
  capacity: 0,
  attendeesText: '',
  accent: '',
  organizer: '',
  contactEmail: '',
  /** Nothing is published, so there is nowhere to send anybody. */
  registerUrl: '',
  socials: {},
  about: '',
  highlights: [],
  agendaTitle: '',
  agenda: [],
  speakersTitle: '',
  speakers: [],
  ticketsTitle: '',
  tickets: [],
  faqs: [],
  online: false,
  onlineNote: '',
}

export function toDraftPreview(params: URLSearchParams): LandingEvent {
  const title = params.get('title')?.trim()
  return {
    ...BLANK,
    title: title || UNTITLED,
    venue: params.get('venue')?.trim() ?? '',
    online: params.get('online') === '1',
    highlights: highlightsOf(params.get('hl')),
  }
}

/**
 * `hgi-wifi:Free WiFi|hgi-coffee:Lunch` → the pairs the wizard packed.
 *
 * Split on the FIRST colon only: a label may perfectly well contain one, and
 * splitting on every colon would truncate "Keynote: the year ahead".
 */
function highlightsOf(packed: string | null): LandingHighlight[] {
  if (!packed) return []
  return packed
    .split(HIGHLIGHT_SEPARATOR)
    .map(toHighlight)
    .filter((highlight): highlight is LandingHighlight => highlight !== null)
}

function toHighlight(entry: string): LandingHighlight | null {
  const colon = entry.indexOf(':')
  const icon = colon === -1 ? '' : entry.slice(0, colon).trim()
  const label = (colon === -1 ? entry : entry.slice(colon + 1)).trim()
  if (!label) return null
  return { icon: icon.startsWith('hgi-') ? icon : DEFAULT_HIGHLIGHT_ICON, label }
}
