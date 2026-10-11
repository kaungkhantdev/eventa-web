/**
 * What eventa-api will accept when an image is uploaded: how large, and of
 * what type.
 *
 * It lives in `@/lib` for the reason `wireEnums.ts` does — three features ask
 * the same question of the same server endpoint, and three hand-kept copies of
 * the answer is not three safeguards, it is three chances to be wrong. The
 * limit had been written out separately in the portal profile card, the event
 * cover field and the settings logo card; the logo card had quietly stopped
 * at the type list and never checked the size at all, so a 50 MB file was sent
 * and refused by storage instead of by the picker.
 *
 * One server-side rule, so one mirror:
 *
 * - `ImageUploadService` (eventa-api `src/modules/uploads/`) is the only thing
 *   that issues an upload URL, for a profile photo, a workspace logo and an
 *   event cover alike. It reads `UPLOAD_MAX_BYTES` once and checks the same
 *   `ALLOWED_IMAGE_TYPES` map for every one of them. There is no per-feature
 *   server limit to model, and inventing one here would be fiction.
 *
 * This is a COURTESY check, never the guard. The API re-checks the declared
 * type, signs the exact byte length into the URL, and reads the file's leading
 * bytes before promoting it — a file that slips past this module is still
 * refused there. What this buys is somebody learning before sending 50 MB
 * rather than after.
 *
 * It answers only; nothing here uploads, clears or replaces anything. That is
 * what lets a caller refuse a file while leaving the image already on screen
 * exactly where it was.
 *
 * The WORDING of a refusal is deliberately not here. Each surface says it in
 * its own voice — the cover dropzone suggests exporting at 1600×900, the
 * profile card names JPG or PNG — and a shared message would have to lose all
 * of that. Callers map `ImageRefusal` to their own copy.
 */

const BYTES_PER_MIB = 1024 * 1024

/**
 * Mirror of eventa-api's `UPLOAD_MAX_BYTES`, whose default is `5_242_880` —
 * five mebibytes, which every card in eventa-ui-kit calls "5MB".
 *
 * A mirror rather than a fetch: asking the server what it allows, in order to
 * decide whether to ask the server, is a round trip for nothing.
 */
export const UPLOAD_MAX_BYTES = 5 * BYTES_PER_MIB

/**
 * The same limit as the whole number a person reads, so a feature can name it
 * in its own sentence and raising the limit cannot leave a stale "5MB" behind.
 */
export const UPLOAD_MAX_MIB = UPLOAD_MAX_BYTES / BYTES_PER_MIB

/**
 * Every type the API will issue an upload URL for — its `ALLOWED_IMAGE_TYPES`
 * keys, in the same order.
 *
 * SVG is absent upstream and so absent here: the server verifies magic bytes
 * and an SVG is a script-bearing document, not a raster image. The settings
 * card in the kit offers SVG; the port does not, because the upload would be
 * refused.
 */
export const UPLOADABLE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type UploadableImageType = (typeof UPLOADABLE_IMAGE_TYPES)[number]

/**
 * The narrower set two surfaces offer, and a genuine difference rather than a
 * stale copy: the portal profile card prints "JPG or PNG · Max 5MB" and the
 * cover dropzone "PNG or JPG · up to 5MB", both verbatim from eventa-ui-kit.
 * Offering WebP there would contradict the sentence under the button; the
 * settings logo card names WebP and so offers the full list above.
 *
 * Narrowing is always safe — it is a subset of what the server takes — and the
 * spec asserts that it stays one.
 */
export const JPG_PNG_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const

export type JpgPngImageType = (typeof JPG_PNG_IMAGE_TYPES)[number]

/** Just enough of a `File` to judge one — a real `File` satisfies this. */
export interface ChosenImage {
  type: string
  size: number
}

/**
 * Why a file cannot be uploaded, as a reason rather than a sentence, so each
 * feature keeps its own wording. Callers map it with an exhaustive `Record`:
 * a fourth reason then fails to compile rather than rendering blank.
 */
export type ImageRefusal = 'wrong-type' | 'empty' | 'too-large'

/**
 * `accepted` is passed in rather than read from a module constant: the point of
 * having two named lists is that a caller states which one it offers.
 *
 * An array checked with `includes`, never an object probed with `in` —
 * `'constructor' in {}` is true, so an object allow-list accepts every
 * `Object.prototype` key.
 */
export function isAcceptedImageType(type: string, accepted: readonly string[]): boolean {
  return accepted.includes(type)
}

/**
 * `<=`, not `<`: the API refuses `byteSize > maxBytes`, so a file of exactly
 * the limit is one it would have taken. Refusing it here would be stricter
 * than the rule this previews.
 */
export function isWithinUploadLimit(size: number): boolean {
  return size > 0 && size <= UPLOAD_MAX_BYTES
}

/** For a file input's `accept`, so the picker offers only what we will take. */
export function acceptAttribute(accepted: readonly string[]): string {
  return accepted.join(',')
}

/** The reason this file cannot be uploaded, or `null` when it can. */
export function imageRefusal(
  chosen: ChosenImage,
  accepted: readonly string[],
): ImageRefusal | null {
  // Type first: "that is not a JPG" is more use than "that is too big" to
  // somebody who picked the wrong file altogether.
  if (!isAcceptedImageType(chosen.type, accepted)) return 'wrong-type'
  // Before the size check, so "too large" can never mean "no bytes at all".
  if (chosen.size <= 0) return 'empty'
  if (!isWithinUploadLimit(chosen.size)) return 'too-large'
  return null
}
