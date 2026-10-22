import { UPLOAD_MAX_MIB, imageRefusal, type ChosenImage, type ImageRefusal } from '@/lib/imageUploads'
import { ACCEPTED_PHOTO_TYPES, NAME_OF } from '@/lib/constants/portal.constants'

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
