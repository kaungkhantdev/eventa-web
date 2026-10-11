import {
  JPG_PNG_IMAGE_TYPES,
  UPLOAD_MAX_MIB,
  acceptAttribute,
  imageRefusal,
  type ChosenImage,
  type ImageRefusal,
} from '@/lib/imageUploads'
import { putToSignedUrl } from '@/lib/signedUpload'
import { eventsApi } from './events.api'

/**
 * What the API allows is `@/lib/imageUploads`, mirrored once from the limit and
 * allow-list eventa-api enforces on every image upload. It used to be written
 * out again here, which meant raising the limit on the server left three
 * unrelated files to find.
 *
 * The narrower JPG/PNG list is this field's own choice, not a stale copy: the
 * dropzone prints "PNG or JPG · up to 5MB" verbatim from the kit, so offering
 * WebP — which the server would take — would contradict it.
 */

/** For the `accept` attribute, so the file picker filters before anyone chooses. */
export const COVER_ACCEPT = acceptAttribute(JPG_PNG_IMAGE_TYPES)

/**
 * This field's own wording. A total lookup, so a reason added to the shared
 * type must be worded here before this file compiles.
 *
 * The size message suggests an export size because the dropzone recommends
 * one — that advice is why the copy cannot be shared.
 */
const REASON: Readonly<Record<ImageRefusal, string>> = {
  'wrong-type': 'That has to be a PNG or JPG image.',
  empty: 'That file is empty.',
  'too-large': `That image is over ${UPLOAD_MAX_MIB}MB. Try a smaller one, or export it at 1600×900.`,
}

/**
 * Why this file cannot be a cover image, or `null` when it can.
 *
 * Told at once rather than after the upload, so nobody watches a 40MB file
 * crawl to a refusal the browser could see coming.
 */
export function rejectionOf(file: ChosenImage): string | null {
  const refusal = imageRefusal(file, JPG_PNG_IMAGE_TYPES)
  return refusal === null ? null : REASON[refusal]
}

/**
 * Put a cover image in storage and get back the URL to save on the event.
 *
 * Three steps, because the bytes never pass through our API: ask for a
 * capability, PUT the file straight to storage, confirm so the object is
 * verified and promoted out of the staging prefix.
 *
 * The PUT itself is the shared one in `@/lib/signedUpload`, which is also where
 * the reasoning lives: why it is the single bare `fetch` in this app, what the
 * signed headers bind, and why the browser's own `content-length` is safe here.
 * Restating part of that is how one of the three copies of it came to say
 * something untrue, so this points at it instead of paraphrasing it.
 */
export async function uploadCover(file: File): Promise<string> {
  const issued = await eventsApi.coverUploadUrl(file.type, file.size)
  await putToSignedUrl(issued, file)
  const { coverImage } = await eventsApi.confirmCover(issued.key)
  return coverImage
}
