import { api, type Query } from '@/lib/api'
import type { AttendanceCountsWire, AttendanceWire, ScanResultWire } from './door.types'

/** Every call the door makes (US-REG-11/12/13). */

export interface RollQuery extends Query {
  page: number
  limit: number
  status?: 'checked_in' | 'expected'
  search?: string
  sort?: 'name' | 'recent'
}

export const doorApi = {
  /** The roll. `meta` carries the room's counts beside the page. */
  roll: (eventId: string, query: RollQuery) =>
    api.list<AttendanceWire>(`/events/${eventId}/check-ins`, { query }),

  /** Read a code at the station. A refusal is a RESULT here, not an error. */
  scan: (eventId: string, qrToken: string) =>
    api.post<ScanResultWire>(`/events/${eventId}/check-ins/scan`, { qrToken }),

  /** Admit somebody found by name when the code will not scan. */
  admit: (eventId: string, ticketId: string) =>
    api.post<ScanResultWire>(`/events/${eventId}/check-ins`, { ticketId, method: 'manual' }),

  undo: (eventId: string, ticketId: string) =>
    api.delete<void>(`/events/${eventId}/check-ins/${ticketId}`),
}

/**
 * The counts the API hung on `meta`.
 *
 * `api.list` types `meta` loosely because every list endpoint attaches its own
 * extras, so the narrowing happens once here rather than at each call site —
 * and a response without them reads as an empty room rather than as `NaN`.
 */
export function countsOf(meta: Record<string, unknown>): AttendanceCountsWire {
  const counts = meta.counts as Partial<AttendanceCountsWire> | undefined
  return {
    total: counts?.total ?? 0,
    checkedIn: counts?.checkedIn ?? 0,
    expected: counts?.expected ?? 0,
  }
}
