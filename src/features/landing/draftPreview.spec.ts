import { describe, expect, it } from 'vitest'
import { toDraftPreview } from './draftPreview'

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

  // A draft has no agenda, speakers, tickets or FAQs until it is saved. Empty
  // is the honest answer; the templates leave those sections out entirely.
  it('carries no content the wizard cannot know yet', () => {
    const draft = preview('title=Tech Summit')
    expect(draft.agenda).toEqual([])
    expect(draft.speakers).toEqual([])
    expect(draft.tickets).toEqual([])
    expect(draft.faqs).toEqual([])
  })

  // Nothing has been published, so there is nowhere to send anybody.
  it('offers no registration link', () => {
    expect(preview('title=Tech Summit').registerUrl).toBe('')
  })
})
