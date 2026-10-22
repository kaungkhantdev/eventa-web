import { JPG_PNG_IMAGE_TYPES, imageRefusal, type ChosenImage } from '@/lib/imageUploads'
import { putToSignedUrl } from '@/lib/signedUpload'
import { eventsApi } from './events.api'
import { REASON } from '@/lib/constants/events.constants'

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
