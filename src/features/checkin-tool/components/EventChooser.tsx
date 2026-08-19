import { useMemo, useState } from 'react'
import { Dropdown, Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { EventStatus } from '@/features/events/types'
import type { EventChoice } from '../door.routes'

/**
 * Which event's door is being worked (checkin-tool.html).
 *
 * The event name IS the page's headline, and the chevron opens a searchable
 * list rather than a native `<select>` — the kit's own reasoning, kept:
 *
 *   "A plain <select> can't scale to thousands of events (no search, whole
 *    list in the DOM, awful on mobile)."
 *
 * The filter is local because the loader already holds the page of events it
 * offers. At real scale this becomes a debounced server query behind the same
 * UI, exactly as the kit's comment anticipates.
 */

/** The kit's status dots, verbatim. */
const STATUS_DOT: Record<EventStatus, string> = {
  Live: 'bg-brand',
  Upcoming: 'bg-blue-500',
  Planned: 'bg-blue-500',
  Draft: 'bg-amber-500',
  Completed: 'bg-gray-400',
  Cancelled: 'bg-gray-400',
}

export function EventChooser({
  events,
  value,
  onChange,
}: {
  events: EventChoice[]
  value: string
  onChange: (eventId: string) => void
}) {
  const chosen = events.find((event) => event.id === value)

  return (
    <Dropdown
      align="left"
      panelClassName="w-[300px] max-w-[calc(100vw-24px)] overflow-hidden p-0"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label="Choose event"
          disabled={events.length === 0}
          title="This station is bound to one event — click to switch"
          className="select mt-0.5 inline-flex h-auto w-auto max-w-[240px] cursor-pointer items-center border-0 bg-transparent p-0 pr-8 text-left text-[22px] font-bold leading-tight tracking-tight text-ink focus:outline-none focus:ring-0 sm:max-w-[360px] lg:max-w-[480px]"
        >
          <span className="truncate">{chosen?.name ?? 'No events yet'}</span>
        </button>
      )}
    >
      {(close) => (
        <EventList
          events={events}
          value={value}
          onPick={(id) => {
            close()
            onChange(id)
          }}
        />
      )}
    </Dropdown>
  )
}

/** The panel: a search box over a scrolling list. */
function EventList({
  events,
  value,
  onPick,
}: {
  events: EventChoice[]
  value: string
  onPick: (eventId: string) => void
}) {
  const [term, setTerm] = useState('')

  const shown = useMemo(() => {
    const needle = term.trim().toLowerCase()
    if (!needle) return events
    return events.filter((event) => event.name.toLowerCase().includes(needle))
  }, [events, term])

  return (
    <div>
      <div className="border-b border-hair p-2">
        <div className="relative">
          <Icon
            name="hgi-search-01"
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            autoFocus
            aria-label="Search events"
            placeholder="Search events…"
            className="h-9 w-full rounded-lg bg-canvas pl-8 pr-2.5 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>
      </div>

      <div className="max-h-[280px] overflow-y-auto p-1.5">
        {shown.length === 0 ? (
          <div className="px-2.5 py-6 text-center text-[13px] text-muted">No events match.</div>
        ) : (
          shown.map((event) => {
            const on = event.id === value
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onPick(event.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px]',
                  on ? 'bg-brand-soft font-semibold text-brand' : 'font-medium text-ink hover:bg-line',
                )}
              >
                <Icon
                  name="hgi-tick-02"
                  size={14}
                  className={cn(on ? 'text-brand' : 'invisible')}
                />
                <span className="truncate">{event.name}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap pl-2 text-[11px] text-muted">
                  <span className="tnum">{event.when}</span>
                  <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[event.status])} />
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
