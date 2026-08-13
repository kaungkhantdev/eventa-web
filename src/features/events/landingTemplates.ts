/**
 * The public landing-page templates on offer (US-EVT-07).
 *
 * A fixed product catalogue, not tenant data: `id` is the API's `template_id`
 * enum, and eventa-api seeds the same four rows into its `landing_templates`
 * lookup. Nothing serves them over HTTP yet, so they are typed here — the ids
 * are the part that must never drift, since they are what `PATCH /events/:id/page`
 * stores. See the task to expose the catalogue so both sides read one source.
 */

export type TemplateId = 'aurora' | 'noir' | 'minimal' | 'atlas'

export interface LandingTemplate {
  id: TemplateId
  title: string
  badge: string
  description: string
}

export const LANDING_TEMPLATES: readonly LandingTemplate[] = [
  {
    id: 'aurora',
    title: 'Classic',
    badge: 'All-purpose',
    description:
      'A clean, all-purpose event page — hero, highlights, agenda, speakers and tickets in one scroll.',
  },
  {
    id: 'noir',
    title: 'Spotlight',
    badge: 'Ticket-focused',
    description:
      'A split hero with a sticky register card — great when tickets take centre stage.',
  },
  {
    id: 'minimal',
    title: 'Minimal',
    badge: 'Understated',
    description: 'Centered, calm and content-first — lots of whitespace, green only where it counts.',
  },
  {
    id: 'atlas',
    title: 'Vibrant',
    badge: 'Festivals & music',
    description:
      'A full-bleed poster hero, oversized type and a sticky ticket bar — built for festivals, concerts & launches.',
  },
]

/** One of the workspace's own events, for the "Preview with" switcher. */
export interface PreviewEvent {
  id: string
  name: string
  slug: string
}
