import { describe, expect, it, vi } from 'vitest'
import {
  POPUP_BLOCKED_HINT,
  ROW_TYPE_SWATCHES,
  clampStep,
  finalLabel,
  headerSaveLabel,
  landingPreviewHref,
  openPreviewTab,
  saveIntentOf,
  summaryCapacity,
  swatchClassOf,
  wizardStepsOf,
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
    const href = landingPreviewHref('aurora', live, typed)
    expect(href).toMatch(/^\/landing\/aurora\?/)
    expect(new URLSearchParams(href.split('?')[1]).get('event')).toBe('bangkok-trail-run-2026')
  })

  /**
   * US-PAGE-09 / US-EVT-07: Preview shows what is typed, saved or not. A live
   * event's preview fetched its saved page and nothing else, so an edited
   * title or highlight never appeared until it was saved.
   */
  it('carries what is typed over the live page, saved or not', () => {
    const href = landingPreviewHref('aurora', live, {
      title: 'Bangkok Night Run',
      venue: '',
      online: true,
      highlights: [{ icon: 'hgi-wifi-01', label: 'Free WiFi' }],
    })
    const params = new URLSearchParams(href.split('?')[1])
    expect(params.get('event')).toBe('bangkok-trail-run-2026')
    expect(params.get('title')).toBe('Bangkok Night Run')
    expect(params.get('online')).toBe('1')
    expect(params.get('hl')).toBe('hgi-wifi-01:Free WiFi')
  })

  // Over a saved page, leaving a field out would mean "keep the saved one" —
  // so switching back to in person, or removing every highlight, is said
  // explicitly rather than lost.
  it('states every typed field over a live page, even an empty one', () => {
    const params = new URLSearchParams(landingPreviewHref('aurora', live, typed).split('?')[1])
    expect(params.get('online')).toBe('0')
    expect(params.get('hl')).toBe('')
    expect(params.get('venue')).toBe('Lumpini Park')
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
    const href = landingPreviewHref('aurora', { ...live, slug: 'a&b=c' }, typed)
    expect(href).toContain('event=a%26b%3Dc')
    expect(new URLSearchParams(href.split('?')[1]).get('b')).toBeNull()
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

/**
 * US-PAGE-09: when the browser blocks the new tab, the organizer is told to
 * allow pop-ups. The preview used to open with "noopener", which makes
 * `window.open` return null whether or not anything opened — so a block could
 * not even be noticed.
 */
describe('openPreviewTab', () => {
  it('opens the preview in a new tab and cuts it off from this one', () => {
    const tab = { opener: {} as unknown }
    const open = vi.fn(() => tab as unknown as Window)

    expect(openPreviewTab('/landing/aurora', open)).toBe(true)
    expect(open).toHaveBeenCalledWith('/landing/aurora', '_blank')
    expect(tab.opener).toBeNull()
  })

  it('reports a tab the browser refused to open', () => {
    expect(openPreviewTab('/landing/aurora', () => null)).toBe(false)
  })

  it('has a hint that says what to do about it', () => {
    expect(POPUP_BLOCKED_HINT).toMatch(/allow pop-ups/i)
  })
})

/**
 * Each ticket type's seat colour on the Seating preview (US-EVT-05), by the
 * type's place in the event's list, so two types of one event never share a
 * colour until there are more types than colours.
 */
describe('swatchClassOf', () => {
  it('gives each type its own colour, in list order', () => {
    expect(swatchClassOf(0)).toBe(ROW_TYPE_SWATCHES[0])
    expect(swatchClassOf(1)).toBe(ROW_TYPE_SWATCHES[1])
    expect(swatchClassOf(0)).not.toBe(swatchClassOf(1))
  })

  it('starts the colours again past the last one', () => {
    expect(swatchClassOf(ROW_TYPE_SWATCHES.length)).toBe(ROW_TYPE_SWATCHES[0])
  })

  it('leaves a row with no type its plain, neutral seat', () => {
    expect(swatchClassOf(null)).toBe('')
  })
})

/**
 * US-EVT-02 / US-EVT-05: the wizard's steps. A reserved, in-person event gets
 * its own "Assign seats" step after Tickets — the rows can only be given types
 * once the types exist — and every other event keeps the five steps.
 */
describe('wizardStepsOf', () => {
  const labels = (seatingMode: 'ga' | 'reserved', isOnline: boolean) =>
    wizardStepsOf({ seatingMode, isOnline }).map((step) => step.label)

  it('adds Assign seats after Tickets for an in-person reserved event', () => {
    expect(labels('reserved', false)).toEqual([
      'Basics',
      'Date & location',
      'Seating',
      'Tickets',
      'Assign seats',
      'Review & publish',
    ])
  })

  it('keeps five steps for general admission', () => {
    expect(labels('ga', false)).toEqual([
      'Basics',
      'Date & location',
      'Seating',
      'Tickets',
      'Review & publish',
    ])
  })

  // An online event has no seat rows, whatever the seating switch was left at.
  it('keeps five steps for an online event', () => {
    expect(labels('reserved', true)).not.toContain('Assign seats')
    expect(labels('ga', true)).toHaveLength(5)
  })

  it('names each step by a key the page renders it by', () => {
    expect(wizardStepsOf({ seatingMode: 'reserved', isOnline: false }).map((step) => step.key)).toEqual([
      'basics',
      'when',
      'seating',
      'tickets',
      'seats',
      'review',
    ])
  })

  it('tells the organizer what Assign seats is for', () => {
    const seats = wizardStepsOf({ seatingMode: 'reserved', isOnline: false }).find(
      (step) => step.key === 'seats',
    )
    expect(seats?.tip).toBe(
      'Give each row of the seat map a ticket type — say VIP up front, Normal behind. Each type sells only its own rows.',
    )
  })
})

/**
 * Which write a step's Next (or the header's save) sends. Assign seats saves
 * the seat map, exactly as Seating does: the rows' types travel with the grid.
 */
describe('saveIntentOf', () => {
  it('saves the seat map from Seating and from Assign seats', () => {
    expect(saveIntentOf('seating')).toBe('seating')
    expect(saveIntentOf('seats')).toBe('seating')
  })

  it('saves the ticket types from Tickets', () => {
    expect(saveIntentOf('tickets')).toBe('tickets')
  })

  it('saves the event itself from every other step', () => {
    expect(saveIntentOf('basics')).toBe('save')
    expect(saveIntentOf('when')).toBe('save')
    expect(saveIntentOf('review')).toBe('save')
  })
})

/**
 * The open step, kept on the rail. Switching Reserved to General admission
 * drops Assign seats, and the step that was open must still be one that exists.
 */
describe('clampStep', () => {
  it('keeps a step that is on the rail', () => {
    expect(clampStep(3, 6)).toBe(3)
  })

  it('falls back to the last step when the rail gets shorter', () => {
    expect(clampStep(5, 5)).toBe(4)
  })

  it('never goes before the first step', () => {
    expect(clampStep(-1, 5)).toBe(0)
  })
})
