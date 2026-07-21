/* Portal event catalogue — the subset of assets/landing-data.js the attendee
   portal reads. `discover.html` maps over Object.values(EVENTA_EVENTS) and
   `register.html` picks one via EVENTA_getEvent(). Field values are copied
   verbatim from the source data. */

export type PortalEvent = {
  slug: string
  title: string
  category: string
  dateText: string
  timeText: string
  venue: string
  city: string
  priceFrom: string
  seating: 'reserved' | 'ga'
  seatsLeft: number
  capacity: number
  accent: string
  organizer: string
}

export const PORTAL_EVENTS: PortalEvent[] = [
  {
    slug: 'tech-summit-2026',
    title: 'Tech Summit 2026',
    category: 'Conference',
    dateText: 'Sat–Sun, July 18–19, 2026',
    timeText: '09:00 – 18:00 · GMT+7',
    venue: 'BITEC',
    city: 'Bangkok, Thailand',
    priceFrom: '฿1,250',
    seating: 'reserved',
    seatsLeft: 88,
    capacity: 400,
    accent: '#1ba770',
    organizer: 'Eventa Co.',
  },
  {
    slug: 'emma-liam-wedding',
    title: 'Emma & Liam’s Wedding',
    category: 'Wedding',
    dateText: 'Wednesday, August 20, 2026',
    timeText: '4:00 PM · Ceremony & Reception',
    venue: 'Seaside Cliffs Resort',
    city: 'Malibu, California',
    priceFrom: 'Free',
    seating: 'ga',
    seatsLeft: 40,
    capacity: 180,
    accent: '#b76e79',
    organizer: 'Emma & Liam',
  },
  {
    slug: 'bangkok-jazz-night',
    title: 'Bangkok Jazz Night',
    category: 'Concert',
    dateText: 'Sunday, July 12, 2026',
    timeText: '7:30 PM – 11:00 PM',
    venue: 'Sala Daeng Rooftop',
    city: 'Bangkok, Thailand',
    priceFrom: '฿480',
    seating: 'reserved',
    seatsLeft: 36,
    capacity: 240,
    accent: '#6d5cf5',
    organizer: 'Eventa Live',
  },
  {
    slug: 'sunrise-yoga-retreat',
    title: 'Sunrise Yoga Retreat',
    category: 'Sports & Wellness',
    dateText: 'Saturday, October 3, 2026',
    timeText: '05:45 – 08:00 · GMT+7',
    venue: 'Lumphini Park',
    city: 'Bangkok, Thailand',
    priceFrom: '฿800',
    seating: 'ga',
    seatsLeft: 34,
    capacity: 120,
    accent: '#1ba770',
    organizer: 'Eventa Co.',
  },
  {
    slug: 'thai-street-food-festival',
    title: 'Thai Street Food Festival',
    category: 'Food & Drink',
    dateText: 'Sat–Sun, November 14–15, 2026',
    timeText: '11:00 – 22:00 · GMT+7',
    venue: 'Benjakitti Forest Park',
    city: 'Bangkok, Thailand',
    priceFrom: 'Free',
    seating: 'ga',
    seatsLeft: 2340,
    capacity: 8000,
    accent: '#1ba770',
    organizer: 'Bangkok Street Food Collective',
  },
  {
    slug: 'ux-bangkok-meetup',
    title: 'UX Bangkok Meetup',
    category: 'Meetup',
    dateText: 'Thursday, September 24, 2026',
    timeText: '18:30 – 21:30 · GMT+7',
    venue: 'True Digital Park',
    city: 'Bangkok, Thailand',
    priceFrom: 'Free',
    seating: 'ga',
    seatsLeft: 42,
    capacity: 150,
    accent: '#1ba770',
    organizer: 'Bangkok Design Community',
  },
  {
    slug: 'startup-pitch-night',
    title: 'Startup Pitch Night',
    category: 'Networking',
    dateText: 'Thursday, September 24, 2026',
    timeText: '18:00 – 22:00 · GMT+7',
    venue: 'True Digital Park',
    city: 'Bangkok, Thailand',
    priceFrom: '฿350',
    seating: 'reserved',
    seatsLeft: 42,
    capacity: 200,
    accent: '#1ba770',
    organizer: 'Eventa Co.',
  },
  {
    slug: 'bangkok-art-fair',
    title: 'Bangkok Art Fair',
    category: 'Exhibition',
    dateText: 'Sat–Sun, November 14–15, 2026',
    timeText: '11:00 – 20:00 · GMT+7',
    venue: 'River City Bangkok',
    city: 'Bangkok, Thailand',
    priceFrom: '฿250',
    seating: 'ga',
    seatsLeft: 214,
    capacity: 800,
    accent: '#1ba770',
    organizer: 'Eventa Arts',
  },
  {
    slug: 'marathon-for-mangroves',
    title: 'Marathon for Mangroves',
    category: 'Sports & Wellness',
    dateText: 'Sunday, September 20, 2026',
    timeText: '05:30 – 10:00 · GMT+7',
    venue: 'Benjakitti Forest Park',
    city: 'Bangkok, Thailand',
    priceFrom: '฿600',
    seating: 'ga',
    seatsLeft: 340,
    capacity: 1500,
    accent: '#1ba770',
    organizer: 'Eventa Green Foundation',
  },
]

/** Fields the create-event preview can override through query params
 *  (mirrors OVERRIDABLE in landing-data.js). */
const OVERRIDABLE = [
  'title',
  'category',
  'dateText',
  'timeText',
  'venue',
  'city',
  'priceFrom',
  'accent',
  'organizer',
] as const

/** EVENTA_getEvent(): reads ?event= to pick an event (falling back to the
 *  first), then lets query params override text fields. */
export function getPortalEvent(params: URLSearchParams): PortalEvent {
  const slug = params.get('event')
  const src = PORTAL_EVENTS.find((e) => e.slug === slug) ?? PORTAL_EVENTS[0]!
  const ev: PortalEvent = { ...src }
  OVERRIDABLE.forEach((k) => {
    const v = params.get(k)
    if (v != null && v !== '') (ev as unknown as Record<string, string>)[k] = v
  })
  return ev
}
