import { DEFAULT_PAGE_SIZE } from '@/lib/paging'

/** The checkin-tool module's named constants. */

/** The manual lookup's heading, as the kit words it — named here so the pointer cannot drift from it. */
export const MANUAL_LOOKUP_LABEL = 'Can’t scan? Find attendee manually'

export const TO_MANUAL = `Use “${MANUAL_LOOKUP_LABEL}” below.`
export const TO_UPLOAD_OR_MANUAL = `Upload a photo of the QR code instead, or use “${MANUAL_LOOKUP_LABEL}” below.`

export const NO_CAMERA = 'No camera was found on this device.'
export const CAMERA_BUSY = 'The camera is in use by another app, or could not be started.'

/** `getUserMedia`'s refusals by `name`, worded for the person at the door. */
export const CAMERA_REFUSALS: Readonly<Record<string, string>> = {
  NotAllowedError: 'Camera access was blocked. Allow the camera for this site in the browser settings.',
  SecurityError: 'The browser will not open the camera on this page.',
  NotFoundError: NO_CAMERA,
  OverconstrainedError: NO_CAMERA,
  NotReadableError: CAMERA_BUSY,
  AbortError: CAMERA_BUSY,
}

export const CAMERA_FAILED = 'The camera could not be started.'

/** The kit's page-size choices, verbatim. */
export const PAGE_SIZES = [10, 20, 30, 50] as const
export const DEFAULT_SIZE = 10

export const UNNAMED = 'Unnamed ticket'
export const UNKNOWN = 'Unknown ticket'

/** How many events the chooser offers. */
export const EVENT_OPTIONS = 50

/** How many arrivals the station's live feed shows. */
export const FEED_SIZE = 8

export const STATUSES = ['checked_in', 'expected'] as const

/** A page with nothing on it — the shape `pageWindow` needs to say "0 of 0". */
export const EMPTY_META = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
}

export const QR_FORMAT = 'qr_code'
/** Gentle enough not to heat a phone, quick enough to feel instant at a door. */
export const SCAN_INTERVAL_MS = 250
/** How long the same code is ignored, so one badge is not read ten times. */
export const REPEAT_GUARD_MS = 2500
