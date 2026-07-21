/** Demo data + scheduling constants for the Agenda page — ported verbatim from
 *  admin/agenda.html. Each event owns its own week and session list. */

export type SessionColor = 'green' | 'amber' | 'rose'

export type SessionType = 'Keynote' | 'Talk' | 'Workshop' | 'Panel' | 'Break'

export type AgendaSession = {
  day: number
  s: string
  e: string
  id: string
  type: SessionType
  title: string
  who: string
  c: SessionColor
}

export type AgendaDay = { n: string; d: string; hot?: boolean }

export type AgendaEvent = {
  month: string
  days: AgendaDay[]
  sessions: AgendaSession[]
}

/** Calendar bounds: 09:00–16:00, 64px per hour. */
export const HS = 9
export const HE = 16
export const HH = 64

/** Default track colour by session type (used when a new session is added). */
export const CBY: Record<SessionType, SessionColor> = {
  Keynote: 'green',
  Workshop: 'green',
  Talk: 'amber',
  Panel: 'amber',
  Break: 'rose',
}

export const SESSION_TYPES: SessionType[] = ['Keynote', 'Talk', 'Workshop', 'Panel', 'Break']

export const SESSION_ROOMS = ['Hall A', 'Hall B', 'Foyer', 'Garden Terrace', 'Main Lobby'] as const

export const AGENDA_EVENT_NAMES = [
  'Tech Summit 2026',
  'Bangkok Jazz Night',
  'Sunrise Yoga Retreat',
  'Thai Street Food Festival',
  'UX Bangkok Meetup',
] as const

export const AGENDA_EVENTS: Record<string, AgendaEvent> = {
  'Tech Summit 2026': {
    month: 'July 2026',
    days: [
      { n: 'Mon', d: 'Jul 13' },
      { n: 'Tue', d: 'Jul 14' },
      { n: 'Wed', d: 'Jul 15' },
      { n: 'Thu', d: 'Jul 16' },
      { n: 'Fri', d: 'Jul 17' },
      { n: 'Sat', d: 'Jul 18', hot: true },
      { n: 'Sun', d: 'Jul 19', hot: true },
    ],
    sessions: [
      { day: 4, s: '10:00', e: '12:00', id: '#0011', type: 'Workshop', title: 'Speaker Rehearsals', who: 'PS', c: 'green' },
      { day: 5, s: '09:00', e: '10:30', id: '#0012', type: 'Keynote', title: 'Opening Keynote', who: 'SK', c: 'green' },
      { day: 5, s: '11:00', e: '12:30', id: '#0013', type: 'Talk', title: 'Scaling Ticketing', who: 'JW', c: 'amber' },
      { day: 5, s: '13:30', e: '15:00', id: '#0014', type: 'Panel', title: 'Future of Events', who: 'ML', c: 'amber' },
      { day: 6, s: '09:30', e: '11:00', id: '#0021', type: 'Keynote', title: 'Day 2 Keynote', who: 'AP', c: 'green' },
      { day: 6, s: '11:30', e: '13:00', id: '#0022', type: 'Workshop', title: 'Check-in Flows', who: 'PS', c: 'green' },
      { day: 6, s: '14:00', e: '14:45', id: '#0023', type: 'Break', title: 'Closing & Wrap', who: 'SK', c: 'rose' },
    ],
  },
  'Bangkok Jazz Night': {
    month: 'July 2026',
    days: [
      { n: 'Mon', d: 'Jul 20' },
      { n: 'Tue', d: 'Jul 21' },
      { n: 'Wed', d: 'Jul 22' },
      { n: 'Thu', d: 'Jul 23' },
      { n: 'Fri', d: 'Jul 24', hot: true },
      { n: 'Sat', d: 'Jul 25' },
      { n: 'Sun', d: 'Jul 26' },
    ],
    sessions: [
      { day: 3, s: '13:00', e: '15:00', id: '#0031', type: 'Workshop', title: 'Stage & Lighting Setup', who: 'TB', c: 'green' },
      { day: 4, s: '10:00', e: '12:00', id: '#0032', type: 'Talk', title: 'Sound Check', who: 'ML', c: 'amber' },
      { day: 4, s: '13:00', e: '14:00', id: '#0033', type: 'Break', title: 'Artist Briefing', who: 'RP', c: 'rose' },
      { day: 4, s: '14:30', e: '16:00', id: '#0034', type: 'Keynote', title: 'Doors & Opening Act', who: 'PS', c: 'green' },
    ],
  },
  'Sunrise Yoga Retreat': {
    month: 'August 2026',
    days: [
      { n: 'Mon', d: 'Aug 3' },
      { n: 'Tue', d: 'Aug 4' },
      { n: 'Wed', d: 'Aug 5' },
      { n: 'Thu', d: 'Aug 6' },
      { n: 'Fri', d: 'Aug 7' },
      { n: 'Sat', d: 'Aug 8', hot: true },
      { n: 'Sun', d: 'Aug 9', hot: true },
    ],
    sessions: [
      { day: 5, s: '09:00', e: '10:00', id: '#0041', type: 'Keynote', title: 'Morning Flow', who: 'AP', c: 'green' },
      { day: 5, s: '10:30', e: '11:30', id: '#0042', type: 'Workshop', title: 'Breathwork Basics', who: 'ML', c: 'green' },
      { day: 6, s: '09:00', e: '10:00', id: '#0043', type: 'Keynote', title: 'Sunrise Meditation', who: 'PS', c: 'green' },
      { day: 6, s: '11:00', e: '12:00', id: '#0044', type: 'Break', title: 'Closing Circle', who: 'SK', c: 'rose' },
    ],
  },
  'Thai Street Food Festival': {
    month: 'June 2026',
    days: [
      { n: 'Mon', d: 'Jun 15' },
      { n: 'Tue', d: 'Jun 16' },
      { n: 'Wed', d: 'Jun 17' },
      { n: 'Thu', d: 'Jun 18' },
      { n: 'Fri', d: 'Jun 19' },
      { n: 'Sat', d: 'Jun 20', hot: true },
      { n: 'Sun', d: 'Jun 21', hot: true },
    ],
    sessions: [
      { day: 4, s: '13:00', e: '15:00', id: '#0051', type: 'Workshop', title: 'Vendor Setup', who: 'JW', c: 'green' },
      { day: 5, s: '10:00', e: '11:00', id: '#0052', type: 'Keynote', title: 'Festival Opening', who: 'AP', c: 'green' },
      { day: 5, s: '12:00', e: '13:30', id: '#0053', type: 'Talk', title: 'Live Cooking Demo', who: 'ML', c: 'amber' },
      { day: 6, s: '11:00', e: '12:30', id: '#0054', type: 'Panel', title: 'Chef Meet & Greet', who: 'PS', c: 'amber' },
    ],
  },
  'UX Bangkok Meetup': {
    month: 'May 2026',
    days: [
      { n: 'Mon', d: 'May 11' },
      { n: 'Tue', d: 'May 12' },
      { n: 'Wed', d: 'May 13' },
      { n: 'Thu', d: 'May 14', hot: true },
      { n: 'Fri', d: 'May 15' },
      { n: 'Sat', d: 'May 16' },
      { n: 'Sun', d: 'May 17' },
    ],
    sessions: [
      { day: 3, s: '10:00', e: '11:00', id: '#0061', type: 'Talk', title: 'Design Systems 101', who: 'PS', c: 'amber' },
      { day: 3, s: '11:30', e: '12:30', id: '#0062', type: 'Panel', title: 'Careers in UX', who: 'ML', c: 'amber' },
      { day: 3, s: '13:30', e: '14:30', id: '#0063', type: 'Break', title: 'Networking Lunch', who: 'JW', c: 'rose' },
    ],
  },
}
