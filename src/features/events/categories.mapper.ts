import { CATEGORY_COLORS, DEFAULT_CATEGORY_ICON, ICON_PREFIX } from './categories.presentation'
import type { CategoryCard, CategoryWire, Tone } from './types'

/** What a colour the design system has no swatch for falls back to. */
const FALLBACK_COLOR: Tone = 'brand'

function colorOf(color: string): Tone {
  return color in CATEGORY_COLORS ? (color as Tone) : FALLBACK_COLOR
}

/**
 * Hugeicons is addressed by class name, so a slug has to carry its namespace:
 * `hgi-presentation-01` renders, `presentation-01` renders as tofu. The API
 * accepts any non-empty string — including its own bare examples — so the slug
 * is normalised here rather than hoping every writer remembered the prefix.
 */
function iconOf(icon: string): string {
  if (!icon) return DEFAULT_CATEGORY_ICON
  return icon.startsWith(ICON_PREFIX) ? icon : ICON_PREFIX + icon
}

/** One card of the categories grid (US-EVT-08). */
export function toCategoryCard(category: CategoryWire): CategoryCard {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? '',
    icon: iconOf(category.icon),
    color: colorOf(category.color),
    eventCount: category.eventCount,
    version: category.version,
  }
}
