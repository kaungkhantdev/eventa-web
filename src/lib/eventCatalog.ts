/* Shared event catalog — the full list of events used to seed the searchable
   event pickers. Ported verbatim from the static kit's shell.js EVENT_CATALOG
   (`data-event-picker="catalog"`). Cross-feature, so it lives in lib/. */

export type EventStatus = 'Live' | 'Upcoming' | 'Completed' | 'Draft'

export type CatalogEvent = {
  name: string
  date: string
  status: EventStatus
}

export const EVENT_CATALOG: CatalogEvent[] = [
  { name: 'Tech Summit 2026', date: 'Jul 18, 2026', status: 'Live' },
  { name: 'Bangkok Jazz Night', date: 'Jul 12, 2026', status: 'Live' },
  { name: 'Thai Street Food Festival', date: 'Aug 3, 2026', status: 'Upcoming' },
  { name: 'UX Bangkok Meetup', date: 'Aug 20, 2026', status: 'Upcoming' },
  { name: 'Sunrise Yoga Retreat', date: 'Sep 11, 2026', status: 'Upcoming' },
  { name: 'DevOps World Bangkok', date: 'Sep 3, 2026', status: 'Upcoming' },
  { name: 'Founders Coffee Connect', date: 'Sep 5, 2026', status: 'Upcoming' },
  { name: 'AI Prototyping Bootcamp', date: 'Sep 9, 2026', status: 'Upcoming' },
  { name: 'Green Future Art Expo', date: 'Sep 14, 2026', status: 'Upcoming' },
  { name: 'Marathon for Mangroves', date: 'Sep 18, 2026', status: 'Upcoming' },
  { name: 'Indie Sound Night', date: 'Sep 21, 2026', status: 'Live' },
  { name: 'Product Strategy Masterclass', date: 'Sep 24, 2026', status: 'Upcoming' },
  { name: 'Startup Pitch Arena', date: 'Sep 27, 2026', status: 'Upcoming' },
  { name: 'Cloud Security Summit', date: 'Oct 1, 2026', status: 'Upcoming' },
  { name: 'Watercolor Weekend', date: 'Oct 4, 2026', status: 'Upcoming' },
  { name: 'Hearts United Benefit Ball', date: 'Oct 8, 2026', status: 'Upcoming' },
  { name: 'Sunset Trail Run', date: 'Oct 11, 2026', status: 'Upcoming' },
  { name: 'Bangkok Design Biennale', date: 'Oct 15, 2026', status: 'Live' },
  { name: 'Jazz on the Rooftop', date: 'Oct 18, 2026', status: 'Upcoming' },
  { name: 'Data Science Forum', date: 'Oct 22, 2026', status: 'Upcoming' },
  { name: 'UX Research Roundtable', date: 'Oct 25, 2026', status: 'Upcoming' },
  { name: 'Women in Tech Mixer', date: 'Oct 29, 2026', status: 'Upcoming' },
  { name: 'Mindful Movement Retreat', date: 'Nov 2, 2026', status: 'Upcoming' },
  { name: 'Rapid Prototyping Lab', date: 'Nov 6, 2026', status: 'Upcoming' },
  { name: 'Charity Gala Under the Stars', date: 'Nov 9, 2026', status: 'Upcoming' },
  { name: 'Neon Nights Festival', date: 'Nov 13, 2026', status: 'Live' },
  { name: 'Enterprise Cloud Expo', date: 'Nov 17, 2026', status: 'Upcoming' },
  { name: 'Leadership in Practice', date: 'Nov 20, 2026', status: 'Upcoming' },
  { name: 'Corporate Leadership Summit', date: 'Dec 20, 2025', status: 'Completed' },
  { name: 'Summer Music Festival', date: 'Jun 15, 2025', status: 'Completed' },
  { name: 'Product Launch Mixer', date: 'May 2, 2025', status: 'Completed' },
  { name: 'Winter Code Conference', date: 'Jan 18, 2025', status: 'Completed' },
  { name: 'Design Systems Workshop', date: 'Feb 12, 2025', status: 'Completed' },
  { name: 'Love & Give Charity Dinner', date: 'Feb 14, 2025', status: 'Completed' },
  { name: 'Spring Wellness Retreat', date: 'Mar 8, 2025', status: 'Completed' },
  { name: 'Contemporary Art Showcase', date: 'Mar 22, 2025', status: 'Completed' },
  { name: 'Frontend Masters Seminar', date: 'Apr 5, 2025', status: 'Completed' },
  { name: 'Startup Growth Summit', date: 'Apr 19, 2025', status: 'Completed' },
  { name: 'Investor Networking Night', date: 'May 16, 2025', status: 'Completed' },
  { name: 'Summer Beats Block Party', date: 'Jul 19, 2025', status: 'Completed' },
]

/** name → catalog entry, for pages that headline the picked event. */
export const CATALOG_BY_NAME: Record<string, CatalogEvent> = Object.fromEntries(
  EVENT_CATALOG.map((e) => [e.name, e]),
)

/** Status → the colour of the little dot shown beside each option. */
export const STATUS_DOT: Record<EventStatus, string> = {
  Live: 'bg-brand',
  Upcoming: 'bg-blue-500',
  Completed: 'bg-gray-400',
  Draft: 'bg-amber-500',
}
