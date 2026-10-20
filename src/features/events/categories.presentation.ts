import type { Tone } from './types'
import { CATEGORY_ICONS } from '@/lib/constants/events.constants'

/** The category picker's palette and icon set — the static kit's own choices. */

/** Colour key → Tailwind background utility. Keys match the API's enum. */
export const CATEGORY_COLORS: Record<Tone, string> = {
  pink: 'bg-pink-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  brand: 'bg-brand',
  violet: 'bg-violet-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  red: 'bg-red-500',
}

export const COLOR_KEYS = Object.keys(CATEGORY_COLORS) as Tone[]

/** What the create panel opens with. */
export const DEFAULT_NEW_CATEGORY = { icon: CATEGORY_ICONS[0], color: 'pink' as Tone }
