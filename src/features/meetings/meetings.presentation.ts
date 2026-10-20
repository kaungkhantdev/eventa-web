import type { MeetingDraft, MeetingMode } from './meetings.types'

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

/** The Mode box before the organizer has picked anything (US-MTG-03). */
export const NO_MODE = ''

export type MeetingModeChoice = MeetingMode | typeof NO_MODE

export const MEETING_MODE_PROMPT = "Choose how you'll meet"

/**
 * What each mode is called — on the card's badge, and as the start of the
 * panel's option for it, so the badge always repeats the words that were
 * chosen.
 */
export const MEETING_MODE_LABEL: Readonly<Record<MeetingMode, string>> = {
  Video: 'Video call',
  'In person': 'In person',
  Phone: 'Phone call',
}

/** The panel's option for a mode. Video names the service that makes its link. */
export function meetingModeChoice(mode: MeetingMode): string {
  const label = MEETING_MODE_LABEL[mode]
  return mode === 'Video' ? `${label} (Google Meet)` : label
}

/**
 * Nothing is preselected for a new meeting: a default was scheduling video
 * calls the organizer never chose. An edit opens on the mode it was saved with.
 */
export function initialMeetingMode(
  editing: Pick<MeetingDraft, 'mode'> | null,
): MeetingModeChoice {
  return editing?.mode ?? NO_MODE
}

/** Whether the panel may promise a Meet link — only once Video is the choice. */
export function makesMeetLink(mode: MeetingModeChoice): boolean {
  return mode === 'Video'
}

/**
 * What scheduling emails the guest, said above the Schedule button. Every
 * meeting gets a calendar invite and the reminder; only a video call gets a
 * Meet link (US-MTG-04), so the note names one only once Video is chosen.
 */
export function meetingInviteNote(mode: MeetingModeChoice): string {
  const sent = makesMeetLink(mode)
    ? 'A Google Meet link and Google Calendar invite are'
    : 'A Google Calendar invite is'
  return `${sent} emailed to each guest, with a reminder 15 minutes before.`
}

const NOT_CONNECTED_NOTE =
  "Google Calendar isn't connected, so this meeting will be saved without an invite or Meet link."

/**
 * The note above Schedule, given whether the workspace calendar is connected
 * (US-MTG-08). Without one nothing is emailed at all, and the panel says so
 * before the button rather than leaving the card to say it afterwards.
 */
export function scheduleNote(mode: MeetingModeChoice, calendarConnected: boolean): string {
  return calendarConnected ? meetingInviteNote(mode) : NOT_CONNECTED_NOTE
}

/**
 * Whether the Mode box may promise a Meet link: only for a video call, and
 * only while there is a connected Google Calendar to make one.
 */
export function promisesMeetLink(mode: MeetingModeChoice, calendarConnected: boolean): boolean {
  return calendarConnected && makesMeetLink(mode)
}
