import { api, meProfileApi } from '@/lib/api'
import { putToSignedUrl, type IssuedUpload } from '@/lib/signedUpload'
import type { PhotoWire } from './profile.types'

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
  // The three `/me/profile` calls are shared with the organizer console's
  // account screens, so they live in `@/lib/api` and this facade just names
  // them for the tab. The photo calls below really are the portal's.
  profile: meProfileApi.profile,
  saveProfile: meProfileApi.saveProfile,
  changeEmail: meProfileApi.changeEmail,

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
