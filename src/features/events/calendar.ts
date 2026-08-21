import type { CalendarEvent } from './types'

/**
 * The month grid, as pure calendar arithmetic.
 *
 * Days are handled as `YYYY-MM-DD` strings and built in UTC, never as local
 * `Date`s: the squares of a calendar are labels, not instants, and constructing
 * them in the viewer's timezone is what makes a grid slip a day for anyone west
 * of the events they are looking at. `events` already carry their Bangkok day
 * (see `toCalendarEvents`), so both sides of the comparison mean the same thing.
 */

/** How many event pills fit in a square before they roll up into "+N more". */
export const MAX_PILLS_PER_DAY = 3

/** Six weeks — the most any month can span, and a grid that never reflows. */
const CELLS = 42

export interface DayCell {
  /** `YYYY-MM-DD`. */
  key: string
  /** The number printed in the corner. */
  day: number
  /** A leading or trailing day belonging to the neighbouring month. */
  otherMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: CalendarEvent[]
  /** Events beyond the ones shown. */
  more: number
}

/** `2026-09` → `{ year: 2026, month: 8 }` (month zero-based, as `Date` counts). */
export function parseMonth(month: string): { year: number; month: number } {
  const [year, oneBased] = month.split('-').map(Number)
  return { year: year!, month: oneBased! - 1 }
}

/** Step a `YYYY-MM` forward or back, rolling the year over. */
export function shiftMonth(month: string, by: number): string {
  const { year, month: index } = parseMonth(month)
  return monthKey(new Date(Date.UTC(year, index + by, 1)))
}

/** The month a `YYYY-MM-DD` day belongs to. */
export function monthOfDay(day: string): string {
  return day.slice(0, 'YYYY-MM'.length)
}

function monthKey(date: Date): string {
  return dayKey(date).slice(0, 'YYYY-MM'.length)
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 'YYYY-MM-DD'.length)
}

/**
 * The six weeks a month is drawn over, each square carrying the events that
 * fall on it. Weeks start on Sunday, as the kit's header row does.
 */
export function monthGrid(
  month: string,
  events: readonly CalendarEvent[],
  marks: { today: string; selected: string },
): DayCell[] {
  const { year, month: index } = parseMonth(month)
  // The Sunday on or before the 1st, so the grid always starts on a week.
  const lead = new Date(Date.UTC(year, index, 1)).getUTCDay()

  return Array.from({ length: CELLS }, (_, offset) => {
    const date = new Date(Date.UTC(year, index, 1 - lead + offset))
    const key = dayKey(date)
    const onDay = events.filter((event) => event.day === key)
    return {
      key,
      day: date.getUTCDate(),
      otherMonth: monthOfDay(key) !== month,
      isToday: key === marks.today,
      isSelected: key === marks.selected,
      events: onDay.slice(0, MAX_PILLS_PER_DAY),
      more: Math.max(0, onDay.length - MAX_PILLS_PER_DAY),
    }
  })
}

/** Everything on one day, in time order — the agenda beside the grid. */
export function eventsOnDay(events: readonly CalendarEvent[], day: string): CalendarEvent[] {
  return events.filter((event) => event.day === day)
}

/** `09:00` → `9am`, the pill's compact label. */
export function shortTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number)
  const suffix = hour! < 12 ? 'am' : 'pm'
  const hour12 = hour! % 12 || 12
  return minute === 0 ? `${hour12}${suffix}` : `${hour12}:${String(minute).padStart(2, '0')}${suffix}`
}

/** `09:00` → `9:00 AM`, the agenda's label. */
export function longTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number)
  const suffix = hour! < 12 ? 'AM' : 'PM'
  const hour12 = hour! % 12 || 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

/** `2026-09-04` → `Friday, Sep 4` for the agenda heading. */
export function dayHeading(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}
