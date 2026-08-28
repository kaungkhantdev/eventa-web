import { describe, expect, it } from 'vitest'
import type { Panel } from '@/app/panels'
import type { UpcomingCard } from './overview.types'
import { nextEventSlug, registrationLinkFor } from './shareLink'

const card = (slug: string): UpcomingCard =>
  ({ id: slug, slug, title: slug }) as unknown as UpcomingCard

const ok = (cards: UpcomingCard[]): Panel<UpcomingCard[]> => ({ ok: true, data: cards })

describe('nextEventSlug', () => {
  it('offers the soonest upcoming event', () => {
    expect(nextEventSlug(ok([card('tech-summit'), card('later-one')]))).toBe('tech-summit')
  })

  it('offers nothing when there are no upcoming events', () => {
    expect(nextEventSlug(ok([]))).toBeNull()
  })

  /**
   * A failed read is not "no events" — it is "we do not know". Falling back to
   * the "create your first event" button would tell an organizer with a full
   * calendar that they have none.
   */
  it('offers nothing when the read failed', () => {
    expect(nextEventSlug({ ok: false, error: 'Upcoming events are unavailable.' })).toBeNull()
  })
})

describe('registrationLinkFor', () => {
  it('builds the canonical public page', () => {
    expect(registrationLinkFor('https://app.eventa.co.th', 'tech-summit-2026')).toBe(
      'https://app.eventa.co.th/e/tech-summit-2026',
    )
  })

  it('does not double the slash when the origin carries one', () => {
    expect(registrationLinkFor('https://app.eventa.co.th/', 'x')).toBe(
      'https://app.eventa.co.th/e/x',
    )
  })

  it('escapes a slug, so it cannot break out of the path', () => {
    expect(registrationLinkFor('https://a.test', 'a/b?c')).toBe('https://a.test/e/a%2Fb%3Fc')
  })
})
