/**
 * The one way this app sends bytes to storage.
 *
 * Three features upload an image — a profile photo, a workspace logo, an event
 * cover — and all three went through the same three steps: ask eventa-api for a
 * signed URL, PUT the file straight to storage, then confirm so the object is
 * verified and promoted out of the staging prefix. The middle step was written
 * out three times, in `portal/profile.api.ts`, `events/coverUpload.ts` and
 * inside the `settings/LogoCard` component, each with its own copy of the same
 * explanatory comment — and one of those copies said something untrue (below).
 * One subtle request, stated once.
 *
 * **Why this is a bare `fetch` and not `@/lib/api`** — the one place in this app
 * where that is right. `@/lib/api` prefixes `VITE_API_URL`, unwraps the
 * `{ success, data }` envelope and attaches the bearer token. This request goes
 * to a storage host, has no envelope, and must carry no token of ours: sending
 * our access token to a third party would hand it a credential it has no
 * business holding. The signed URL *is* the authorization, and it is scoped to
 * one object, one method and one short expiry.
 *
 * **Why the headers go verbatim, stated accurately.** Both are under the
 * signature, so neither may be altered or dropped — but for different reasons,
 * and the distinction is the interesting part:
 *
 * - `content-type` is NOT signed by the AWS presigner's default; it puts the
 *   header in `unsignableHeaders` unconditionally, so a URL signed with a
 *   `ContentType` would still accept `text/html`. eventa-api's
 *   `S3ObjectStorageAdapter` passes `signableHeaders: new Set(['content-type'])`
 *   to put it back under the signature, which is what makes the declared type
 *   binding.
 * - `content-length` IS signed by default, as an exact-equality binding rather
 *   than a range, so the upload must be precisely as many bytes as were
 *   declared when the URL was issued.
 *
 * And a correction, because the comment this replaces implied otherwise:
 * `content-length` is a forbidden header name in the Fetch standard, so the
 * browser silently drops the one we set here and computes its own from the
 * body. That is harmless — and only because it is the SAME file whose size was
 * declared, which is exactly the invariant each caller has to preserve. Ask for
 * a URL with one file's size and PUT a different file and storage rejects it,
 * correctly, on a signature the browser filled in on our behalf.
 */

/** Shown when storage refuses the bytes; each caller may say it its own way. */
export const STORAGE_PUT_FAILED =
  'The image could not be sent to storage. Please try again.'

/**
 * A signed upload as eventa-api issues it — the whole response, once.
 *
 * One shape, because one service issues all three: `ImageUploadService` in
 * `src/modules/uploads/`, whose own `IssuedUpload` this mirrors field for
 * field. Each feature had written the same five fields out again
 * (`PhotoUploadWire`, `LogoUploadWire`, `CoverUploadWire`) — three places to
 * update when the response changes and three chances to miss one.
 *
 * **Nothing differs per feature**, and the server is where that is settled:
 * `PhotoUploadDto`, `LogoUploadDto` and `CoverUploadDto` declare these same
 * five fields, all required, because a photo, a logo and a cover differ only in
 * which prefix the object is filed under. So there is no honest optionality to
 * model here, and marking a field `?` would invent a response the API cannot
 * send.
 *
 * It is the RESPONSE rather than the PUT's argument list, which is why it keeps
 * two fields nothing in this app reads yet: the three feature copies all
 * carried them, this shared type was the one that stopped at the three the PUT
 * needs, and a mirror that quietly omits part of a contract is the drift the
 * type exists to prevent.
 */
export interface IssuedUpload {
  /** Sent back to the API to confirm, once storage has the bytes. */
  key: string
  /** Short-lived, scoped to this one object and method. */
  uploadUrl: string
  /** Sent verbatim — see the note above on why, and on what the browser does. */
  headers: Record<string, string>
  /** How long `uploadUrl` lasts — eventa-api's `UPLOAD_URL_TTL_SECONDS`. */
  expiresInSeconds: number
  /**
   * The ceiling the API enforced when it signed this. `@/lib/imageUploads`
   * mirrors the same limit for the picker, so a file is turned down before a
   * URL is asked for rather than after.
   */
  maxBytes: number
}

/**
 * PUT `file` to the URL the API signed.
 *
 * `put` is injected so the contract above is testable without a network or a
 * storage host — in particular the one that matters, that nothing of ours is
 * added to the headers.
 */
export async function putToSignedUrl(
  issued: IssuedUpload,
  file: Blob,
  {
    /**
     * Each surface says a refusal in its own voice — the profile card calls it
     * a photo, the cover dropzone an image — so the wording stays with the
     * caller, exactly as `@/lib/imageUploads` keeps its refusal copy there.
     */
    failureMessage = STORAGE_PUT_FAILED,
    put = fetch,
  }: { failureMessage?: string; put?: typeof fetch } = {},
): Promise<void> {
  const response = await put(issued.uploadUrl, {
    method: 'PUT',
    headers: issued.headers,
    body: file,
  })
  if (!response.ok) throw new Error(failureMessage)
}
