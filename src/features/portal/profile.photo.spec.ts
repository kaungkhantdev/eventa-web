import { describe, expect, it } from 'vitest'
import { UPLOAD_MAX_BYTES } from '@/lib/imageUploads'
import {
  ACCEPTED_PHOTO_TYPES,
  PHOTO_ACCEPT_ATTRIBUTE,
  checkProfilePhoto,
} from './profile.photo'

/**
 * Criterion 4: a photo over 5 MB, or one that is not a JPG or PNG, is refused
 * with guidance — and the photo already on the profile is left alone.
 *
 * This is the courtesy check in front of the API's own. It exists so somebody
 * learns before the upload rather than after it. That the limit and the
 * allow-list agree with eventa-api is asserted once, in
 * `src/lib/imageUploads.spec.ts`; what is asserted here is this card's own
 * behaviour and its own wording.
 */

const photo = (size: number, type = 'image/jpeg') => ({ type, size })

const MB = 1024 * 1024

describe('the limit this card previews', () => {
  it('is the shared one rather than a copy of it', () => {
    // Nothing here re-states the number. If `@/lib/imageUploads` is raised to
    // match a new `UPLOAD_MAX_BYTES`, this card moves with it.
    expect(checkProfilePhoto(photo(UPLOAD_MAX_BYTES)).accepted).toBe(true)
    expect(checkProfilePhoto(photo(UPLOAD_MAX_BYTES + 1)).accepted).toBe(false)
  })

  it('offers only types the API will issue an upload URL for', () => {
    // A subset of the API's allow-list on purpose — the card says "JPG or PNG",
    // so WebP is not offered here even though the server would take it.
    expect([...ACCEPTED_PHOTO_TYPES]).toEqual(['image/jpeg', 'image/png'])
    expect(PHOTO_ACCEPT_ATTRIBUTE).toBe('image/jpeg,image/png')
  })
})

describe('a photo the attendee may upload', () => {
  it('accepts a JPG under the limit', () => {
    expect(checkProfilePhoto(photo(2 * MB))).toEqual({ accepted: true })
  })

  it('accepts a PNG at exactly the limit', () => {
    // The API refuses `byteSize > maxBytes`, so the limit itself is allowed —
    // an off-by-one here would refuse a file the server would have taken.
    expect(checkProfilePhoto(photo(UPLOAD_MAX_BYTES, 'image/png'))).toEqual({ accepted: true })
  })
})

describe('a photo that is refused', () => {
  it('refuses one byte over the limit, and says what the limit is', () => {
    const result = checkProfilePhoto(photo(UPLOAD_MAX_BYTES + 1))
    expect(result.accepted).toBe(false)
    expect(result.accepted === false && result.reason).toContain('5 MB')
  })

  it('refuses a type the API would not take, and names what to choose', () => {
    const result = checkProfilePhoto(photo(MB, 'image/gif'))
    expect(result.accepted).toBe(false)
    expect(result.accepted === false && result.reason).toContain('JPG or PNG')
  })

  it('refuses a file the browser could not type', () => {
    // Some browsers hand back an empty `type` for a file they do not recognise.
    expect(checkProfilePhoto(photo(MB, '')).accepted).toBe(false)
  })

  it('refuses an empty file', () => {
    // The API signs the exact byte length and requires at least one byte.
    expect(checkProfilePhoto(photo(0)).accepted).toBe(false)
  })

  it('always carries guidance, never a bare refusal', () => {
    const refusals = [photo(UPLOAD_MAX_BYTES + 1), photo(MB, 'image/gif'), photo(0)]
    for (const chosen of refusals) {
      const result = checkProfilePhoto(chosen)
      expect(result.accepted).toBe(false)
      expect(result.accepted === false && result.reason.length).toBeGreaterThan(0)
    }
  })

  it('reports the problem rather than describing an upload', () => {
    // The avatar on the profile is untouched by a refusal: this function only
    // answers, so a caller that gets `accepted: false` has nothing to send.
    const result = checkProfilePhoto(photo(9 * MB))
    expect(result).not.toHaveProperty('accepted', true)
    expect(Object.keys(result).sort()).toEqual(['accepted', 'reason'])
  })
})
