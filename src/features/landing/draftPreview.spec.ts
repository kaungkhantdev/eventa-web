import { describe, expect, it } from 'vitest'
import { overlayDraft, toDraftPreview } from './draftPreview'
import type { LandingEvent } from './types'

const preview = (query: string) => toDraftPreview(new URLSearchParams(query))

describe('toDraftPreview', () => {
  it('shows what the organizer has typed so far', () => {
    expect(preview('title=Tech Summit&venue=BITEC')).toMatchObject({
      title: 'Tech Summit',
      venue: 'BITEC',
    })
  })

  // The wizard opens the preview before anything is filled in. Placeholders
  // stand in for the shape of the page, and are plainly labelled as such.
  it('names an untitled draft rather than rendering a blank hero', () => {
    expect(preview('').title).toBe('Your event')
  })

  it('reads the highlights the wizard packed into one parameter', () => {
    expect(preview('hl=hgi-wifi:Free WiFi|hgi-coffee:Lunch').highlights).toEqual([
      { icon: 'hgi-wifi', label: 'Free WiFi' },
      { icon: 'hgi-coffee', label: 'Lunch' },
    ])
  })

  it('keeps a highlight whose label contains a colon', () => {
    expect(preview('hl=hgi-mic:Keynote: the year ahead').highlights).toEqual([
      { icon: 'hgi-mic', label: 'Keynote: the year ahead' },
    ])
  })

  it('drops a highlight with no label', () => {
    expect(preview('hl=hgi-wifi:|hgi-coffee:Lunch').highlights).toEqual([
      { icon: 'hgi-coffee', label: 'Lunch' },
    ])
  })

  it('has no highlights when none were typed', () => {
    expect(preview('').highlights).toEqual([])
  })

  it('marks an online event so the templates say so', () => {
    expect(preview('online=1').online).toBe(true)
    expect(preview('').online).toBe(false)
  })

  // A draft has no agenda, speakers, tickets, FAQs or seat map until it is
  // saved. Empty is the honest answer; the templates leave those sections out.
  it('carries no content the wizard cannot know yet', () => {
    const draft = preview('title=Tech Summit')
    expect(draft.agenda).toEqual([])
    expect(draft.speakers).toEqual([])
    expect(draft.tickets).toEqual([])
    expect(draft.faqs).toEqual([])
    expect(draft.seatMap).toBeNull()
  })

  // Nothing has been published, so there is nowhere to send anybody.
  it('offers no registration link', () => {
    expect(preview('title=Tech Summit').registerUrl).toBe('')
  })
})

/**
 * Previewing a live event (US-PAGE-09): the saved page, with what is typed in
 * the wizard laid over it — saved or not.
 */
describe('overlayDraft', () => {
  const saved: LandingEvent = {
    ...preview(''),
    slug: 'tech-summit',
    title: 'Tech Summit',
    venue: 'BITEC',
    online: false,
    highlights: [{ icon: 'hgi-mic', label: '20 speakers' }],
    agenda: [{ time: '09:00', title: 'Keynote', desc: 'Anong Prasert' }],
  }
  const over = (query: string) => overlayDraft(new URLSearchParams(query), saved)

  it('shows the typed title, highlights and online choice', () => {
    const page = over('event=tech-summit&title=Tech Summit 2026&online=1&hl=hgi-wifi:Free WiFi')
    expect(page).toMatchObject({
      title: 'Tech Summit 2026',
      online: true,
      highlights: [{ icon: 'hgi-wifi', label: 'Free WiFi' }],
    })
  })

  it('keeps everything the wizard does not type — the agenda, the address', () => {
    expect(over('event=tech-summit&title=New').agenda).toEqual(saved.agenda)
    expect(over('event=tech-summit&title=New').slug).toBe('tech-summit')
  })

  it('takes a cleared field as cleared, not as unchanged', () => {
    const page = over('event=tech-summit&venue=&online=0&hl=')
    expect(page.venue).toBe('')
    expect(page.online).toBe(false)
    expect(page.highlights).toEqual([])
  })

  // The landing gallery and Discover open the same URL with nothing typed.
  it('is the saved page untouched when nothing was typed', () => {
    expect(over('event=tech-summit')).toEqual(saved)
  })

  it('keeps the saved title rather than showing a blank one', () => {
    expect(over('event=tech-summit&title=').title).toBe('Tech Summit')
  })
})
