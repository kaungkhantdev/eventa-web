import { describe, expect, it } from 'vitest'
import { isDashboardFirstRun } from './dashboard.firstRun'
import type { DashboardData } from './dashboard.routes'

/**
 * Whether the dashboard shows one guided block instead of its charts.
 *
 * The rules that matter are the negative ones. An empty recent-registrations
 * feed is what proves the workspace has never sold anything — but the API
 * returns that same empty array to a reader without `regView`, so without the
 * permission the feed proves nothing and the charts stay. A withheld *revenue*
 * trend is different: money is redundant evidence here, because there is no
 * revenue without a registration, and the registration feed is still readable.
 */

const CHART = {
  total: '฿0',
  delta: { text: '—', icon: null, tone: '' },
  labels: ['Jan', 'Feb'],
  values: [0, 0],
  max: 1,
}

const data = (over: Partial<DashboardData> = {}): DashboardData => ({
  cards: [],
  revenue: CHART,
  range: 'year',
  tiers: [],
  totalRegistrations: '0',
  upcomingEvents: 0,
  sellingFast: [],
  recent: [],
  ...over,
})

describe('isDashboardFirstRun', () => {
  it('is true when the reader may see registrations and there has never been one', () => {
    expect(isDashboardFirstRun(data(), true)).toBe(true)
  })

  it('is false once a registration exists', () => {
    const recent = [{ id: 'o1' }] as never
    expect(isDashboardFirstRun(data({ recent }), true)).toBe(false)
  })

  it('is false when the ticket-type mix has a slice', () => {
    const tiers = [{ name: 'Early bird' }] as never
    expect(isDashboardFirstRun(data({ tiers }), true)).toBe(false)
  })

  it('is false when a tier is running low — something is on sale and moving', () => {
    const sellingFast = [{ id: 't1' }] as never
    expect(isDashboardFirstRun(data({ sellingFast }), true)).toBe(false)
  })

  // the case the sales evidence alone gets wrong
  it('is false when events are already published and only the first sale is missing', () => {
    // Nothing has sold, so every sales figure is empty — but two events are on
    // the calendar. "Create your first event" would be a lie printed next to a
    // card reading "Upcoming events: 2".
    expect(isDashboardFirstRun(data({ upcomingEvents: 2 }), true)).toBe(false)
  })

  it('is false when the upcoming-events count is withheld rather than zero', () => {
    // The KPI carries null for "not disclosed"; unknown is not proof of nothing.
    expect(isDashboardFirstRun(data({ upcomingEvents: null }), true)).toBe(false)
  })

  it('is false when the period took money', () => {
    const revenue = { ...CHART, values: [0, 12.5] }
    expect(isDashboardFirstRun(data({ revenue }), true)).toBe(false)
  })

  // the load-bearing case
  it('is false when registrations are hidden by permission rather than absent', () => {
    // Without `regView` the API sends an empty feed, which is masking and not
    // evidence: guiding a returning organizer to "create your first event"
    // because of their own role would be a lie about their workspace.
    expect(isDashboardFirstRun(data(), false)).toBe(false)
  })

  it('is true when only the revenue trend is withheld', () => {
    // No finance access hides the money, not the registrations — and there is
    // no revenue without a registration, so the feed still settles it.
    expect(isDashboardFirstRun(data({ revenue: null }), true)).toBe(true)
  })
})
