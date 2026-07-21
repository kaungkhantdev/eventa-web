/** Demo data for the Speakers page — ported verbatim from admin/speakers.html. */

export type SpeakerTone = 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'pink'

export type Speaker = {
  name: string
  role: string
  email: string
  phone: string
  ini: string
  tone: SpeakerTone
  event: string
  sessions: number
  rating: string
}

export const SPEAKERS: Speaker[] = [
  { name: 'Anong Prasert', role: 'CTO · Nimble Works', email: 'anong.prasert@nimble.co', phone: '(302) 555-0107', ini: 'AP', tone: 'green', event: 'Tech Summit 2026', sessions: 2, rating: '4.9' },
  { name: 'Somchai Tanakorn', role: 'Head of Product · Motive Labs', email: 'somchai.t@motivelabs.io', phone: '(629) 555-0129', ini: 'ST', tone: 'blue', event: 'UX Bangkok Meetup', sessions: 1, rating: '4.7' },
  { name: 'Ploy Suwanaphan', role: 'Founder · Sabai Wellness', email: 'ploy@sabaiwellness.com', phone: '(480) 555-0103', ini: 'PS', tone: 'purple', event: 'Sunrise Yoga Retreat', sessions: 3, rating: '5.0' },
  { name: 'James Whitfield', role: 'Chief Economist · Meridian Capital', email: 'j.whitfield@meridian.com', phone: '(405) 555-0128', ini: 'JW', tone: 'amber', event: 'Tech Summit 2026', sessions: 1, rating: '4.6' },
  { name: 'Mei Lin', role: 'Executive Chef · Baan Suan Kitchen', email: 'mei.lin@baansuan.co', phone: '(252) 555-0126', ini: 'ML', tone: 'red', event: 'Thai Street Food Festival', sessions: 2, rating: '4.8' },
  { name: 'Nattapong Kittisak', role: 'Lead Saxophonist · Krungthep Quartet', email: 'natt.k@krungthepq.com', phone: '(316) 555-0116', ini: 'NK', tone: 'pink', event: 'Bangkok Jazz Night', sessions: 1, rating: '4.9' },
  { name: 'Kanokwan Wattana', role: 'Data Science Lead · Orbit Analytics', email: 'kanokwan.w@orbit.ai', phone: '(704) 555-0127', ini: 'KW', tone: 'green', event: 'Tech Summit 2026', sessions: 2, rating: '4.5' },
  { name: 'David Reyes', role: 'UX Director · Formless Studio', email: 'david.reyes@formless.design', phone: '(319) 555-0115', ini: 'DR', tone: 'blue', event: 'UX Bangkok Meetup', sessions: 1, rating: '4.7' },
  { name: 'Suda Rojanasak', role: 'VP Engineering · Cloudpeak', email: 'suda.r@cloudpeak.io', phone: '(212) 555-0134', ini: 'SR', tone: 'green', event: 'Tech Summit 2026', sessions: 2, rating: '4.8' },
  { name: 'Rachel Harris', role: 'Design Lead · Northstar Labs', email: 'rachel.h@northstar.co', phone: '(415) 555-0142', ini: 'RH', tone: 'purple', event: 'UX Bangkok Meetup', sessions: 1, rating: '4.6' },
  { name: 'Wichai Boonmee', role: 'Pastry Chef · Rim Nam Bistro', email: 'wichai.b@rimnam.co', phone: '(646) 555-0118', ini: 'WB', tone: 'red', event: 'Thai Street Food Festival', sessions: 1, rating: '4.7' },
  { name: 'Grace Okafor', role: 'Head of Growth · Loopline', email: 'grace.o@loopline.com', phone: '(305) 555-0157', ini: 'GO', tone: 'amber', event: 'Tech Summit 2026', sessions: 1, rating: '4.5' },
  { name: 'Preeya Chaiyaphon', role: 'Yoga Instructor · Sabai Wellness', email: 'preeya.c@sabaiwellness.com', phone: '(503) 555-0161', ini: 'PC', tone: 'pink', event: 'Sunrise Yoga Retreat', sessions: 2, rating: '5.0' },
  { name: 'Kevin Chen', role: 'Solutions Architect · Vellum', email: 'kevin.chen@vellum.io', phone: '(713) 555-0173', ini: 'KC', tone: 'blue', event: 'Tech Summit 2026', sessions: 2, rating: '4.9' },
  { name: 'Arthit Srisai', role: 'Trumpeter · Krungthep Quartet', email: 'arthit.s@krungthepq.com', phone: '(408) 555-0188', ini: 'AS', tone: 'pink', event: 'Bangkok Jazz Night', sessions: 1, rating: '4.8' },
  { name: 'Emma Davies', role: 'Research Lead · Foundry AI', email: 'emma.d@foundry.ai', phone: '(917) 555-0192', ini: 'ED', tone: 'green', event: 'Tech Summit 2026', sessions: 1, rating: '4.7' },
  { name: 'Malee Charoen', role: 'Street Food Curator · Talad Rot Fai', email: 'malee.c@taladrotfai.co', phone: '(602) 555-0204', ini: 'MC', tone: 'red', event: 'Thai Street Food Festival', sessions: 2, rating: '4.6' },
  { name: 'Tom Nakamura', role: 'Principal Designer · Formless Studio', email: 'tom.n@formless.design', phone: '(206) 555-0215', ini: 'TN', tone: 'purple', event: 'UX Bangkok Meetup', sessions: 1, rating: '4.9' },
  { name: 'Siriporn Wongsawat', role: 'AI Ethics Advisor · Orbit Analytics', email: 'siriporn.w@orbit.ai', phone: '(347) 555-0226', ini: 'SW', tone: 'green', event: 'Tech Summit 2026', sessions: 1, rating: '4.5' },
  { name: 'Ravi Kumar', role: 'Double Bassist · Krungthep Quartet', email: 'ravi.k@krungthepq.com', phone: '(469) 555-0237', ini: 'RK', tone: 'pink', event: 'Bangkok Jazz Night', sessions: 1, rating: '4.8' },
  { name: 'Lily Park', role: 'Meditation Coach · Sabai Wellness', email: 'lily.park@sabaiwellness.com', phone: '(310) 555-0248', ini: 'LP', tone: 'purple', event: 'Sunrise Yoga Retreat', sessions: 2, rating: '5.0' },
]

/** Options for the Add-speaker panel's event select (no "All events"). */
export const SPEAKER_PANEL_EVENTS = [
  'Tech Summit 2026',
  'Bangkok Jazz Night',
  'Sunrise Yoga Retreat',
  'Thai Street Food Festival',
  'UX Bangkok Meetup',
] as const
