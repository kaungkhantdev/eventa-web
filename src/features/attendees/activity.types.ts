import type { AuditEntryWire } from '@/features/settings/settings.types'

/**
 * The attendee profile's activity timeline (US-REG-08 AC5).
 *
 * The history is read from `GET /audit`, the same append-only trail the
 * security & access log on the settings screen reads — there is no second
 * activity table, by design: a contact correction is recorded once, and two
 * trails could disagree about what happened. So the wire row is **imported**
 * from the feature that already declares that endpoint's shape rather than
 * re-typed here; a field rename then breaks one declaration instead of two
 * that silently drift.
 */
export type { AuditEntryWire }

/** One line of the timeline, as the kit draws it. */
export interface TimelineEntry {
  id: number
  /** What happened, in the API's own words — never a sentence of ours. */
  title: string
  /**
   * When, on the Bangkok clock, and who by when the entry recorded somebody:
   * `Jul 15, 2026 · 10:24 · Somchai Tanakit`.
   */
  when: string
  /** The newest line, which the kit marks with a filled dot rather than a hollow one. */
  isLatest: boolean
}
