import { describe, expect, it } from 'vitest'
import { MASKED, bangkokDate, bangkokTime, satang } from './format'

describe('satang → what the organizer reads', () => {
  it('formats a price in baht', () => {
    expect(satang(188_000)).toBe('฿1,880')
  })

  it('calls zero "Free" rather than ฿0', () => {
    // The kit's own word — a free ticket is not a price of nothing.
    expect(satang(0)).toBe('Free')
  })

  it('renders a MASKED figure as a dash, never as zero', () => {
    // The API sends null when the caller lacks finance access. Showing ฿0
    // would state a fact — "it was free" — that we do not know to be true.
    expect(satang(null)).toBe(MASKED)
    expect(satang(null)).not.toBe('฿0')
    expect(satang(null)).not.toBe('Free')
  })

  it('keeps satang out of the display — 1 baht is 100 satang', () => {
    expect(satang(100)).toBe('฿1')
  })

  it('rounds a half-baht amount rather than showing a fraction', () => {
    expect(satang(150)).toBe('฿2')
  })

  it('groups thousands', () => {
    expect(satang(1_234_567_00)).toBe('฿1,234,567')
  })
})

describe('UTC instants shown in Bangkok', () => {
  it('formats a date the way the kit does', () => {
    expect(bangkokDate('2026-07-08T03:00:00Z')).toBe('Jul 8, 2026')
  })

  it('uses the BANGKOK day, not the UTC one', () => {
    // 18:00 UTC on the 7th is 01:00 on the 8th in Bangkok. A viewer anywhere
    // must see the day the event's own city was on.
    expect(bangkokDate('2026-07-07T18:00:00Z')).toBe('Jul 8, 2026')
  })

  it('does not roll the day early — 16:59 UTC is still the 7th there', () => {
    expect(bangkokDate('2026-07-07T16:59:00Z')).toBe('Jul 7, 2026')
  })

  it('shows a 24-hour Bangkok wall clock', () => {
    expect(bangkokTime('2026-07-08T03:24:00Z')).toBe('10:24')
  })

  it('pads the hour so times line up in a column', () => {
    expect(bangkokTime('2026-07-08T01:05:00Z')).toBe('08:05')
  })

  it('returns the dash for a missing instant', () => {
    expect(bangkokDate(null)).toBe(MASKED)
    expect(bangkokTime(null)).toBe(MASKED)
  })
})
