import type { EventType } from './discover.types'

/**
 * How each kind of event looks on the What's on grid, and which public page it
 * opens.
 *
 * One table per decision rather than a chain of `if (/festival|music/)` guesses
 * against free text: the API's `type` is a closed enum, so a ninth kind is a
 * row here and nothing else. The kit keyed the same look off a category string
 * it had written itself.
 */

interface TypeLook {
  icon: string
  colour: string
  /** Which of the four landing templates suits this kind of event. */
  template: 'atlas' | 'aurora' | 'minimal' | 'noir'
}

const DEFAULT_LOOK: TypeLook = {
  icon: 'hgi-ticket-star',
  colour: '#1ba770',
  template: 'aurora',
}

const LOOKS: Record<EventType, TypeLook> = {
  Conference: { icon: 'hgi-presentation-01', colour: '#0ea5e9', template: 'aurora' },
  Networking: { icon: 'hgi-connect', colour: '#14b8a6', template: 'aurora' },
  Workshop: { icon: 'hgi-tools', colour: '#6366f1', template: 'minimal' },
  'Charity & Gala': { icon: 'hgi-favourite', colour: '#f43f5e', template: 'minimal' },
  'Sports & Wellness': { icon: 'hgi-workout-run', colour: '#f59e0b', template: 'atlas' },
  'Concert & Festival': { icon: 'hgi-music-note-01', colour: '#7c3aed', template: 'atlas' },
  Exhibition: { icon: 'hgi-image-01', colour: '#ec4899', template: 'noir' },
  Seminar: { icon: 'hgi-book-open-01', colour: '#8b5cf6', template: 'aurora' },
}

export function lookOfType(type: string): TypeLook {
  return LOOKS[type as EventType] ?? DEFAULT_LOOK
}

/** The strip's leading chip, which clears the category filter rather than sets it. */
export const ALL_CATEGORIES = 'All events'

export const ALL_LOOK: TypeLook = { icon: 'hgi-sparkles', colour: '#1ba770', template: 'aurora' }

/** The icon and colour for a chip on the category strip. */
export function lookOfCategory(category: string): TypeLook {
  return category === ALL_CATEGORIES ? ALL_LOOK : lookOfType(category)
}

/** How each urgency badge reads. */
export const BADGE_LABEL: Record<'waitlist' | 'selling_fast', string> = {
  waitlist: 'Waitlist',
  selling_fast: 'Selling fast',
}
