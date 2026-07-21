/** Shared vocabulary for the events feature (colours, statuses, buckets). */

export type Tone = 'brand' | 'blue' | 'pink' | 'amber' | 'violet' | 'indigo' | 'teal' | 'red'

export type EventType =
  | 'Conference'
  | 'Networking'
  | 'Workshop'
  | 'Charity & Gala'
  | 'Sports & Wellness'
  | 'Concert & Festival'
  | 'Exhibition'
  | 'Seminar'

export type EventStatus = 'Upcoming' | 'Planned' | 'Live' | 'Completed'
export type EventBucket = 'active' | 'completed'
