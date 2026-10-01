/** The meetings panel's own wording. */

/**
 * What the panel's primary button says.
 *
 * Scheduling is not saving: it emails a calendar invite and a Meet link to
 * every guest, which is a thing that happens in the world rather than a record
 * being written. The kit names it accordingly, and rescheduling — which does
 * not re-invite anybody — keeps the plain save wording.
 */
export function meetingSaveLabel(isEditing: boolean, saving: boolean): string {
  if (saving) return 'Saving…'
  return isEditing ? 'Save changes' : 'Schedule meeting'
}
