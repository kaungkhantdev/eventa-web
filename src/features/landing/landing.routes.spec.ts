import { describe, expect, it } from 'vitest'
import { toDraftPreview } from './draftPreview'
import { livePreviewOf } from './landing.routes'
import type { LandingEvent } from './types'

/**
 * Previewing a live event with unsaved edits (US-PAGE-09).
 *
 * `/landing/<tpl>?event=<slug>` is a public URL, and the live page carries the
 * event's real tickets and Register button. Preview is the organizer's tool —
 * "not attendees or the public" — so only a console session sees the typed
 * fields laid over it. Anyone else following a link that carries them sees the
 * real page, not somebody else's text over a real event.
 */
describe('livePreviewOf', () => {
  const saved: LandingEvent = {
    ...toDraftPreview(new URLSearchParams()),
    slug: 'tech-summit',
    title: 'Tech Summit',
    venue: 'BITEC',
    registerUrl: '/e/tech-summit/register',
  }
  const typed = new URLSearchParams(
    'event=tech-summit&title=Tech Summit 2026&venue=QSNCC&online=0&hl=hgi-wifi:Free WiFi',
  )

  it('shows the organizer what they typed over the live page', () => {
    expect(livePreviewOf(typed, saved, 'admin')).toMatchObject({
      title: 'Tech Summit 2026',
      venue: 'QSNCC',
      highlights: [{ icon: 'hgi-wifi', label: 'Free WiFi' }],
    })
  })

  it('shows anybody else the real page, whatever the link carries', () => {
    expect(livePreviewOf(typed, saved, null)).toEqual(saved)
    expect(livePreviewOf(typed, saved, 'attendee')).toEqual(saved)
  })
})
