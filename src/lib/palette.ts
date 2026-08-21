/**
 * Picking a stable colour for a thing that has no colour of its own.
 *
 * The kit hand-tinted every demo row. Real data has whatever the workspace
 * holds, so the tint is derived from the row's own key instead — stable, so the
 * same event is the same colour on every visit, and spread, so a list of six is
 * not one flat block.
 */

/** A slot in a palette of `length`, decided by `key` alone. */
export function hashIndex(key: string, length: number): number {
  let total = 0
  for (let i = 0; i < key.length; i += 1) total += key.charCodeAt(i)
  return total % length
}
