import { CAMERA_FAILED, CAMERA_REFUSALS, TO_MANUAL, TO_UPLOAD_OR_MANUAL } from '@/lib/constants/checkin-tool.constants'
/**
 * What the door station says when the camera cannot scan (US-REG-12, NFR-UX-04):
 * a plain reason, and a pointer to a fallback the station really has.
 *
 * Two fallbacks exist. Upload QR decodes a photograph with the same
 * `BarcodeDetector` the camera uses, so it is offered only when that detector
 * exists. The manual lookup needs nothing from the device, so it is offered
 * always. There is no code box; the copy used to point at one.
 */

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
