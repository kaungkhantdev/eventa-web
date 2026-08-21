import type { Tone } from './types'

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

/** What the create panel opens with. */
export const DEFAULT_NEW_CATEGORY = { icon: CATEGORY_ICONS[0], color: 'pink' as Tone }
