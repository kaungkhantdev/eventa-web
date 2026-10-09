import {
  JPG_PNG_IMAGE_TYPES,
  UPLOAD_MAX_MIB,
  acceptAttribute,
  imageRefusal,
  type ChosenImage,
  type ImageRefusal,
  type JpgPngImageType,
} from '@/lib/imageUploads'

/**
 * Is this file worth asking the API for an upload URL for? (US-DISC-11,
 * criterion 4.)
 *
 * A pure answer, so it is testable and so a refusal cannot have a side effect:
 * nothing here uploads, clears or replaces anything, which is what keeps the
 * photo already on the profile untouched when a file is turned down.
 *
 * The rule — how large, and of what type — is `@/lib/imageUploads`, mirrored
 * once from what eventa-api enforces. What belongs to this feature is the
 * WORDING: the card promises "JPG or PNG · Max 5MB", so a refusal has to speak
 * in those terms and not in the shared module's.
 */

/**
 * A strict subset of the API's allow-list on purpose. The server also takes
 * WebP, but this card says "JPG or PNG", so offering a third type would make
 * the copy wrong. Nothing here accepts a type the server would refuse.
 */
export const ACCEPTED_PHOTO_TYPES = JPG_PNG_IMAGE_TYPES

/** For the file input's `accept`, so the picker offers what we will take. */
export const PHOTO_ACCEPT_ATTRIBUTE = acceptAttribute(ACCEPTED_PHOTO_TYPES)

/**
 * What this card calls each type on screen — "JPG", where the settings logo
 * card says "JPEG". Per-feature copy, which is why it is not shared.
 *
 * Exhaustive over the allow-list it names, so widening that list upstream
 * fails to compile here rather than leaving a type unnamed in a sentence.
 */
const NAME_OF: Readonly<Record<JpgPngImageType, string>> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
}

/** "JPG or PNG" — the guidance and the allow-list come from one source. */
const ACCEPTED_NAMES = ACCEPTED_PHOTO_TYPES.map((type) => NAME_OF[type]).join(' or ')

/**
 * A total lookup rather than a chain of `if`s: a reason added to the shared
 * type has to be worded here before this file compiles, so no refusal can
 * reach somebody as a blank message.
 */
const REASON: Readonly<Record<ImageRefusal, string>> = {
  'wrong-type': `A profile photo has to be a ${ACCEPTED_NAMES} file.`,
  empty: `That file is empty. Choose a ${ACCEPTED_NAMES} file.`,
  'too-large': `That photo is larger than ${UPLOAD_MAX_MIB} MB. Choose a smaller ${ACCEPTED_NAMES} file.`,
}

export type PhotoCheck = { accepted: true } | { accepted: false; reason: string }

export function checkProfilePhoto(chosen: ChosenImage): PhotoCheck {
  const refusal = imageRefusal(chosen, ACCEPTED_PHOTO_TYPES)
  return refusal === null ? { accepted: true } : { accepted: false, reason: REASON[refusal] }
}
