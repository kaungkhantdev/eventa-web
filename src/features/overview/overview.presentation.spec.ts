import { describe, expect, it } from 'vitest'
import { hasRevenue } from './overview.presentation'

/**
 * A period with no sales comes back as a full series of zeroes, not an empty
 * one — so "is there anything to plot" cannot be answered by the array's
 * length. Drawn, it produced a flat line along the axis inside an empty grid,
 * which reads as a chart that failed rather than a month that earned nothing.
 */
describe('hasRevenue', () => {
  it('is true once any point earned something', () => {
    expect(hasRevenue([0, 0, 120, 0])).toBe(true)
  })

  it('is false for a period of zeroes', () => {
    expect(hasRevenue([0, 0, 0, 0, 0, 0, 0])).toBe(false)
  })

  it('is false when the series is empty', () => {
    expect(hasRevenue([])).toBe(false)
  })
})
