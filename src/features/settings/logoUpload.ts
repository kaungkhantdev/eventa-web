import { putToSignedUrl } from '@/lib/signedUpload'
import { accountApi } from './settings.routes'

/** Said when storage refuses the bytes — the workspace's own wording. */
const STORAGE_PUT_FAILED = 'The upload could not be sent to storage.'

/**
 * Put a workspace logo in storage and get back the URL now on the organization.
 *
 * Three steps, because the bytes never pass through our API: ask for a signed
 * capability, PUT the file straight to storage, confirm so the object is
 * verified and promoted out of the staging prefix. The same shape as
 * `events/coverUpload.ts`, and the PUT itself is the shared one in
 * `@/lib/signedUpload`, which explains why it is the single bare `fetch` in
 * this app and what the signed headers bind.
 *
 * It lives here rather than in `LogoCard` because that is where it WAS, and a
 * component may not call `fetch` — the card now awaits this and keeps only what
 * is genuinely its own: the busy flag, the refusal message, the revalidation
 * and the toast.
 */
export async function uploadLogo(file: File): Promise<string> {
  const issued = await accountApi.logoUploadUrl(file.type, file.size)
  await putToSignedUrl(issued, file, { failureMessage: STORAGE_PUT_FAILED })
  const { logoUrl } = await accountApi.confirmLogo(issued.key)
  return logoUrl
}
