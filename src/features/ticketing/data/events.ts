/** Event names shared by the ticketing pages' pickers and forms. */
export const EVENT_NAMES = [
  'Tech Summit 2026',
  'Bangkok Jazz Night',
  'Sunrise Yoga Retreat',
  'Thai Street Food Festival',
  'UX Bangkok Meetup',
] as const

export type EventName = (typeof EVENT_NAMES)[number]

/** Options for the top-of-page event filter picker ("All events" + each event). */
export const EVENT_PICKER_OPTIONS = ['All events', ...EVENT_NAMES] as const
