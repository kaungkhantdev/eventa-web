/**
 * Seat colours for ticket types on a reserved seat map (US-EVT-05): the
 * create-event wizard's Seating preview and the public event page's seat map
 * (US-PAGE-05) both take a row's colour from this one list, in the order
 * `swatchOf` sets, so a type is the same colour in both.
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

/**
 * A ticket type's place in the colour list: where it falls among the event's
 * types in the order they were created, or null — the neutral seat — for a row
 * with no type or a type that is not the event's.
 *
 * Creation order because both sides hold it: the wizard lists the types that
 * way (its `rowSwatchesOf` colours by that list), and the public page reads
 * the order `GET /public/events/:slug` sends its tickets in. Not price, not
 * rows: a type keeps its colour while the organizer changes either.
 */
export function swatchOf(typeId: string | null, typeIdsByCreation: readonly string[]): number | null {
  const place = typeId === null ? -1 : typeIdsByCreation.indexOf(typeId)
  return place === -1 ? null : place
}
