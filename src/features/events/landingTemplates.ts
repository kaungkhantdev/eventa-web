/**
 * The public landing-page templates on offer (US-EVT-07).
 *
 * A fixed product catalogue, not tenant data: `id` is the API's `template_id`
 * enum, and eventa-api seeds the same four rows into its `landing_templates`
 * lookup. Nothing serves them over HTTP yet, so they are typed here — the ids
 * are the part that must never drift, since they are what `PATCH /events/:id/page`
 * stores. See the task to expose the catalogue so both sides read one source.
 */

import type { EventStatus } from './types'

export type TemplateId = 'aurora' | 'noir' | 'minimal' | 'atlas'

const TEMPLATE_IDS: readonly string[] = ['aurora', 'noir', 'minimal', 'atlas']

/**
 * Whether a value off the wire names one of the four designs.
 *
 * The API types `template` as a plain string. Narrowing here rather than
 * casting means an id this app does not know renders a real design instead of
 * an empty page.
 */
export function isTemplateId(value: string): value is TemplateId {
  return TEMPLATE_IDS.includes(value)
}

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
  /** The design it uses today — null until one has ever been chosen. */
  landingTemplateId: string | null
  /** Row detail for the "Preview with" picker. */
  date: string
  status: EventStatus
}
