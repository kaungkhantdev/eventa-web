import { describe, expect, it } from 'vitest'
import {
  JPG_PNG_IMAGE_TYPES,
  UPLOADABLE_IMAGE_TYPES,
  UPLOAD_MAX_BYTES,
  UPLOAD_MAX_MIB,
  acceptAttribute,
  imageRefusal,
  isAcceptedImageType,
  isWithinUploadLimit,
} from './imageUploads'

/**
 * The client's preview of what eventa-api enforces on every image upload.
 *
 * The numbers below are asserted against the server's own, verbatim, because
 * the point of this module is that the client agrees with the API rather than
 * with whichever feature copied the constant last.
 */

const MIB = 1024 * 1024
const image = (size: number, type = 'image/jpeg') => ({ type, size })

describe('the limit the client previews', () => {
  it('is the number eventa-api enforces for every upload', () => {
    // eventa-api `src/config/env.validation.ts`:
    // `UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(5_242_880)`
    // — read once by `ImageUploadService` and applied to every scope, so there
    // is exactly one server-side limit to mirror.
    expect(UPLOAD_MAX_BYTES).toBe(5_242_880)
  })

  it('publishes the whole-MiB figure the cards name in their copy', () => {
    // Each feature words its own refusal; all they need from here is the
    // number, so raising the limit cannot leave "5MB" behind in a message.
    expect(UPLOAD_MAX_MIB).toBe(5)
  })
})

describe('isWithinUploadLimit', () => {
  it('accepts a file of exactly the limit', () => {
    // The API refuses `byteSize > maxBytes`, so the limit itself uploads.
    // Refusing it here would be stricter than the rule being previewed.
    expect(isWithinUploadLimit(UPLOAD_MAX_BYTES)).toBe(true)
  })

  it('refuses one byte over', () => {
    expect(isWithinUploadLimit(UPLOAD_MAX_BYTES + 1)).toBe(false)
  })

  it('refuses an empty file', () => {
    // `@Min(1)` on the DTO, and the service signs the exact byte length.
    expect(isWithinUploadLimit(0)).toBe(false)
    expect(isWithinUploadLimit(-1)).toBe(false)
  })
})

describe('the two allow-lists, which genuinely differ', () => {
  it('names every type the API will issue an upload URL for', () => {
    // eventa-api `profile-photo.types.ts` → `ALLOWED_IMAGE_TYPES`, the one map
    // `ImageUploadService` checks for a photo, a logo and a cover alike.
    expect([...UPLOADABLE_IMAGE_TYPES]).toEqual(['image/jpeg', 'image/png', 'image/webp'])
  })

  it('keeps a narrower set for the cards that promise "JPG or PNG"', () => {
    // Not an oversight and not collapsible: the profile card and the cover
    // dropzone both print "JPG or PNG" (eventa-ui-kit), so offering WebP there
    // would make the copy a lie. The logo card prints WebP and offers it.
    expect([...JPG_PNG_IMAGE_TYPES]).toEqual(['image/jpeg', 'image/png'])
  })

  it('never offers a type the server would refuse', () => {
    for (const type of JPG_PNG_IMAGE_TYPES) {
      expect(isAcceptedImageType(type, UPLOADABLE_IMAGE_TYPES)).toBe(true)
    }
  })

  it('judges a type against the list it was given, not a global one', () => {
    expect(isAcceptedImageType('image/webp', UPLOADABLE_IMAGE_TYPES)).toBe(true)
    expect(isAcceptedImageType('image/webp', JPG_PNG_IMAGE_TYPES)).toBe(false)
  })

  it('refuses a type the browser could not identify', () => {
    // Some browsers hand back an empty `type` for a file they do not know.
    expect(isAcceptedImageType('', UPLOADABLE_IMAGE_TYPES)).toBe(false)
  })

  it('refuses an inherited object key that is not an image type', () => {
    // `'constructor' in {}` is true, so an allow-list must never be an object
    // literal probed with `in`.
    expect(isAcceptedImageType('constructor', UPLOADABLE_IMAGE_TYPES)).toBe(false)
    expect(isAcceptedImageType('toString', JPG_PNG_IMAGE_TYPES)).toBe(false)
  })

  it('builds the file input accept attribute from the list it offers', () => {
    expect(acceptAttribute(JPG_PNG_IMAGE_TYPES)).toBe('image/jpeg,image/png')
    expect(acceptAttribute(UPLOADABLE_IMAGE_TYPES)).toBe('image/jpeg,image/png,image/webp')
  })
})

describe('imageRefusal', () => {
  it('says nothing is wrong with a file the API would take', () => {
    expect(imageRefusal(image(2 * MIB), JPG_PNG_IMAGE_TYPES)).toBeNull()
    expect(imageRefusal(image(UPLOAD_MAX_BYTES, 'image/png'), JPG_PNG_IMAGE_TYPES)).toBeNull()
  })

  it('reports the wrong type before the size', () => {
    // "That is not a JPG" is more use than "that is too big" to somebody who
    // picked the wrong file altogether.
    expect(imageRefusal(image(50 * MIB, 'application/pdf'), JPG_PNG_IMAGE_TYPES)).toBe('wrong-type')
  })

  it('tells an empty file apart from an oversized one', () => {
    expect(imageRefusal(image(0), JPG_PNG_IMAGE_TYPES)).toBe('empty')
    expect(imageRefusal(image(UPLOAD_MAX_BYTES + 1), JPG_PNG_IMAGE_TYPES)).toBe('too-large')
  })

  /**
   * The defect this module was extracted for: the settings logo card had no
   * size check at all, so a 50 MB WebP was sent and the person found out from
   * a failed upload. The rule it now asks is this one.
   */
  it('refuses a 50 MB logo the API would reject', () => {
    expect(imageRefusal(image(50 * MIB, 'image/webp'), UPLOADABLE_IMAGE_TYPES)).toBe('too-large')
  })

  it('returns one of the three reasons, so copy can be a total lookup', () => {
    // A feature maps the reason to its own wording with an exhaustive Record;
    // a fourth reason must therefore fail to compile, not render blank.
    const reasons = [
      imageRefusal(image(1, 'image/gif'), JPG_PNG_IMAGE_TYPES),
      imageRefusal(image(0), JPG_PNG_IMAGE_TYPES),
      imageRefusal(image(UPLOAD_MAX_BYTES + 1), JPG_PNG_IMAGE_TYPES),
    ]
    expect(reasons).toEqual(['wrong-type', 'empty', 'too-large'])
  })
})
