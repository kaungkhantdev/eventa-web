import { describe, expect, it } from 'vitest'
import {
  chartMax,
  toRecentRow,
  toRevenueChart,
  toSellingFastRow,
  toStatCards,
  toTierRows,
} from './dashboard.mapper'
import type {
  ChangeWire,
  FeedItemWire,
  KpisWire,
  RevenueTrendWire,
  SellingFastWire,
} from './overview.types'

const BAHT = 100

const flat: ChangeWire = { direction: 'flat', percent: null, improved: null }
const rose: ChangeWire = { direction: 'up', percent: 12.5, improved: true }
const fell: ChangeWire = { direction: 'down', percent: 1.4, improved: false }

const kpis = (over: Partial<KpisWire> = {}): KpisWire => ({
  registrations: { value: 1340, change: rose },
  revenueSatang: { value: 48_290 * BAHT, change: rose },
  upcomingEvents: { value: 12, change: flat },
  checkInRate: { value: 87, change: fell },
  capacityFilled: { value: 78, change: rose },
  ...over,
})

describe('toStatCards', () => {
  it('reads the five headline figures in their own units', () => {
    const [signUps, revenue, events, checkIn, capacity] = toStatCards(kpis())

    expect(signUps.value).toBe('1,340')
    expect(revenue.value).toBe('฿48.29k')
    expect(events.value).toBe('12')
    expect(checkIn.value).toBe('87%')
    expect(capacity.value).toBe('78%')
  })

  // US-DASH-08: the figure is not disclosed, and the rest render normally.
  it('drops the revenue card entirely without finance access', () => {
    const cards = toStatCards(kpis({ revenueSatang: null }))

    expect(cards).toHaveLength(4)
    expect(cards.map((c) => c.id)).not.toContain('revenue')
  })

  it('shows a metric with no data as empty rather than as zero', () => {
    const [, , , checkIn] = toStatCards(
      kpis({ checkInRate: { value: null, change: flat } }),
    )

    expect(checkIn.value).toBe('—')
  })

  // A falling check-in rate is a worsening, so it reads down and warning-
  // coloured — the direction of the arrow and the colour are separate facts.
  it('colours by whether it improved, and points by which way it moved', () => {
    const [signUps, , , checkIn] = toStatCards(kpis())

    expect(signUps.delta).toMatchObject({ text: '12.5%', tone: 'text-brand' })
    expect(checkIn.delta).toMatchObject({ text: '1.4%', tone: 'text-red-500' })
    expect(checkIn.delta.icon).toContain('down')
  })

  it('claims no movement when there is no baseline to compare against', () => {
    const [, , events] = toStatCards(kpis())

    expect(events.delta.text).toBe('—')
    expect(events.delta.icon).toBeNull()
    expect(events.delta.tone).toBe('text-muted')
  })
})

const trend = (over: Partial<RevenueTrendWire> = {}): RevenueTrendWire => ({
  range: 'year',
  totalSatang: 48_290 * BAHT,
  change: rose,
  points: [
    { at: '2026-01-31T17:00:00.000Z', netSatang: 28_000 * BAHT },
    { at: '2026-02-28T17:00:00.000Z', netSatang: 31_500 * BAHT },
  ],
  ...over,
})

describe('toRevenueChart', () => {
  it('plots thousands of baht, so the axis reads ฿28k not ฿2,800,000', () => {
    expect(toRevenueChart(trend()).values).toEqual([28, 31.5])
  })

  it('labels the year by month, on the Bangkok calendar', () => {
    // 17:00 UTC on 31 Jan is already 1 Feb in Bangkok — the label must not
    // silently shift a month because the reader is elsewhere.
    expect(toRevenueChart(trend()).labels).toEqual(['Feb', 'Mar'])
  })

  it('labels a week by weekday and a month by day of the month', () => {
    const points = [{ at: '2026-08-14T03:00:00.000Z', netSatang: 0 }]

    expect(toRevenueChart(trend({ range: 'week', points })).labels).toEqual(['Fri'])
    expect(toRevenueChart(trend({ range: 'month', points })).labels).toEqual(['14'])
  })

  it('states the period total and how it compares', () => {
    const chart = toRevenueChart(trend())

    expect(chart.total).toBe('฿48.29k')
    expect(chart.delta.text).toBe('12.5%')
  })

  it('is an empty, neutral result when nothing was earned', () => {
    const chart = toRevenueChart(trend({ totalSatang: 0, change: flat, points: [] }))

    expect(chart.total).toBe('฿0')
    expect(chart.delta.text).toBe('—')
    expect(chart.values).toEqual([])
  })
})

describe('chartMax', () => {
  it('leaves headroom above the tallest point', () => {
    expect(chartMax([28, 52])).toBeGreaterThan(52)
  })

  it('never returns a zero axis, which would collapse the plot', () => {
    expect(chartMax([])).toBeGreaterThan(0)
    expect(chartMax([0, 0])).toBeGreaterThan(0)
  })

  it('rounds to something a person would draw a gridline on', () => {
    expect(chartMax([28, 52])).toBe(60)
  })
})

describe('toTierRows', () => {
  it('keeps the API order and gives each tier its own colour', () => {
    const rows = toTierRows([
      { ticketTypeName: 'General Admission', count: 563, percent: 42 },
      { ticketTypeName: 'VIP', count: 322, percent: 24 },
    ])

    expect(rows.map((r) => r.name)).toEqual(['General Admission', 'VIP'])
    expect(rows[0].color).not.toBe(rows[1].color)
  })
})

const tier = (over: Partial<SellingFastWire> = {}): SellingFastWire => ({
  ticketTypeId: 't-1',
  ticketTypeName: 'Early Bird',
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  remaining: 12,
  total: 100,
  ...over,
})

describe('toSellingFastRow', () => {
  it('names the tier and the event it belongs to', () => {
    const row = toSellingFastRow(tier())

    expect(row.name).toBe('Early Bird')
    expect(row.event).toBe('Tech Summit 2026')
    expect(row.left).toBe('12 left')
  })

  // One booking takes up to 8 seats, so at or below that a single order can
  // clear the tier — which is what makes it urgent rather than merely low.
  it('reddens once a single booking could take the rest', () => {
    expect(toSellingFastRow(tier({ remaining: 3 })).tone).toContain('red')
    expect(toSellingFastRow(tier({ remaining: 8 })).tone).toContain('amber')
    expect(toSellingFastRow(tier({ remaining: 12 })).tone).toContain('muted')
  })
})

const feedItem = (over: Partial<FeedItemWire> = {}): FeedItemWire => ({
  orderId: 'o-1',
  attendeeName: 'Anong Pattana',
  eventName: 'Tech Summit 2026',
  ticketTypeName: 'VIP',
  totalSatang: 1_250 * BAHT,
  paymentStatus: 'paid',
  registeredAt: '2026-08-14T03:24:00.000Z',
  ...over,
})

describe('toRecentRow', () => {
  it('reads as attendee, event, amount, status and time', () => {
    const row = toRecentRow(feedItem())

    expect(row).toMatchObject({
      initials: 'AP',
      name: 'Anong Pattana',
      event: 'Tech Summit 2026',
      amount: '฿1,250',
      status: 'Paid',
      time: '10:24',
    })
  })

  // US-DASH-12: the amount is hidden without finance access — and hidden is
  // not free. `฿0` would tell the reader the ticket cost nothing.
  it('masks a withheld amount rather than showing it as free', () => {
    expect(toRecentRow(feedItem({ totalSatang: null })).amount).toBe('—')
    expect(toRecentRow(feedItem({ totalSatang: 0 })).amount).toBe('Free')
  })

  it('tints each payment status', () => {
    expect(toRecentRow(feedItem({ paymentStatus: 'refunded' })).status).toBe('Refunded')
    expect(toRecentRow(feedItem({ paymentStatus: 'failed' })).statusTone).toContain('red')
  })
})
