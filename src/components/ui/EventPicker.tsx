import { useMemo } from 'react'
import {
  EVENT_CATALOG,
  CATALOG_BY_NAME,
  STATUS_DOT,
  type CatalogEvent,
} from '@/lib/eventCatalog'
import { cn } from '@/lib/cn'
import { SearchableSelect } from './SearchableSelect'
import type { ComboOption } from './comboFilter'

/* Searchable event picker — the shared `SearchableSelect` seeded from the
   EVENT_CATALOG, with the kit's own row detail: the date and a status dot.

   Controlled: `value` is the selected event name (or the `allLabel` sentinel
   for the leading "All events" option). Replaces a plain <select>. */

export type EventPickerProps = {
  value: string
  onChange: (value: string) => void
  /** Leading catch-all option (e.g. "All events"). Pass `false` for a required
   *  pick with no catch-all. (Note: `undefined` keeps the default label — JS
   *  default params only replace `undefined`, so use `false` to opt out.) */
  allLabel?: string | false
  /** Catalog to search; defaults to the full shared catalog. */
  options?: CatalogEvent[]
  /** Leading icon slug on the trigger. */
  icon?: string
  className?: string
  placeholder?: string
}

export function EventPicker({
  value,
  onChange,
  allLabel = 'All events',
  options = EVENT_CATALOG,
  icon = 'hgi-calendar-03',
  className,
  placeholder = 'Select event',
}: EventPickerProps) {
  // The date is searchable as well as shown: "jazz jul" is how somebody with
  // two runs of the same event tells them apart.
  const rows = useMemo<ComboOption[]>(() => {
    const list = options.map((event) => ({
      value: event.name,
      label: event.name,
      keywords: event.date,
    }))
    return allLabel ? [{ value: allLabel, label: allLabel }, ...list] : list
  }, [options, allLabel])

  const byName = useMemo(() => new Map(options.map((event) => [event.name, event])), [options])

  return (
    <SearchableSelect
      value={value || (allLabel || '')}
      onChange={onChange}
      options={rows}
      label={placeholder}
      noun="events"
      placeholder={placeholder}
      icon={icon}
      className={className}
      renderMeta={(option) => <EventMeta event={byName.get(option.value)} />}
    />
  )
}

function EventMeta({ event }: { event: CatalogEvent | undefined }) {
  if (!event) return null
  return (
    <>
      <span className="tnum">{event.date}</span>
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[event.status])} />
    </>
  )
}

export { CATALOG_BY_NAME }
