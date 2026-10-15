/** What the programme screens say before they remove something for good. */

/** The session-removal confirmation (US-PROG-04). */
export const SESSION_REMOVAL_WARNING =
  'Removing this session won’t notify attendees who bookmarked it, and can’t be undone.'

/**
 * The speaker-removal confirmation (US-PROG-11).
 *
 * Their sessions survive and simply stop listing them, which the directory
 * gives no sign of — so the warning says so before it happens.
 */
export function speakerRemovalWarning(name: string): string {
  return `Removing ${name} takes them off all of their sessions. This can’t be undone.`
}
