import type { PickerEvent } from '@/components/ui'
import { bangkokDate } from '@/lib/format'
import { STATUS_LABEL } from './eventDetail.mapper'
import { eventsApi } from './events.api'

/**
 * The workspace's events, shaped for the shared `EventPicker`.
 *
 * Seven loaders each had their own copy of this, every one of them keeping only
 * the id and the name — so every event filter in the console was a bare list of
 * titles while the pickers on the demo pages showed a date and a status dot.
 * The date and status were in the same response all along; they were dropped on
 * the way through. One builder, so a filter cannot quietly lose them again.
 */

/**
 * How many events a picker offers. Enough that the search box is doing the
 * narrowing rather than this limit; a workspace past it needs the server-side
 * search the picker's UI is already shaped for.
 */
export const EVENT_OPTIONS_LIMIT = 100

/**
 * One option from the API. Narrower than `PickerEvent`, whose `id` is optional
 * because the demo catalog is keyed by name — a real event always has one, and
 * the filters store it in `?eventId=`.
 */
export interface EventOption extends PickerEvent {
  id: string
}

export async function eventOptions(limit: number = EVENT_OPTIONS_LIMIT): Promise<EventOption[]> {
  const page = await eventsApi.list({ limit, sort: 'recent' })
  return page.items.map((event) => ({
    id: event.id,
    name: event.name,
    // Undefined rather than '' so the picker renders no date at all instead of
    // an empty cell that pushes the status dot out of line.
    date: event.startAt ? bangkokDate(event.startAt) : undefined,
    status: STATUS_LABEL[event.status],
  }))
}
