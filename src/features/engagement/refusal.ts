import type { ActionResult } from '@/app/loaders'

/**
 * The refusal to put at the top of a compose form — only ever one the API
 * pinned to no field.
 *
 * `messageOf` promotes field messages into the top-level sentence, so a 422 on
 * the send time arrives as both, and rendering both prints the organizer the
 * same sentence twice: once above the form, once under the input it is about.
 * The input keeps it; what has no input to belong to — "it has already started
 * sending", a dropped connection — belongs here.
 */
export function unattachedError(refused: ActionResult | null | undefined): string | null {
  if (!refused || refused.ok) return null
  const named = Object.keys(refused.fieldErrors ?? {}).length > 0
  return named ? null : (refused.error ?? null)
}
