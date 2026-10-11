import { bangkokDate, bangkokTime } from '@/lib/format'
import type { AuditEntryWire, TimelineEntry } from './activity.types'

/**
 * Audit entries → the attendee profile's activity timeline (US-REG-08 AC5).
 *
 * An audit row is not a timeline line. Three decisions live here rather than in
 * the panel's markup:
 *
 * 1. **The title is shown verbatim.** The API writes it unparameterised
 *    ("Updated contact details") precisely so no client has to match on prose
 *    that will be translated — composing our own sentence would put the same
 *    fact in two codebases.
 * 2. **`meta` is not parsed.** It carries a free-text subject prefix
 *    (`attendee #42 · changed: email, phone`) that nothing in the database
 *    enforces and that a writer in the API repo composes. Reading it here would
 *    copy that format into this repo, where a rename would break silently; the
 *    prefix is also machine bookkeeping, not something to read.
 * 3. **The clock is Bangkok's**, like every other instant on screen. The entry
 *    is a record of when something happened to this attendee, and in this
 *    product that is Thailand's calendar day, not the reader's.
 *
 * The actor is appended when the entry recorded one, because the title is the
 * same for every contact correction: four edits would otherwise be one line
 * printed four times, distinguishable only by minute. An entry raised by a
 * background job has no actor, so the detail is joined from what is present
 * rather than templated — a template with a hole in it prints a stray `·`.
 */
export function toTimeline(entries: readonly AuditEntryWire[]): TimelineEntry[] {
  // The API answers `occurredAt DESC`, so the first row is the newest and the
  // list is rendered in the order it arrived. Re-sorting a page of a longer
  // history would only reorder the twenty that happened to be sent.
  return entries.map((entry, index) => toTimelineEntry(entry, index === 0))
}

function toTimelineEntry(entry: AuditEntryWire, isLatest: boolean): TimelineEntry {
  return {
    id: entry.id,
    title: entry.title,
    when: [
      `${bangkokDate(entry.occurredAt)} · ${bangkokTime(entry.occurredAt)}`,
      entry.actorName,
    ]
      .filter(Boolean)
      .join(' · '),
    isLatest,
  }
}
