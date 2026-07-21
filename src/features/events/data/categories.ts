/* Demo data for the Event categories page — ported verbatim from the inline
   <script> in admin/event-categories.html. */

export type CategoryColor =
  | 'pink'
  | 'blue'
  | 'amber'
  | 'brand'
  | 'violet'
  | 'indigo'
  | 'teal'
  | 'red'

/** Colour key → Tailwind background utility. */
export const CATEGORY_COLORS: Record<CategoryColor, string> = {
  pink: 'bg-pink-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  brand: 'bg-brand',
  violet: 'bg-violet-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  red: 'bg-red-500',
}

export const COLOR_KEYS = Object.keys(CATEGORY_COLORS) as CategoryColor[]

/** Icon slugs offered in the create/edit panel's icon picker. */
export const CATEGORY_ICONS = [
  'hgi-new-releases',
  'hgi-favourite',
  'hgi-presentation-bar-chart-01',
  'hgi-charity',
  'hgi-mic-01',
  'hgi-user-multiple',
  'hgi-briefcase-01',
  'hgi-dumbbell-01',
  'hgi-mortarboard-01',
  'hgi-paint-board',
  'hgi-camera-01',
  'hgi-gift',
  'hgi-music-note-01',
  'hgi-champion',
  'hgi-star',
  'hgi-sparkles',
  'hgi-birthday-cake',
  'hgi-ticket-01',
] as const

export type Category = {
  name: string
  desc: string
  icon: string
  color: CategoryColor
  count: number
}

export const CATEGORIES: Category[] = [
  {
    name: 'Birthday',
    desc: 'Birthday parties and personal celebrations.',
    icon: 'hgi-new-releases',
    color: 'pink',
    count: 12,
  },
  {
    name: 'Wedding',
    desc: 'Weddings, engagements and receptions.',
    icon: 'hgi-favourite',
    color: 'blue',
    count: 8,
  },
  {
    name: 'Conference',
    desc: 'Summits, seminars and professional talks.',
    icon: 'hgi-presentation-bar-chart-01',
    color: 'amber',
    count: 24,
  },
  {
    name: 'Charity & Gala',
    desc: 'Fundraisers, galas and non-profit events.',
    icon: 'hgi-charity',
    color: 'brand',
    count: 6,
  },
  {
    name: 'Concert & Festival',
    desc: 'Live music, festivals and stage performances.',
    icon: 'hgi-mic-01',
    color: 'violet',
    count: 15,
  },
  {
    name: 'Networking',
    desc: 'Mixers, meetups and community get-togethers.',
    icon: 'hgi-user-multiple',
    color: 'indigo',
    count: 19,
  },
  {
    name: 'Workshop',
    desc: 'Hands-on classes and training sessions.',
    icon: 'hgi-briefcase-01',
    color: 'teal',
    count: 11,
  },
  {
    name: 'Sports & Wellness',
    desc: 'Fitness, yoga, runs and outdoor activities.',
    icon: 'hgi-dumbbell-01',
    color: 'red',
    count: 9,
  },
]
