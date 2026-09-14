import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { filterOptions, type ComboOption } from './comboFilter'

/* A type-to-filter combobox, in the shape the static kit's shell.js enhancer
   draws: a trigger styled like `.select`, a popup with a search box, rows with
   a tick and an optional right-hand detail, keyboard navigation and an empty
   state.

   The popup is rendered through a portal, which is not decoration: these sit
   inside `overflow-x-auto` table wrappers and `overflow-y-auto` panels, and an
   absolutely-positioned popup would be clipped by both. */

/** The popup's fixed width, as the kit sizes it — and what the flip maths uses. */
const POPUP_WIDTH = 300
const POPUP_MAX_HEIGHT = 340
/** Kept clear of the viewport edge so the popup never touches the frame. */
const EDGE_GAP = 12
const TRIGGER_GAP = 6

export interface SearchableSelectProps {
  /** The selected option's `value`. */
  value: string
  onChange: (value: string) => void
  options: readonly ComboOption[]
  /** Accessible name for the trigger — a picker with no name is unusable. */
  label: string
  /** What is being searched: "roles", "events". Names the box and the empty state. */
  noun?: string
  /** Shown on the trigger when nothing is selected. */
  placeholder?: string
  /** Leading icon slug on the trigger. Positioned against the caller's `relative`. */
  icon?: string
  disabled?: boolean
  className?: string
  /** Right-hand detail for a row — a date, a status dot. */
  renderMeta?: (option: ComboOption) => ReactNode
  /** Ties a <Label htmlFor> to the trigger, the way it tied to the <select>. */
  id?: string
}

export function SearchableSelect({
  value,
  onChange,
  options,
  label,
  noun = 'options',
  placeholder = 'Select',
  icon,
  disabled = false,
  className,
  renderMeta,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selected = options.find((option) => option.value === value)

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((was) => !was)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected ? `${label}: ${selected.label}` : label}
        className={cn(
          'select inline-flex items-center text-left disabled:opacity-60',
          icon && 'pl-9',
          className,
        )}
      >
        {icon && (
          <i
            className={cn(
              'hgi-stroke',
              icon,
              'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-brand',
            )}
          />
        )}
        <span className="truncate">{selected?.label ?? placeholder}</span>
      </button>
      {open && (
        <SearchPopup
          anchor={triggerRef}
          options={options}
          value={value}
          noun={noun}
          renderMeta={renderMeta}
          onClose={() => setOpen(false)}
          onPick={(picked) => {
            onChange(picked)
            setOpen(false)
            triggerRef.current?.focus()
          }}
        />
      )}
    </>
  )
}

function SearchPopup({
  anchor,
  options,
  value,
  noun,
  renderMeta,
  onClose,
  onPick,
}: {
  anchor: React.RefObject<HTMLButtonElement | null>
  options: readonly ComboOption[]
  value: string
  noun: string
  renderMeta?: (option: ComboOption) => ReactNode
  onClose: () => void
  onPick: (value: string) => void
}) {
  const popRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [term, setTerm] = useState('')
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  const view = filterOptions(options, term)

  // Where the keyboard is, once the list is filtered — the current selection,
  // or the first row. Adjusted during render rather than in an effect, which
  // would paint the old highlight for a frame after every keystroke.
  const defaultActive = () => {
    const at = view.findIndex((option) => option.value === value)
    if (at >= 0) return at
    return view.length ? 0 : -1
  }
  const [active, setActive] = useState(defaultActive)
  const [seen, setSeen] = useState(term)
  if (term !== seen) {
    setSeen(term)
    setActive(defaultActive())
  }

  // Position the popup under the trigger, flipping up if it would overflow.
  useLayoutEffect(() => {
    const trigger = anchor.current
    const pop = popRef.current
    if (!trigger || !pop) return
    const box = trigger.getBoundingClientRect()
    let left = box.left
    if (left + POPUP_WIDTH > window.innerWidth - EDGE_GAP) {
      left = window.innerWidth - EDGE_GAP - POPUP_WIDTH
    }
    let top = box.bottom + TRIGGER_GAP
    if (top + POPUP_MAX_HEIGHT > window.innerHeight && box.top - POPUP_MAX_HEIGHT > 0) {
      top = box.top - TRIGGER_GAP - pop.offsetHeight
    }
    setPos({ left: Math.max(EDGE_GAP, left), top })
  }, [anchor])

  // Close on outside click, Escape, resize.
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!popRef.current?.contains(target) && !anchor.current?.contains(target)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('resize', onClose)
    }
  }, [anchor, onClose])

  const showRow = (index: number) => {
    const row = listRef.current?.querySelectorAll('[data-combo-row]')[index]
    ;(row as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' })
  }

  const move = (by: number) =>
    setActive((at) => {
      const next = Math.min(view.length - 1, Math.max(0, at + by))
      showRow(next)
      return next
    })

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const picked = view[active]
      if (picked) onPick(picked.value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return createPortal(
    <div
      ref={popRef}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: POPUP_WIDTH }}
      className="fixed z-[70] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-hair bg-surface shadow-xl"
    >
      <div className="border-b border-hair p-2">
        <div className="relative">
          <i className="hgi-stroke hgi-search-01 pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-muted" />
          <input
            autoFocus
            type="text"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={onKeyDown}
            aria-label={`Search ${noun}`}
            placeholder={`Search ${noun}…`}
            className="h-9 w-full rounded-lg bg-canvas pl-8 pr-2.5 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>
      </div>
      <div ref={listRef} role="listbox" className="max-h-[280px] overflow-y-auto p-1.5">
        {view.length ? (
          view.map((option, index) => (
            <Row
              key={option.value}
              option={option}
              selected={option.value === value}
              active={index === active}
              meta={renderMeta?.(option)}
              onHover={() => setActive(index)}
              onPick={() => onPick(option.value)}
            />
          ))
        ) : (
          <div className="px-2.5 py-6 text-center text-[13px] text-muted">No {noun} match.</div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function Row({
  option,
  selected,
  active,
  meta,
  onHover,
  onPick,
}: {
  option: ComboOption
  selected: boolean
  active: boolean
  meta: ReactNode
  onHover: () => void
  onPick: () => void
}) {
  return (
    <button
      data-combo-row
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onPick}
      onMouseMove={onHover}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px]',
        selected ? 'bg-brand-soft font-semibold text-brand' : 'font-medium text-ink hover:bg-line',
        active && 'ring-2 ring-inset ring-brand/40',
      )}
    >
      <i className={cn('hgi-stroke hgi-tick-02 text-[14px]', selected ? 'text-brand' : 'invisible')} />
      <span className="truncate">{option.label}</span>
      {meta && (
        <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap pl-2 text-[11px] text-muted">
          {meta}
        </span>
      )}
    </button>
  )
}
