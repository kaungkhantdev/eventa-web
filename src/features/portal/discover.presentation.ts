import type { EventType } from './discover.types'
import { ALL_CATEGORIES } from '@/lib/constants/portal.constants'

/**
 * How each kind of event looks on the What's on grid.
 *
 * One table per decision rather than a chain of `if (/festival|music/)` guesses
 * against free text: the API's `type` is a closed enum, so a ninth kind is a
 * row here and nothing else. The kit keyed the same look off a category string
 * it had written itself.
 */

interface TypeLook {
  icon: string
  colour: string
}

const DEFAULT_LOOK: TypeLook = {
  icon: 'hgi-ticket-star',
  colour: '#00c066',
}

const LOOKS: Record<EventType, TypeLook> = {
  Conference: { icon: 'hgi-presentation-01', colour: '#0ea5e9' },
  Networking: { icon: 'hgi-connect', colour: '#14b8a6' },
  Workshop: { icon: 'hgi-tools', colour: '#6366f1' },
  'Charity & Gala': { icon: 'hgi-favourite', colour: '#f43f5e' },
  'Sports & Wellness': { icon: 'hgi-workout-run', colour: '#f59e0b' },
  'Concert & Festival': { icon: 'hgi-music-note-01', colour: '#7c3aed' },
  Exhibition: { icon: 'hgi-image-01', colour: '#ec4899' },
  Seminar: { icon: 'hgi-book-open-01', colour: '#8b5cf6' },
}

export function lookOfType(type: string): TypeLook {
  return LOOKS[type as EventType] ?? DEFAULT_LOOK
}

export const ALL_LOOK: TypeLook = { icon: 'hgi-sparkles', colour: '#00c066' }

/** The icon and colour for a chip on the category strip. */
export function lookOfCategory(category: string): TypeLook {
  return category === ALL_CATEGORIES ? ALL_LOOK : lookOfType(category)
}

