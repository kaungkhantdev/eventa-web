import { EventPicker } from '@/components/ui'
import type { EventChoice } from '../program.routes'

/**
 * Which event's programme is being worked on.
 *
 * No catch-all: sessions and speakers belong to one event on the API, so "all"
 * was never an answer this screen could give. Searchable like every other event
 * selection — a plain <select> puts the whole list in the DOM with no way to
 * narrow it, which stops being usable a long way before the API's page limit.
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
      <EventPicker
        value={value}
        onChange={onChange}
        options={events}
        allLabel={false}
        placeholder={events.length === 0 ? 'No events yet' : 'Choose event'}
        disabled={events.length === 0}
        className="h-10 w-full border-0 bg-surface font-medium"
      />
    </div>
  )
}
