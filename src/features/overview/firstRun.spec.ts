import { describe, expect, it } from 'vitest'
import { isFirstRun } from './firstRun'
import type { HomeData } from './overview.routes'

/**
 * Whether Home shows the guided start instead of its panels.
 *
 * The rule that matters is the negative one: an outage must never be mistaken
 * for a new workspace. A panel that failed to load says nothing about whether
 * the organizer has events, so it cannot be counted as empty — a returning
 * organizer whose API blinked would otherwise be told to create their first
 * event, with their real events still sitting on the server.
 */

const home = (over: Partial<HomeData> = {}): HomeData => ({
  greeting: 'Good evening, Harper',
  today: { count: 0, rows: [], emptyMessage: 'No registrations yet today.' },
  alerts: [],
  alertsEmpty: "You're all caught up.",
  meetings: { ok: true, data: { count: 0, rows: [] } },
  upcoming: { ok: true, data: [] },
  ring: { ok: true, data: { slices: [], active: 0 } },
  ...over,
})

describe('isFirstRun', () => {
  it('is true when every panel loaded and the workspace is empty', () => {
    expect(isFirstRun(home())).toBe(true)
  })

  it('is false once a single event exists, even with no registrations yet', () => {
    expect(isFirstRun(home({ ring: { ok: true, data: { slices: [], active: 1 } } }))).toBe(false)
  })

  it('is false when an event is coming up', () => {
    const upcoming = { ok: true as const, data: [{ id: 'e1' }] as never }
    expect(isFirstRun(home({ upcoming }))).toBe(false)
  })

  it('is false when someone registered today', () => {
    const today = { count: 1, rows: [] as never, emptyMessage: null }
    expect(isFirstRun(home({ today }))).toBe(false)
  })

  it('is false when a meeting is scheduled today', () => {
    expect(isFirstRun(home({ meetings: { ok: true, data: { count: 1, rows: [] } } }))).toBe(false)
  })

  it('is false when there is an outstanding alert', () => {
    expect(isFirstRun(home({ alerts: [{ id: 'a1' }] as never }))).toBe(false)
  })

  // the load-bearing case
  it('is false when a panel failed — an outage is not a new workspace', () => {
    expect(isFirstRun(home({ ring: { ok: false, error: 'Service unavailable' } }))).toBe(false)
    expect(isFirstRun(home({ upcoming: { ok: false, error: 'Service unavailable' } }))).toBe(false)
    expect(isFirstRun(home({ meetings: { ok: false, error: 'Service unavailable' } }))).toBe(false)
  })

  it('is false when registrations are hidden by permission rather than absent', () => {
    // `today: null` means "you may not see this", which is not evidence of emptiness.
    expect(isFirstRun(home({ today: null }))).toBe(false)
  })
})
