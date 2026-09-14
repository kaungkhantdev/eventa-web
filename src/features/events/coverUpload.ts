import { eventsApi } from './events.api'

/**
 * Matches `UPLOAD_MAX_BYTES` (5 MiB) and the API's image allow-list.
 *
 * Duplicated deliberately rather than fetched: this is a courtesy check before
 * a file leaves the browser, and asking the server what it allows in order to
 * decide whether to ask the server is a round trip for nothing. The API remains
 * the authority — it re-checks the type, reads the magic bytes, and signs the
 * exact length into the URL.
 */
export const MAX_COVER_BYTES = 5_242_880
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']
/** For the `accept` attribute, so the file picker filters before anyone chooses. */
export const COVER_ACCEPT = ACCEPTED_TYPES.join(',')

/**
 * Why this file cannot be a cover image, or `null` when it can.
 *
 * Told at once rather than after the upload, so nobody watches a 40MB file
 * crawl to a refusal the browser could see coming.
 */
export function rejectionOf(file: { type: string; size: number }): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'That has to be a PNG or JPG image.'
  }
  if (file.size <= 0) return 'That file is empty.'
  if (file.size > MAX_COVER_BYTES) {
    return 'That image is over 5MB. Try a smaller one, or export it at 1600×900.'
  }
  return null
}

/**
 * Put a cover image in storage and get back the URL to save on the event.
 *
 * Three steps, because the bytes never pass through our API: ask for a
 * capability, PUT the file straight to storage, confirm so the object is
 * verified and promoted out of the staging prefix.
 *
 * The PUT is a bare `fetch` on purpose — the one place in this app that is
 * allowed. It goes to the storage provider, not to eventa-api: there is no
 * envelope to unwrap, no session to carry, and the headers are signed, so
 * putting it through `@/lib/api` would break the signature it depends on.
 */
export async function uploadCover(file: File): Promise<string> {
  const issued = await eventsApi.coverUploadUrl(file.type, file.size)
  const stored = await fetch(issued.uploadUrl, {
    method: 'PUT',
    // Verbatim: they are covered by the signature, so adding or changing one
    // makes storage reject the upload.
    headers: issued.headers,
    body: file,
  })
  if (!stored.ok) {
    throw new Error('The image could not be sent to storage. Please try again.')
  }
  const { coverImage } = await eventsApi.confirmCover(issued.key)
  return coverImage
}
