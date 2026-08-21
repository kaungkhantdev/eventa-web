import { describe, expect, it } from 'vitest'
import {
  MAX_PILLS_PER_DAY,
  dayHeading,
  eventsOnDay,
  longTime,
  monthGrid,
  shiftMonth,
  shortTime,
} from './calendar'
import type { CalendarEvent } from './types'

const at = (day: string, time: string, name = 'Standup'): CalendarEvent => ({
  id: `${day}T${time}`,
  name,
  day,
  time,
  tone: 'brand',
})

const marks = { today: '2026-09-04', selected: '2026-09-04' }

describe('the month grid', () => {
  it('always draws six weeks, so the page does not reflow month to month', () => {
    expect(monthGrid('2026-09', [], marks)).toHaveLength(42)
    expect(monthGrid('2026-02', [], marks)).toHaveLength(42)
  })

  it('starts on the Sunday on or before the 1st', () => {
    // 1 September 2026 is a Tuesday, so the grid opens on 30 August.
    expect(monthGrid('2026-09', [], marks)[0]!.key).toBe('2026-08-30')
  })

  it('starts on the 1st itself when the month begins on a Sunday', () => {
    // 1 November 2026 is a Sunday.
    expect(monthGrid('2026-11', [], marks)[0]!.key).toBe('2026-11-01')
  })

  it('marks the days either side as belonging to another month', () => {
    const cells = monthGrid('2026-09', [], marks)
    expect(cells[0]!.otherMonth).toBe(true)
    expect(cells.find((c) => c.key === '2026-09-01')!.otherMonth).toBe(false)
    expect(cells.at(-1)!.otherMonth).toBe(true)
  })

  it('files each event in its own square', () => {
    const cells = monthGrid('2026-09', [at('2026-09-04', '09:30')], marks)
    expect(cells.find((c) => c.key === '2026-09-04')!.events).toHaveLength(1)
    expect(cells.find((c) => c.key === '2026-09-05')!.events).toHaveLength(0)
  })

  it('rolls a busy day up into "+N more" rather than overflowing the square', () => {
    const busy = ['08:00', '09:00', '10:00', '11:00', '12:00'].map((t) => at('2026-09-04', t))
    const cell = monthGrid('2026-09', busy, marks).find((c) => c.key === '2026-09-04')!
    expect(cell.events).toHaveLength(MAX_PILLS_PER_DAY)
    expect(cell.more).toBe(2)
  })

  it('leaves `more` at zero when everything fits', () => {
    const cell = monthGrid('2026-09', [at('2026-09-04', '09:00')], marks).find(
      (c) => c.key === '2026-09-04',
    )!
    expect(cell.more).toBe(0)
  })

  it('marks today and the selected day', () => {
    const cells = monthGrid('2026-09', [], { today: '2026-09-04', selected: '2026-09-11' })
    expect(cells.find((c) => c.key === '2026-09-04')!.isToday).toBe(true)
    expect(cells.find((c) => c.key === '2026-09-11')!.isSelected).toBe(true)
    expect(cells.find((c) => c.key === '2026-09-11')!.isToday).toBe(false)
  })

  it('numbers a leap February to the 29th', () => {
    const cells = monthGrid('2028-02', [], marks)
    expect(cells.some((c) => c.key === '2028-02-29')).toBe(true)
  })
})

describe('stepping between months', () => {
  it('goes forward and back', () => {
    expect(shiftMonth('2026-09', 1)).toBe('2026-10')
    expect(shiftMonth('2026-09', -1)).toBe('2026-08')
  })

  it('rolls the year over at both ends', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  })
})

describe('the agenda beside the grid', () => {
  it('shows only the selected day', () => {
    const events = [at('2026-09-04', '09:00'), at('2026-09-05', '10:00')]
    expect(eventsOnDay(events, '2026-09-04')).toHaveLength(1)
  })

  it('names the day the way the kit does', () => {
    expect(dayHeading('2026-09-04')).toBe('Friday, Sep 4')
  })
})

describe('clock labels', () => {
  it('drops ":00" on the hour, and keeps the minutes otherwise', () => {
    expect(shortTime('09:00')).toBe('9am')
    expect(shortTime('18:30')).toBe('6:30pm')
  })

  it('calls midnight and noon by the right half of the day', () => {
    expect(shortTime('00:00')).toBe('12am')
    expect(shortTime('12:00')).toBe('12pm')
  })

  it('spells the agenda time out', () => {
    expect(longTime('09:00')).toBe('9:00 AM')
    expect(longTime('18:30')).toBe('6:30 PM')
  })
})
