/* ============================================================
   Feedback data (shared by FeedbackPage + FeedbackDetailPage) — ported from
   assets/feedback-data.js. Feedback is organised per EVENT → each event has
   surveys + responses. Numbers are mock data; totals are kept internally
   consistent: event.responses === sum of surveys' responses === sum of dist[],
   and each dist[] is shaped so its weighted mean rounds to the event's avg.
   The response generator (buildResponses) is ported from feedback-detail.html.
   ============================================================ */

export type FeedbackStatus = 'Live' | 'Closed' | 'Draft'
export type QuestionType = 'Rating' | 'Text' | 'Multiple choice'

export type SurveyQuestion = { q: string; type: QuestionType }

export type Survey = {
  title: string
  responses: number
  avg: number | null
  status: FeedbackStatus
  questions: SurveyQuestion[]
}

export type FeedbackResponse = {
  who: string
  initials: string
  survey: string
  rating: number
  text: string
  date: string
}

export type FeedbackEvent = {
  slug: string
  name: string
  date: string
  status: FeedbackStatus
  responses: number
  avg: number | null
  nps: number | null
  completion: number | null
  dist: number[] // 5★ … 1★
  surveys: Survey[]
  recent: FeedbackResponse[]
}

export const FEEDBACK_EVENTS: FeedbackEvent[] = [
  {
    slug: 'tech-summit-2026',
    name: 'Tech Summit 2026',
    date: 'Jul 16–19, 2026',
    status: 'Live',
    responses: 568,
    avg: 4.6,
    nps: 62,
    completion: 84,
    dist: [400, 120, 35, 10, 3], // weighted mean ≈ avg 4.6
    surveys: [
      {
        title: 'Post-event Experience',
        responses: 412,
        avg: 4.7,
        status: 'Live',
        questions: [
          { q: 'How would you rate the event overall?', type: 'Rating' },
          { q: 'What did you enjoy most?', type: 'Text' },
          { q: 'How did you hear about this event?', type: 'Multiple choice' },
        ],
      },
      {
        title: 'Speaker Feedback',
        responses: 156,
        avg: 4.4,
        status: 'Live',
        questions: [
          { q: 'Rate the overall speaker quality', type: 'Rating' },
          { q: 'Which talk stood out to you?', type: 'Text' },
          { q: 'Was the session length right?', type: 'Multiple choice' },
        ],
      },
    ],
    recent: [
      {
        who: 'Anong P.',
        initials: 'AP',
        survey: 'Post-event Experience',
        rating: 5,
        text: 'The speaker lineup was incredible, worth every baht!',
        date: 'Jul 18, 2026',
      },
      {
        who: 'James W.',
        initials: 'JW',
        survey: 'Post-event Experience',
        rating: 3,
        text: 'Good content overall but the BITEC wifi kept dropping during the workshops.',
        date: 'Jul 18, 2026',
      },
      {
        who: 'Kanya R.',
        initials: 'KR',
        survey: 'Speaker Feedback',
        rating: 5,
        text: 'The AI keynote alone was worth the ticket. More of that please.',
        date: 'Jul 17, 2026',
      },
    ],
  },
  {
    slug: 'bangkok-jazz-night',
    name: 'Bangkok Jazz Night',
    date: 'Jun 28, 2026',
    status: 'Closed',
    responses: 268,
    avg: 4.8,
    nps: 71,
    completion: 88,
    dist: [225, 33, 7, 2, 1], // weighted mean ≈ avg 4.8
    surveys: [
      {
        title: 'Jazz Night Vibes',
        responses: 268,
        avg: 4.8,
        status: 'Closed',
        questions: [
          { q: 'How would you rate the night overall?', type: 'Rating' },
          { q: 'What was your favourite set?', type: 'Text' },
          { q: 'Would you come to the next one?', type: 'Multiple choice' },
        ],
      },
    ],
    recent: [
      {
        who: 'Somchai T.',
        initials: 'ST',
        survey: 'Jazz Night Vibes',
        rating: 4,
        text: 'Great atmosphere, though the queue for drinks got long by the second set.',
        date: 'Jun 29, 2026',
      },
      {
        who: 'Rachel D.',
        initials: 'RD',
        survey: 'Jazz Night Vibes',
        rating: 5,
        text: 'Magical evening — the rooftop venue was the perfect setting.',
        date: 'Jun 29, 2026',
      },
    ],
  },
  {
    slug: 'sunrise-yoga-retreat',
    name: 'Sunrise Yoga Retreat',
    date: 'Jul 20, 2026',
    status: 'Live',
    responses: 195,
    avg: 4.9,
    nps: 78,
    completion: 91,
    dist: [180, 11, 3, 1, 0], // weighted mean ≈ avg 4.9
    surveys: [
      {
        title: 'Retreat Wellness Check',
        responses: 195,
        avg: 4.9,
        status: 'Live',
        questions: [
          { q: 'How would you rate the retreat overall?', type: 'Rating' },
          { q: 'Which session helped you most?', type: 'Text' },
          { q: 'How likely are you to book again?', type: 'Multiple choice' },
        ],
      },
    ],
    recent: [
      {
        who: 'Ploy S.',
        initials: 'PS',
        survey: 'Retreat Wellness Check',
        rating: 5,
        text: "Best retreat I've been to in Bangkok — loved the sunrise session by Lumphini Park.",
        date: 'Jul 20, 2026',
      },
    ],
  },
  {
    slug: 'ux-bangkok-meetup',
    name: 'UX Bangkok Meetup',
    date: 'Jul 9, 2026',
    status: 'Closed',
    responses: 173,
    avg: 4.6,
    nps: 58,
    completion: 80,
    dist: [122, 40, 8, 2, 1], // weighted mean ≈ avg 4.6
    surveys: [
      {
        title: 'Meetup Experience',
        responses: 173,
        avg: 4.6,
        status: 'Closed',
        questions: [
          { q: 'How would you rate the meetup overall?', type: 'Rating' },
          { q: 'What topic should we cover next?', type: 'Text' },
          { q: 'How did you hear about this meetup?', type: 'Multiple choice' },
        ],
      },
    ],
    recent: [
      {
        who: 'Mei L.',
        initials: 'ML',
        survey: 'Meetup Experience',
        rating: 5,
        text: 'Super friendly community — learned a ton from the panel discussion.',
        date: 'Jul 9, 2026',
      },
    ],
  },
  {
    slug: 'thai-street-food-festival',
    name: 'Thai Street Food Festival',
    date: 'Aug 2, 2026',
    status: 'Draft',
    responses: 0,
    avg: null,
    nps: null,
    completion: null,
    dist: [0, 0, 0, 0, 0],
    surveys: [
      {
        title: 'Food Festival Pulse',
        responses: 0,
        avg: null,
        status: 'Draft',
        questions: [
          { q: 'How would you rate the festival overall?', type: 'Rating' },
          { q: 'Which stall was your favourite?', type: 'Text' },
          { q: 'Would you recommend it to a friend?', type: 'Multiple choice' },
        ],
      },
    ],
    recent: [],
  },
]

/** Find an event by slug (falls back handled by the caller). */
export function getEvent(slug: string | null): FeedbackEvent | null {
  return FEEDBACK_EVENTS.find((e) => e.slug === slug) ?? null
}

export type Portfolio = {
  responses: number
  avg: number
  surveys: number
  events: number
  dist: number[]
}

/** Portfolio-wide KPIs across all events (response-weighted average rating). */
export function portfolio(): Portfolio {
  const live = FEEDBACK_EVENTS
  const responses = live.reduce((s, e) => s + e.responses, 0)
  const rated = live.filter((e) => e.avg != null && e.responses)
  const avg = rated.length
    ? rated.reduce((s, e) => s + (e.avg as number) * e.responses, 0) /
      rated.reduce((s, e) => s + e.responses, 0)
    : 0
  const surveys = live.reduce((s, e) => s + e.surveys.length, 0)
  const dist = [0, 0, 0, 0, 0]
  live.forEach((e) => e.dist.forEach((c, i) => (dist[i] += c)))
  return { responses, avg, surveys, events: live.length, dist }
}

/* ---- response generator (ported from feedback-detail.html) ----
   Deterministically fabricates individual responses that add up to the event's
   totals: ratings follow dist[], surveys follow each survey's response count,
   and comment text is picked by rating band. */

const NAMES = [
  'Anong P.', 'Somchai T.', 'Ploy S.', 'James W.', 'Kanya R.', 'Mei L.', 'Arthit W.',
  'Nattapong S.', 'Suda K.', 'David C.', 'Rachel D.', 'Wichai P.', 'Grace H.', 'Lily T.',
  'Ravi M.', 'Preeya N.', 'Tom B.', 'Siriporn A.', 'Kevin O.', 'Malee R.', 'Jun P.',
  'Chai L.', 'Emma S.', 'Nong F.',
]
const POS = [
  'The speaker lineup was incredible, worth every baht!',
  'The AI keynote alone was worth the ticket. More of that please.',
  'Best event I have been to this year.',
  'Loved every minute — will definitely be back.',
  'Smooth check-in and genuinely useful sessions.',
  'Fantastic organisation and energy throughout.',
  'Learned so much, highly recommend to anyone.',
  'Venue and vibe were absolutely perfect.',
]
const MID = [
  'Good overall, though the schedule ran a little late.',
  'Solid content — the catering could be better.',
  'Enjoyable, but the main room got crowded.',
  'Worthwhile day; a few sessions felt rushed.',
  'Nice event, parking was a bit of a hassle.',
  'Great atmosphere, though the drinks queue got long.',
]
const NEG = [
  'Good content but the BITEC wifi kept dropping during the workshops.',
  'Queues between sessions were too long.',
  'Expected a bit more depth from the workshops.',
  'Sound quality needed some work.',
  'Felt a little overpriced for what was offered.',
]
const DATES = [
  'Jul 20, 2026', 'Jul 19, 2026', 'Jul 18, 2026', 'Jul 17, 2026', 'Jul 16, 2026',
  'Jul 15, 2026', 'Jul 13, 2026', 'Jul 11, 2026', 'Jul 9, 2026', 'Jul 6, 2026',
  'Jul 3, 2026', 'Jun 30, 2026',
]

function initialsOf(n: string): string {
  return n
    .replace(/[^A-Za-z ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function commentFor(r: number, i: number): string {
  if (r >= 5) return POS[i % POS.length]
  if (r === 4) {
    const a = POS.concat(MID)
    return a[i % a.length]
  }
  if (r === 3) return MID[i % MID.length]
  const b = NEG.concat(MID)
  return b[i % b.length]
}

function roundRobin<T>(buckets: { v: T; n: number }[]): T[] {
  const total = buckets.reduce((s, b) => s + b.n, 0)
  const left = buckets.map((b) => b.n)
  const out: T[] = []
  while (out.length < total) {
    for (let k = 0; k < buckets.length; k++) {
      if (left[k] > 0) {
        out.push(buckets[k].v)
        left[k]--
      }
    }
  }
  return out
}

/** Build the full response list for an event (empty when it has no responses). */
export function buildResponses(ev: FeedbackEvent): FeedbackResponse[] {
  if (!ev.responses) return []
  const ratings = roundRobin(ev.dist.map((c, i) => ({ v: 5 - i, n: c })))
  const withResp = ev.surveys.filter((s) => s.responses)
  const surveys = roundRobin(withResp.map((s) => ({ v: s.title, n: s.responses })))
  const n = ratings.length
  const out: FeedbackResponse[] = []
  for (let i = 0; i < n; i++) {
    const r = ratings[i]
    const who = NAMES[i % NAMES.length]
    out.push({
      who,
      initials: initialsOf(who),
      survey: surveys[i] ?? withResp[0].title,
      rating: r,
      text: commentFor(r, i),
      date: DATES[Math.min(DATES.length - 1, Math.floor((i * DATES.length) / n))],
    })
  }
  return out
}
