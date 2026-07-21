/* Shared Reports event data — the React port of assets/reports-data.js.
   Consumed by the Reports Overview "Top events" card (top 6) and the full
   searchable/paginated Reports · Events list. Pre-sorted by registrations
   (desc). Mock data. */

export type ReportEventStatus = 'Upcoming' | 'Completed' | 'Live'

export type ReportEvent = {
  name: string
  meta: string
  regs: number
  rev: number
  att: number
  status: ReportEventStatus
}

export const REPORTS_EVENTS: ReportEvent[] = [
  { name: 'Marathon Bangkok', meta: 'Jun 8 · Sanam Luang', regs: 1240, rev: 620000, att: 83, status: 'Completed' },
  { name: 'Tech Summit 2026', meta: 'Jul 18 · BITEC', regs: 412, rev: 824000, att: 92, status: 'Upcoming' },
  { name: 'Digital Marketing Summit', meta: 'Aug 2 · QSNCC', regs: 356, rev: 534000, att: 84, status: 'Upcoming' },
  { name: 'Muay Thai Showcase', meta: 'Jun 18 · Rajadamnern', regs: 340, rev: 238000, att: 80, status: 'Completed' },
  { name: 'Craft Beer Festival', meta: 'Jun 28 · Asiatique', regs: 312, rev: 156000, att: 79, status: 'Completed' },
  { name: 'AI & Robotics Expo', meta: 'Aug 15 · BITEC', regs: 289, rev: 462400, att: 87, status: 'Upcoming' },
  { name: 'Blockchain Conference', meta: 'Aug 22 · Centara Grand', regs: 274, rev: 548000, att: 0, status: 'Upcoming' },
  { name: 'Bangkok Jazz Night', meta: 'Jul 12 · Sala Daeng', regs: 268, rev: 128640, att: 88, status: 'Upcoming' },
  { name: 'Night Market Pop-up', meta: 'Jul 3 · Chatuchak', regs: 224, rev: 33600, att: 72, status: 'Completed' },
  { name: 'Kids Science Fair', meta: 'Jun 21 · Museum Siam', regs: 208, rev: 41600, att: 77, status: 'Completed' },
  { name: 'Sunrise Yoga Retreat', meta: 'Jul 20 · Lumphini Park', regs: 201, rev: 178890, att: 95, status: 'Upcoming' },
  { name: 'VR Gaming Expo', meta: 'Aug 19 · Siam Paragon', regs: 198, rev: 158400, att: 86, status: 'Upcoming' },
  { name: 'Thai Street Food Festival', meta: 'Jun 14 · IconSiam', regs: 178, rev: 26700, att: 81, status: 'Completed' },
  { name: 'Fintech Founders Mixer', meta: 'Aug 1 · One Bangkok', regs: 165, rev: 99000, att: 90, status: 'Upcoming' },
  { name: 'Charity Gala Dinner', meta: 'Jul 1 · Shangri-La', regs: 158, rev: 790000, att: 97, status: 'Live' },
  { name: 'UX Bangkok Meetup', meta: 'May 22 · TCDC Bangkok', regs: 154, rev: 0, att: 90, status: 'Completed' },
  { name: 'Wine & Dine Gala', meta: 'Jul 5 · Mandarin Oriental', regs: 142, rev: 710000, att: 96, status: 'Live' },
  { name: 'Rooftop Cinema', meta: 'Jul 15 · Sathorn', regs: 132, rev: 66000, att: 85, status: 'Live' },
  { name: 'Startup Pitch Night', meta: 'Jul 9 · True Digital Park', regs: 127, rev: 31750, att: 68, status: 'Live' },
  { name: 'Indie Film Night', meta: 'Jun 30 · House Samyan', regs: 118, rev: 47200, att: 74, status: 'Completed' },
  { name: 'Product Design Workshop', meta: 'Aug 8 · Cloud 11', regs: 96, rev: 76800, att: 91, status: 'Upcoming' },
  { name: 'Coffee Lovers Meetup', meta: 'Jul 26 · Ekkamai', regs: 84, rev: 12600, att: 88, status: 'Upcoming' },
  { name: 'Wellness & Spa Retreat', meta: 'Aug 12 · Hua Hin', regs: 76, rev: 190000, att: 94, status: 'Upcoming' },
  { name: 'Photography Walk', meta: 'Jun 25 · Old Town', regs: 62, rev: 9300, att: 89, status: 'Completed' },
]
