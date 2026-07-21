/* Demo data for the Landing Pages page — ported from admin/landing-pages.html.
   Sample events drive the "Preview with" toggle; templates are the four cards. */

export type SampleEvent = {
  /** Slug passed through as `?event=` to the landing preview. */
  id: string
  label: string
}

export const SAMPLE_EVENTS: SampleEvent[] = [
  { id: 'tech-summit-2026', label: 'Conference' },
  { id: 'emma-liam-wedding', label: 'Wedding' },
  { id: 'bangkok-jazz-night', label: 'Concert' },
]

/** Preview slug — matches the /landing/<id> route the "Preview" button opens. */
export type TemplateId = 'aurora' | 'noir' | 'minimal' | 'atlas'

export type LandingTemplate = {
  id: TemplateId
  title: string
  badge: string
  desc: string
}

export const LANDING_TEMPLATES: LandingTemplate[] = [
  {
    id: 'aurora',
    title: 'Classic',
    badge: 'All-purpose',
    desc: 'A clean, all-purpose event page — hero, highlights, agenda, speakers and tickets in one scroll.',
  },
  {
    id: 'noir',
    title: 'Spotlight',
    badge: 'Ticket-focused',
    desc: 'A split hero with a sticky register card — great when tickets take centre stage.',
  },
  {
    id: 'minimal',
    title: 'Minimal',
    badge: 'Understated',
    desc: 'Centered, calm and content-first — lots of whitespace, green only where it counts.',
  },
  {
    id: 'atlas',
    title: 'Vibrant',
    badge: 'Festivals & music',
    desc: 'A full-bleed poster hero, oversized type and a sticky ticket bar — built for festivals, concerts & launches.',
  },
]
