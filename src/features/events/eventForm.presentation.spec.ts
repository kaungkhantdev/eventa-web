import { describe, expect, it } from 'vitest'
import {
  finalLabel,
  headerSaveLabel,
  landingPreviewHref,
  summaryCapacity,
} from './eventForm.presentation'

/**
 * The wizard's summary rail showed `0` for an event whose capacity was never
 * set, which reads as "nobody may come" — the opposite of what an empty field
 * means. `null` is not `0`, the same rule that makes a masked amount render as
 * "—" rather than ฿0.
 */
describe('summaryCapacity', () => {
  it('shows the number, grouped', () => {
    expect(summaryCapacity('1200')).toBe('1,200')
  })

  it('shows a dash when no capacity has been set', () => {
    expect(summaryCapacity('')).toBe('—')
    expect(summaryCapacity('   ')).toBe('—')
  })

  it('shows a dash rather than a figure that cannot be a capacity', () => {
    expect(summaryCapacity('0')).toBe('—')
    expect(summaryCapacity('-40')).toBe('—')
    expect(summaryCapacity('abc')).toBe('—')
  })
})

/**
 * The wizard is one flow for two jobs. It used to offer "Publish event" on the
 * last step whatever the event was, and disable it for anything already
 * published — so an organizer editing a live event was shown a single action
 * they could not take, on a step with nothing else to press.
 */
describe('finalLabel', () => {
  it('publishes a draft', () => {
    expect(finalLabel(true, false)).toBe('Publish event')
    expect(finalLabel(true, true)).toBe('Publishing…')
  })

  it('saves an event that is already live', () => {
    expect(finalLabel(false, false)).toBe('Save changes')
    expect(finalLabel(false, true)).toBe('Saving…')
  })
})

describe('headerSaveLabel', () => {
  it('offers a draft only for an event that does not exist yet', () => {
    expect(headerSaveLabel(false, false)).toBe('Save as draft')
  })

  /**
   * The bug this names: on an existing event the same button saves the open
   * step and changes no status, but "Save as draft" read as an offer to
   * unpublish a live event, so it went unused.
   */
  it('saves changes on an event that already exists', () => {
    expect(headerSaveLabel(true, false)).toBe('Save changes')
    expect(headerSaveLabel(true, false)).not.toContain('draft')
  })

  it('reports the write in progress either way', () => {
    expect(headerSaveLabel(true, true)).toBe('Saving…')
    expect(headerSaveLabel(false, true)).toBe('Saving…')
  })
})

/**
 * Which preview the organizer gets.
 *
 * "Preview" has to mean the real attendee page wherever one exists, because
 * that is the thing being checked. But eventa-api serves `/public/events/:slug`
 * only for a PUBLIC, live, published event — a draft 404s. So the rule mirrors
 * that gate rather than guessing, and falls back to rendering what is typed.
 */
describe('landingPreviewHref', () => {
  const typed = {
    title: 'Bangkok Trail Run',
    venue: 'Lumpini Park',
    online: false,
    highlights: [],
  }
  const live = { slug: 'bangkok-trail-run-2026', status: 'upcoming', visibility: 'public' }

  it('opens the real public page once the event is live', () => {
    expect(landingPreviewHref('aurora', live, typed)).toBe(
      '/landing/aurora?event=bangkok-trail-run-2026',
    )
  })

  it('previews what is typed while the event is still a draft', () => {
    const href = landingPreviewHref('noir', { ...live, status: 'draft' }, typed)
    expect(href).not.toContain('event=')
    expect(href).toContain('/landing/noir?')
    expect(href).toContain('title=Bangkok+Trail+Run')
  })

  it('previews what is typed for an event that has never been saved', () => {
    expect(landingPreviewHref('atlas', null, typed)).toBe(
      '/landing/atlas?title=Bangkok+Trail+Run&venue=Lumpini+Park',
    )
  })

  /* An unlisted or private event is published but NOT served by slug, so
     pointing the preview at it would open the 404 page. */
  it('previews what is typed when the page is not public', () => {
    expect(landingPreviewHref('aurora', { ...live, visibility: 'unlisted' }, typed)).not.toContain(
      'event=',
    )
    expect(landingPreviewHref('aurora', { ...live, visibility: 'private' }, typed)).not.toContain(
      'event=',
    )
  })

  it('never points at a published event with no slug', () => {
    expect(landingPreviewHref('aurora', { ...live, slug: '' }, typed)).not.toContain('event=')
  })

  it('escapes the slug, so it cannot add a second query parameter', () => {
    expect(landingPreviewHref('aurora', { ...live, slug: 'a&b=c' }, typed)).toBe(
      '/landing/aurora?event=a%26b%3Dc',
    )
  })

  it('packs the typed highlights as icon:label pairs', () => {
    const href = landingPreviewHref('aurora', null, {
      ...typed,
      highlights: [
        { icon: 'hgi-wifi-01', label: 'Free WiFi' },
        { icon: 'hgi-gift', label: '' },
      ],
    })
    // Read back the way `toDraftPreview` reads it, so this asserts the actual
    // contract between the two rather than a guess at the encoding.
    expect(new URLSearchParams(href.split('?')[1]).get('hl')).toBe('hgi-wifi-01:Free WiFi')
  })

  it('marks an online event, which has no venue to show', () => {
    const href = landingPreviewHref('aurora', null, { ...typed, online: true, venue: '' })
    expect(href).toContain('online=1')
    expect(href).not.toContain('venue=')
  })

  it('asks for the bare template when nothing has been typed yet', () => {
    expect(
      landingPreviewHref('minimal', null, { title: '', venue: '', online: false, highlights: [] }),
    ).toBe('/landing/minimal')
  })
})
