import { EventPicker } from '@/components/ui'
import type { EventOption } from '@/features/events/eventOptions'
import { useFilters, useSearchBox } from '@/lib/useFilters'

/**
 * The filter bar every report shares: a search and an event (US-RPT-02).
 *
 * Both write to the URL, because the API does the filtering. Typing is debounced
 * so a request is made once the organizer pauses rather than per keystroke, and
 * changing either drops the page number — page 4 of the old result set is not
 * page 4 of the new one.
 */
export function ReportFilters({ events }: { events: EventOption[] }) {
  const { params, set } = useFilters()
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-64">
        <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
          placeholder="Search events…"
          aria-label="Search events"
        />
      </div>
      <div className="relative w-full sm:w-52">
        <EventPicker
          value={params.get('eventId') ?? ''}
          // '' rather than the label, so choosing "All events" drops `?eventId=`
          // from the address instead of sending a name the API cannot match.
          allValue=""
          options={events}
          onChange={(eventId) => set({ eventId })}
          className="h-10 w-full border-0 bg-surface text-[14px] font-semibold"
        />
      </div>
    </div>
  )
}
