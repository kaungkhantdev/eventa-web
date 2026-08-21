import { Icon } from '@/components/ui'
import type { EventChoice } from '../program.routes'

/**
 * Which event's programme is being worked on.
 *
 * A select rather than the kit's "All events" picker: sessions and speakers
 * belong to one event on the API, so "all" was never an answer this screen
 * could give.
 */
export function EventChooser({
  events,
  value,
  onChange,
}: {
  events: EventChoice[]
  value: string
  onChange: (eventId: string) => void
}) {
  return (
    <div className="relative w-full sm:w-56">
      <Icon
        name="hgi-calendar-03"
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
        aria-label="Choose event"
        disabled={events.length === 0}
      >
        {events.length === 0 && <option value="">No events yet</option>}
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name}
          </option>
        ))}
      </select>
    </div>
  )
}
