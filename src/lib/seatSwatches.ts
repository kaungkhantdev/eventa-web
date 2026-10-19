/**
 * Seat colours for ticket types on a reserved seat map (US-EVT-05): the
 * create-event wizard's Seating preview and the public event page's seat map
 * (US-PAGE-05) both take a row's colour from this one list, so what the
 * organizer previews is what attendees see.
 *
 * The hues of the app's existing per-tier tints (`ICON_TINTS` in the ticketing
 * feature), at their dark-mode strength because the preview panel is always
 * dark. Important (`!`): the preview's seat class is unlayered CSS, which a
 * plain utility cannot override.
 */
export const ROW_TYPE_SWATCHES = [
  '!bg-brand',
  '!bg-amber-300',
  '!bg-blue-300',
  '!bg-purple-300',
  '!bg-red-300',
] as const

/** A type's place in the list → its colour; none keeps the plain, neutral seat. */
export function swatchClassOf(swatch: number | null): string {
  return swatch === null ? '' : ROW_TYPE_SWATCHES[swatch % ROW_TYPE_SWATCHES.length]!
}
