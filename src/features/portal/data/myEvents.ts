/* Registered events shown on the portal "My Account" → My Events tab. Copied
   verbatim from the static markup in my-events.html (3 upcoming, 3 past). */

import type { BadgeTone } from '@/components/ui'

export type TicketRef = {
  id: string
  event: string
  date: string
  venue: string
  type: string
}

export type UpcomingEvent = {
  title: string
  /** header background (gradient utilities) */
  headerClass: string
  imgSeed: string
  /** status pill, top-right */
  tag: { text: string; variant: 'light' | 'brand' }
  /** floating square icon badge */
  badgeClass: string
  icon: string
  /** ticket-type chip */
  chip: { tone: BadgeTone; icon: string; label: string }
  date: string
  venue: string
  ticket: TicketRef
}

export type PastEvent = {
  title: string
  imgSeed: string
  badgeClass: string
  icon: string
  date: string
  venue: string
  surveySlug: string
}

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    title: 'Tech Summit 2026',
    headerClass: 'bg-gradient-to-br from-brand to-emerald-500',
    imgSeed: 'tech-summit-2026',
    tag: { text: '6 days left', variant: 'light' },
    badgeClass: 'bg-brand',
    icon: 'hgi-presentation-bar-chart-01',
    chip: { tone: 'purple', icon: 'hgi-star', label: 'VIP' },
    date: 'Sat, Jul 18, 2026 · 09:00',
    venue: 'BITEC, Bangkok',
    ticket: {
      id: 'EVT-TS26-00482-VIP',
      event: 'Tech Summit 2026',
      date: 'Sat, Jul 18, 2026 · 09:00',
      venue: 'BITEC, Bangkok',
      type: 'VIP',
    },
  },
  {
    title: 'Bangkok Jazz Night',
    headerClass: 'bg-gradient-to-br from-violet-400 to-violet-600',
    imgSeed: 'bangkok-jazz-night',
    tag: { text: 'Today', variant: 'brand' },
    badgeClass: 'bg-violet-500',
    icon: 'hgi-mic-01',
    chip: { tone: 'green', icon: 'hgi-ticket-02', label: 'General' },
    date: 'Sun, Jul 12, 2026 · 19:30',
    venue: 'Sala Daeng, Bangkok',
    ticket: {
      id: 'EVT-BJN26-01130-GA',
      event: 'Bangkok Jazz Night',
      date: 'Sun, Jul 12, 2026 · 19:30',
      venue: 'Sala Daeng, Bangkok',
      type: 'General',
    },
  },
  {
    title: 'Sunrise Yoga Retreat',
    headerClass: 'bg-gradient-to-br from-teal-400 to-teal-600',
    imgSeed: 'sunrise-yoga-retreat',
    tag: { text: '8 days left', variant: 'light' },
    badgeClass: 'bg-teal-500',
    icon: 'hgi-calendar-check-in-01',
    chip: { tone: 'green', icon: 'hgi-ticket-02', label: 'General' },
    date: 'Mon, Jul 20, 2026 · 06:00',
    venue: 'Lumphini Park, Bangkok',
    ticket: {
      id: 'EVT-SYR26-00298-GA',
      event: 'Sunrise Yoga Retreat',
      date: 'Mon, Jul 20, 2026 · 06:00',
      venue: 'Lumphini Park, Bangkok',
      type: 'General',
    },
  },
]

export const PAST_EVENTS: PastEvent[] = [
  {
    title: 'UX Bangkok Meetup',
    imgSeed: 'ux-bangkok-meetup',
    badgeClass: 'bg-slate-400 dark:bg-slate-600',
    icon: 'hgi-user-group',
    date: 'Sun, Jun 21, 2026 · 18:00',
    venue: 'TCDC, Bangkok',
    surveySlug: 'ux-bangkok-meetup',
  },
  {
    title: 'Thai Street Food Festival',
    imgSeed: 'thai-street-food-festival',
    badgeClass: 'bg-slate-400 dark:bg-slate-600',
    icon: 'hgi-ticket-02',
    date: 'Sat, May 30, 2026 · 17:00',
    venue: 'Lumphini Park, Bangkok',
    surveySlug: 'thai-street-food-festival',
  },
  {
    title: 'Startup Pitch Night',
    imgSeed: 'startup-pitch-night',
    badgeClass: 'bg-slate-400 dark:bg-slate-600',
    icon: 'hgi-mic-01',
    date: 'Tue, Apr 14, 2026 · 18:30',
    venue: 'True Digital Park, Bangkok',
    surveySlug: 'startup-pitch-night',
  },
]
