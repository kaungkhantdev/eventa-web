/**
 * What the door station says when the camera cannot scan (US-REG-12, NFR-UX-04):
 * a plain reason, and a pointer to a fallback the station really has.
 *
 * Two fallbacks exist. Upload QR decodes a photograph with the same
 * `BarcodeDetector` the camera uses, so it is offered only when that detector
 * exists. The manual lookup needs nothing from the device, so it is offered
 * always. There is no code box; the copy used to point at one.
 */

/** The manual lookup's heading, as the kit words it — named here so the pointer cannot drift from it. */
export const MANUAL_LOOKUP_LABEL = 'Can’t scan? Find attendee manually'

const TO_MANUAL = `Use “${MANUAL_LOOKUP_LABEL}” below.`
const TO_UPLOAD_OR_MANUAL = `Upload a photo of the QR code instead, or use “${MANUAL_LOOKUP_LABEL}” below.`

/**
 * No `BarcodeDetector`, so neither the camera nor Upload QR can read a code.
 *
 * The detector is only exposed to a secure (https) page, so on plain http the
 * reason is the page rather than the browser.
 */
export function scannerUnavailableMessage(secureContext: boolean): string {
  const reason = secureContext
    ? 'This browser cannot read QR codes.'
    : 'This page is not secure (https), so the browser will not scan QR codes here.'
  return `${reason} ${TO_MANUAL}`
}

const NO_CAMERA = 'No camera was found on this device.'
const CAMERA_BUSY = 'The camera is in use by another app, or could not be started.'

/** `getUserMedia`'s refusals by `name`, worded for the person at the door. */
const CAMERA_REFUSALS: Readonly<Record<string, string>> = {
  NotAllowedError: 'Camera access was blocked. Allow the camera for this site in the browser settings.',
  SecurityError: 'The browser will not open the camera on this page.',
  NotFoundError: NO_CAMERA,
  OverconstrainedError: NO_CAMERA,
  NotReadableError: CAMERA_BUSY,
  AbortError: CAMERA_BUSY,
}

const CAMERA_FAILED = 'The camera could not be started.'

/**
 * `getUserMedia` failed: say why in plain words, then where to go instead.
 *
 * Read by `name` rather than `instanceof`, because OverconstrainedError has
 * not always been an Error subclass. The browser's own message is not shown:
 * it is written for a developer ("Could not start video source").
 */
export function cameraFailureMessage(cause: unknown): string {
  const name = (cause as { name?: unknown } | null | undefined)?.name
  const reason =
    typeof name === 'string' && Object.hasOwn(CAMERA_REFUSALS, name)
      ? CAMERA_REFUSALS[name]
      : CAMERA_FAILED
  return `${reason} ${TO_UPLOAD_OR_MANUAL}`
}
