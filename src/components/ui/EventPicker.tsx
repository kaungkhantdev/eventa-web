import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  EVENT_CATALOG,
  CATALOG_BY_NAME,
  STATUS_DOT,
  type CatalogEvent,
} from '@/lib/eventCatalog'
import { cn } from '@/lib/cn'

/* Searchable event picker — a type-to-filter combobox seeded from the shared
   EVENT_CATALOG. Faithful React port of the static kit's shell.js enhancer:
   a trigger styled like the select, a popup with a search box, rows showing a
   tick + name + date + status dot, keyboard navigation and an empty state.

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

type Row = { label: string; isAll: boolean; meta?: CatalogEvent }

export function EventPicker({
  value,
  onChange,
  allLabel = 'All events',
  options = EVENT_CATALOG,
  icon = 'hgi-calendar-03',
  className,
  placeholder = 'Select event',
}: EventPickerProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const rows: Row[] = useMemo(() => {
    const list: Row[] = options.map((e) => ({ label: e.name, isAll: false, meta: e }))
    return allLabel ? [{ label: allLabel, isAll: true }, ...list] : list
  }, [options, allLabel])

  const label = value || placeholder

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn('select inline-flex items-center pl-9 text-left', className)}
      >
        <i
          className={cn(
            'hgi-stroke',
            icon,
            'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-brand',
          )}
        />
        <span className="truncate">{label}</span>
      </button>
      {open && (
        <EventPickerPopup
          anchor={triggerRef}
          rows={rows}
          value={value}
          onClose={() => setOpen(false)}
          onPick={(v) => {
            onChange(v)
            setOpen(false)
            triggerRef.current?.focus()
          }}
        />
      )}
    </>
  )
}

function EventPickerPopup({
  anchor,
  rows,
  value,
  onClose,
  onPick,
}: {
  anchor: React.RefObject<HTMLButtonElement | null>
  rows: Row[]
  value: string
  onClose: () => void
  onPick: (value: string) => void
}) {
  const popRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  const view = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter((r) => !s || r.label.toLowerCase().includes(s))
  }, [rows, q])

  const selectedLabel = value || (rows.find((r) => r.isAll)?.label ?? '')

  // Where the keyboard is, once the list is filtered — the current selection,
  // or the first row. Adjusted during render rather than in an effect, which
  // would paint the old highlight for a frame after every keystroke.
  const defaultActive = () => {
    const i = view.findIndex((r) => r.label === selectedLabel)
    return i >= 0 ? i : view.length ? 0 : -1
  }
  const [active, setActive] = useState(defaultActive)
  const [seen, setSeen] = useState(view)
  if (view !== seen) {
    setSeen(view)
    setActive(defaultActive())
  }

  // Position the popup under the trigger, flipping up if it would overflow.
  useLayoutEffect(() => {
    const el = anchor.current
    const pop = popRef.current
    if (!el || !pop) return
    const r = el.getBoundingClientRect()
    let left = r.left
    if (left + 300 > window.innerWidth - 12) left = window.innerWidth - 12 - 300
    let top = r.bottom + 6
    if (top + 340 > window.innerHeight && r.top - 340 > 0) top = r.top - 6 - pop.offsetHeight
    setPos({ left: Math.max(12, left), top })
  }, [anchor])

  // Close on outside click, Escape, resize.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        !popRef.current?.contains(e.target as Node) &&
        !anchor.current?.contains(e.target as Node)
      )
        onClose()
    }
    const onResize = () => onClose()
    document.addEventListener('mousedown', onDown)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('resize', onResize)
    }
  }, [anchor, onClose])

  const scrollActiveIntoView = (i: number) => {
    const el = listRef.current?.querySelectorAll('.ep-row')[i] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => {
        const n = Math.min(view.length - 1, a + 1)
        scrollActiveIntoView(n)
        return n
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => {
        const n = Math.max(0, a - 1)
        scrollActiveIntoView(n)
        return n
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (view[active]) onPick(view[active]!.label)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return createPortal(
    <div
      ref={popRef}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
      className="fixed z-[70] w-[300px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-hair bg-surface shadow-xl"
    >
      <div className="border-b border-hair p-2">
        <div className="relative">
          <i className="hgi-stroke hgi-search-01 pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-muted" />
          <input
            autoFocus
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search events…"
            className="h-9 w-full rounded-lg bg-canvas pl-8 pr-2.5 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>
      </div>
      <div ref={listRef} className="max-h-[280px] overflow-y-auto p-1.5">
        {view.length ? (
          view.map((r, i) => {
            const on = r.label === selectedLabel
            const dot = r.meta ? STATUS_DOT[r.meta.status] : 'bg-gray-400'
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => onPick(r.label)}
                onMouseMove={() => setActive(i)}
                className={cn(
                  'ep-row flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px]',
                  on ? 'bg-brand-soft font-semibold text-brand' : 'font-medium text-ink hover:bg-line',
                  i === active && 'ring-2 ring-inset ring-brand/40',
                )}
              >
                <i className={cn('hgi-stroke hgi-tick-02 text-[14px]', on ? 'text-brand' : 'invisible')} />
                <span className="truncate">{r.label}</span>
                {r.meta && (
                  <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap pl-2 text-[11px] text-muted">
                    <span className="tnum">{r.meta.date}</span>
                    <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
                  </span>
                )}
              </button>
            )
          })
        ) : (
          <div className="px-2.5 py-6 text-center text-[13px] text-muted">No events match.</div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export { CATALOG_BY_NAME }
