import { api } from '@/lib/api'
import { putToSignedUrl, type IssuedUpload } from '@/lib/signedUpload'
import type { PhotoWire, ProfileWire, ProfilePatch } from './profile.types'

/**
 * Every call the portal's Profile tab makes, and nothing else (US-DISC-11).
 *
 * All `/me/*`: the record acted on is whoever holds the token, so there is no
 * id to pass and none to get wrong. The organizer console reads the same three
 * profile routes from `settings.routes.ts` — `/me/profile` is the signed-in
 * person's own record whatever persona they are using.
 */

const STORAGE_PUT_FAILED = 'The photo could not be sent to storage.'

export const profileApi = {
  /** The whole record the tab renders. */
  profile: () => api.get<ProfileWire>('/me/profile'),

  /**
   * Save the details form. A partial patch: an omitted key is left as it is
   * and `null` clears a field, so an emptied box means "clear it" rather than
   * "send the empty string".
   */
  saveProfile: (body: ProfilePatch) => api.patch<ProfileWire>('/me/profile', body),

  /**
   * Ask to move the account to a new address. The API emails a confirmation to
   * the NEW address and the old one goes on working until that link is opened,
   * so this returns with the change merely requested, never applied.
   */
  changeEmail: (email: string) => api.post<ProfileWire>('/me/profile/email', { email }),

  /**
   * The photo, in the API's two steps: ask where to PUT, send the bytes
   * straight to storage, then confirm. The file never passes through this app
   * or the API — only the browser and the bucket ever hold it.
   */
  photoUploadUrl: (contentType: string, byteSize: number) =>
    api.post<IssuedUpload>('/me/photo/upload-url', { contentType, byteSize }),

  confirmPhoto: (key: string) => api.post<PhotoWire>('/me/photo', { key }),

  /** No key: the photo actually on the profile is the one removed. */
  removePhoto: () => api.delete<void>('/me/photo'),

  /** Step two: the bytes, through the one signed-PUT in `@/lib/signedUpload`. */
  sendPhotoBytes: (issued: IssuedUpload, file: Blob): Promise<void> =>
    putToSignedUrl(issued, file, { failureMessage: STORAGE_PUT_FAILED }),
}
