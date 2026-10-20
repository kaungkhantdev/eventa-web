import { describe, expect, it, vi } from 'vitest'
import { NO_SEATS_TO_ASSIGN, STEPS, assignSeatsViewOf, finalLabel, headerSaveLabel, landingPreviewHref, openPreviewTab, saveIntentOf, seatMapDeferredOn, stepProgress, summaryCapacity } from './eventForm.presentation'
import { toEventFormValues, type EventFormValues } from './eventForm.mapper'
import { POPUP_BLOCKED_HINT, SAVING_TICKET_TYPES, SEAT_MAP_DEFERRED_NOTE } from '@/lib/constants/events.constants'

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
 * US-EVT-02 / US-EVT-05: the wizard's steps — the same six for every event.
 * Assign seats follows Tickets, since a seat can only be given a type once the
 * types exist. An event with no seat map keeps the step, and the step says why
 * there is nothing to assign, rather than the rail changing under the organizer.
 */
describe('STEPS — the wizard’s steps', () => {
  it('are the same six for every event, with Assign seats after Tickets', () => {
    expect(STEPS.map((step) => step.label)).toEqual([
      'Basics',
      'Date & location',
      'Seating',
      'Tickets',
      'Assign seats',
      'Review & publish',
    ])
  })

  it('names each step by a key the page renders it by', () => {
    expect(STEPS.map((step) => step.key)).toEqual(['basics', 'when', 'seating', 'tickets', 'seats', 'review'])
  })

  // US-EVT-05: on a reserved event the seat map sets each type's quantity.
  it('tells the organizer a quantity is only asked for when the seat map does not set it', () => {
    const tickets = STEPS.find((step) => step.key === 'tickets')
    expect(tickets?.tip).toBe(
      'Add at least one ticket type with a price — and a quantity, unless your seat map sets it — then set your total capacity.',
    )
  })

  it('tells the organizer what Assign seats is for — whole rows, or just some seats', () => {
    const seats = STEPS.find((step) => step.key === 'seats')
    expect(seats?.tip).toBe(
      'Give each row of the seat map a ticket type — say VIP up front, Normal behind — or pick a type and click or drag across seats to give just those seats it. Each type sells only its own seats.',
    )
  })
})

/** The rail's "% completed": the open step's place among the six, whatever the event. */
describe('stepProgress', () => {
  it('counts the open step as done', () => {
    expect(stepProgress(0)).toBe(17)
    expect(stepProgress(4)).toBe(83)
  })

  it('reaches 100% on the last step', () => {
    expect(stepProgress(STEPS.length - 1)).toBe(100)
  })
})

/**
 * Which write a step's Next (or the header's save) sends. Assign seats saves
 * the seat map, exactly as Seating does: the rows' types travel with the grid.
 */
describe('saveIntentOf', () => {
  // A draft's map may have untyped rows, so nothing holds its seat map back.
  const event = (over: Partial<EventFormValues> = {}): EventFormValues => ({
    ...toEventFormValues(null, [], []),
    status: 'draft',
    seatingMode: 'reserved',
    seatRows: '3',
    seatsPerRow: '2',
    seatTicketTypes: [['tier-vip', 'tier-vip'], [null, null], [null, null]],
    ...over,
  })

  it('saves the seat map from Seating and from Assign seats', () => {
    expect(saveIntentOf('seating', event())).toBe('seating')
    expect(saveIntentOf('seats', event())).toBe('seating')
  })

  it('saves the ticket types from Tickets', () => {
    expect(saveIntentOf('tickets', event())).toBe('tickets')
  })

  it('saves the event itself from every other step', () => {
    expect(saveIntentOf('basics', event())).toBe('save')
    expect(saveIntentOf('when', event())).toBe('save')
    expect(saveIntentOf('review', event())).toBe('save')
  })

  // US-EVT-02: general admission and online events keep Assign seats, with
  // nothing on it to write — its Next saves the event, never a seat map.
  it('saves the event itself from Assign seats when there is no seat map to assign', () => {
    expect(saveIntentOf('seats', event({ seatingMode: 'ga' }))).toBe('save')
    expect(saveIntentOf('seats', event({ isOnline: true }))).toBe('save')
  })

  it('still saves general admission’s headcount from Seating', () => {
    expect(saveIntentOf('seating', event({ seatingMode: 'ga' }))).toBe('seating')
  })

  /*
   * US-EVT-05: a published event whose seats have types, with a row added on
   * Seating. The API refuses a map with those seats untyped, and they can only
   * be given a type on Assign seats — so Seating saves the rest of the event
   * and leaves the grid to Assign seats, which sends it whole.
   */
  describe('on a published, typed map with a row added on Seating', () => {
    const grown = event({
      status: 'upcoming',
      seatRows: '4',
      seatTicketTypes: [['tier-vip', 'tier-vip'], ['tier-ga', 'tier-free'], ['tier-ga', 'tier-ga'], [null, null]],
    })

    it('leaves the seat map to Assign seats when leaving Seating', () => {
      expect(saveIntentOf('seating', grown)).toBe('save')
    })

    it('still saves the seat map from Assign seats', () => {
      expect(saveIntentOf('seats', grown)).toBe('seating')
    })

    it('saves the seat map from Seating once every seat has a type', () => {
      const typed = { ...grown, seatTicketTypes: [...grown.seatTicketTypes.slice(0, 3), ['tier-free', 'tier-ga']] }
      expect(saveIntentOf('seating', typed)).toBe('seating')
    })
  })
})

/**
 * US-EVT-05: when Seating leaves a published, typed map's new seats to Assign
 * seats, the step says so — under its hint, and in the header Save's toast —
 * rather than letting "saved" read as if the seat map had been.
 */
describe('seatMapDeferredOn — whether this step’s save leaves the seat map to Assign seats', () => {
  const grown: EventFormValues = {
    ...toEventFormValues(null, [], []),
    status: 'upcoming',
    seatingMode: 'reserved',
    seatRows: '2',
    seatsPerRow: '3',
    seatTicketTypes: [['tier-vip', 'tier-vip', null], ['tier-ga', 'tier-ga', null]],
  }

  it('is true on Seating for a published, typed map with new, untyped seats', () => {
    expect(seatMapDeferredOn('seating', grown)).toBe(true)
  })

  // Assign seats is where the new seats get their type, and it sends the grid whole.
  it('is false on Assign seats, which saves the seat map', () => {
    expect(seatMapDeferredOn('seats', grown)).toBe(false)
  })

  it('is false on every other step, which never saves the seat map', () => {
    expect(seatMapDeferredOn('basics', grown)).toBe(false)
    expect(seatMapDeferredOn('tickets', grown)).toBe(false)
  })

  it('is false once every seat has a type, or on a draft', () => {
    const typed = { ...grown, seatTicketTypes: [['tier-vip', 'tier-vip', 'tier-free'], ['tier-ga', 'tier-ga', 'tier-ga']] }
    expect(seatMapDeferredOn('seating', typed)).toBe(false)
    expect(seatMapDeferredOn('seating', { ...grown, status: 'draft' })).toBe(false)
  })

  it('agrees with the write Seating sends', () => {
    expect(saveIntentOf('seating', grown)).toBe('save')
  })

  it('is explained on the Seating step', () => {
    expect(SEAT_MAP_DEFERRED_NOTE).toBe(
      'New seats need a ticket type. The seat map is saved when you give them one in Assign seats.',
    )
  })
})

/**
 * US-EVT-05: Assign seats can only offer ticket types the API has stored. Next
 * on Tickets saves the new types and opens Assign seats at once, so for the
 * moment the save is in flight there are none yet — and the step must not
 * flash "add your ticket types first" at someone who just did.
 *
 * US-EVT-02: the step is on every event's rail, so one with no seat map is
 * told why there is nothing to assign.
 */
describe('assignSeatsViewOf — what Assign seats shows', () => {
  const reserved = { seatingMode: 'reserved', isOnline: false } as const

  it('shows the rows once a saved ticket type is known, saving or not', () => {
    expect(assignSeatsViewOf(reserved, 2, false)).toBe('rows')
    expect(assignSeatsViewOf(reserved, 1, true)).toBe('rows')
  })

  it('says the ticket types are saving while a save is in flight and none is known yet', () => {
    expect(assignSeatsViewOf(reserved, 0, true)).toBe('saving')
    expect(SAVING_TICKET_TYPES).toBe('Saving your ticket types…')
  })

  it('sends the organizer to Tickets when there are none and nothing is saving', () => {
    expect(assignSeatsViewOf(reserved, 0, false)).toBe('empty')
  })

  // An online event has no seats, whatever the seating switch was left at.
  it('tells an online event it has no seats to assign', () => {
    expect(assignSeatsViewOf({ seatingMode: 'reserved', isOnline: true }, 2, false)).toBe('online')
    expect(assignSeatsViewOf({ seatingMode: 'ga', isOnline: true }, 0, true)).toBe('online')
    expect(NO_SEATS_TO_ASSIGN.online).toBe('Online events have no seats to assign.')
  })

  it('tells general admission it has no seats to assign, and where reserved seating is chosen', () => {
    expect(assignSeatsViewOf({ seatingMode: 'ga', isOnline: false }, 2, false)).toBe('ga')
    expect(assignSeatsViewOf({ seatingMode: 'ga', isOnline: false }, 0, true)).toBe('ga')
    expect(NO_SEATS_TO_ASSIGN.ga).toBe(
      'General admission has no seats to assign. To sell seats by ticket type, choose Reserved seating on the Seating step.',
    )
  })
})
