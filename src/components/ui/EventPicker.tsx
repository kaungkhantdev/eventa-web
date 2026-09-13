import { useMemo } from 'react'
import { EVENT_CATALOG, CATALOG_BY_NAME, STATUS_DOT } from '@/lib/eventCatalog'
import { cn } from '@/lib/cn'
import { SearchableSelect } from './SearchableSelect'
import { eventRows, eventValue, type PickerEvent } from './eventPickerRows'
import type { ComboOption } from './comboFilter'

/* Searchable event picker — the shared `SearchableSelect` with the kit's own
   row detail: the date and a status dot. Replaces a plain <select>.

   Controlled. `value` is whatever the chosen row reports: the event's id where
   the caller passes one, otherwise its name (how the demo catalog is keyed). */

export type EventPickerProps = {
  value: string
  onChange: (value: string) => void
  /** Leading catch-all option (e.g. "All events"). Pass `false` for a required
   *  pick with no catch-all. (Note: `undefined` keeps the default label — JS
   *  default params only replace `undefined`, so use `false` to opt out.) */
  allLabel?: string | false
  /** What choosing the catch-all reports. Defaults to the label; a URL-backed
   *  filter passes '' so `?eventId=` drops out of the address. */
  allValue?: string
  /** Events to offer; defaults to the shared demo catalog. */
  options?: readonly PickerEvent[]
  /** Leading icon slug on the trigger. */
  icon?: string
  className?: string
  placeholder?: string
  /** Names the field for a screen reader; the selected event is appended. */
  label?: string
  /** Submits with a form. Without it the picker holds no value a form can read. */
  name?: string
  disabled?: boolean
  /** Ties a <Label htmlFor> to the trigger, the way it tied to the <select>. */
  id?: string
}

export function EventPicker({
  value,
  onChange,
  allLabel = 'All events',
  allValue,
  options = EVENT_CATALOG,
  icon = 'hgi-calendar-03',
  className,
  placeholder = 'Select event',
  label = 'Event',
  name,
  disabled,
  id,
}: EventPickerProps) {
  const rows = useMemo<ComboOption[]>(
    () => eventRows(options, allLabel, allValue),
    [options, allLabel, allValue],
  )
  const byValue = useMemo(
    () => new Map(options.map((event) => [eventValue(event), event])),
    [options],
  )

  // An empty value selects the catch-all where there is one: a URL filter
  // stores '' for "no event chosen", the demo pages store the label itself.
  const catchAll = allLabel === false ? '' : (allValue ?? allLabel)

  return (
    <>
      <SearchableSelect
        value={value || catchAll}
        onChange={onChange}
        options={rows}
        label={label}
        noun="events"
        placeholder={placeholder}
        icon={icon}
        className={className}
        disabled={disabled}
        id={id}
        renderMeta={(option) => <EventMeta event={byValue.get(option.value)} />}
      />
      {/* The trigger is a <button>, so it carries nothing a <form> can read.
          Panels submit their event by field name, so the value has to exist in
          the form as well as in React state. */}
      {name && <input type="hidden" name={name} value={value} />}
    </>
  )
}

function EventMeta({ event }: { event: PickerEvent | undefined }) {
  if (!event) return null
  return (
    <>
      {event.date && <span className="tnum">{event.date}</span>}
      {event.status && (
        <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[event.status])} />
      )}
    </>
  )
}

export { CATALOG_BY_NAME }
