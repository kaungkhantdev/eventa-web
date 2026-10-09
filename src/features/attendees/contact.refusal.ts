import type { ActionResult } from '@/app/loaders'
import { CONTACT_FIELDS, type ContactField } from './directory.types'

/**
 * Where a refused contact save is shown (US-REG-08).
 *
 * Two different kinds of "no" arrive at this panel and they do not belong in
 * the same place:
 *
 * - **A rejected field** (400/422) is a verdict on what is in one box, so it
 *   goes under that box. AC4 asks for inline errors, and nothing is applied.
 * - **Everything else** is about the save rather than an input — the email
 *   collision and its merge prompt (AC3), a row somebody else changed, a
 *   refused permission, a dropped connection. The API writes these for the
 *   person reading them, so they go above the form in full, verbatim.
 *
 * Never both at once. `messageOf` promotes field messages into the top-level
 * sentence, so a rejected name arrives as both and rendering each would print
 * the organizer the same words twice.
 */
export interface ContactRefusal {
  /** The sentence above the form, when the refusal belongs to no single box. */
  banner: string | null
  /** The refusal under each box the API named one for. */
  fields: Partial<Record<ContactField, string>>
}

const NOTHING: ContactRefusal = { banner: null, fields: {} }

export function contactRefusalOf(result: ActionResult | null | undefined): ContactRefusal {
  if (!result || result.ok) return NOTHING

  const fields = shownFields(result.fieldErrors)
  if (Object.keys(fields).length > 0) return { banner: null, fields }

  return { banner: result.error ?? null, fields: {} }
}

/**
 * The refusals this panel has a box for.
 *
 * The API can name a field the form does not show — `version`, or a property
 * name from `forbidNonWhitelisted`. Pinning one of those to an input that does
 * not exist would show the organizer nothing at all, so anything unrecognised
 * is dropped here and the banner carries it instead, where `messageOf` has
 * already written the same words.
 */
function shownFields(
  fieldErrors: Record<string, string> | undefined,
): Partial<Record<ContactField, string>> {
  const shown: Partial<Record<ContactField, string>> = {}
  if (!fieldErrors) return shown

  for (const field of CONTACT_FIELDS) {
    const message = fieldErrors[field]
    if (message) shown[field] = message
  }
  return shown
}
