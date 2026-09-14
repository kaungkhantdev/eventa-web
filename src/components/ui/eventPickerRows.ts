import type { EventStatus } from '@/features/events/types'
import type { ComboOption } from './comboFilter'

/** One event a picker can offer. */
export interface PickerEvent {
  /**
   * What `onChange` reports for this row.
   *
   * The demo catalog has no ids and is keyed by name; an API-backed list passes
   * the real id, because that is what its `?eventId=` filter stores and what
   * the server matches on. Two events may share a name — ids are the only safe
   * key once the list is real.
   */
  id?: string
  name: string
  /** `Jul 18, 2026` on the Bangkok clock. Absent where the list has no date. */
  date?: string
  status?: EventStatus
}

/** The value a row reports: its id, or its name where the list is name-keyed. */
export function eventValue(event: PickerEvent): string {
  return event.id ?? event.name
}

/**
 * The rows the popup shows, catch-all first.
 *
 * The catch-all's VALUE and its LABEL are separate on purpose. A URL-backed
 * filter stores the empty string for "no event chosen", so that the parameter
 * drops out of the address entirely; the pages still on demo data compare
 * against the label itself. Both need the row to read "All events".
 *
 * The date goes in `keywords` rather than the label: it is searchable without
 * being part of the name, which is how somebody running the same event twice
 * tells the two apart by typing "jazz jul".
 */
export function eventRows(
  options: readonly PickerEvent[],
  allLabel: string | false,
  allValue?: string,
): ComboOption[] {
  const rows = options.map((event) => ({
    value: eventValue(event),
    label: event.name,
    keywords: event.date,
  }))
  if (allLabel === false) return rows
  return [{ value: allValue ?? allLabel, label: allLabel }, ...rows]
}
