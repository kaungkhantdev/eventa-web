import { cn } from '@/lib/cn'

/* Pill tabs (with optional count badge) and the segmented control. Both are
   controlled — the static kit toggled a `tab-active` class imperatively. */

export type PillTabItem<T extends string = string> = {
  value: T
  label: string
  count?: number
}

export function PillTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: PillTabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-surface p-1',
        className,
      )}
    >
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn('pilltab', it.value === value && 'tab-active')}
        >
          {it.label}
          {it.count !== undefined && <span className="pilltab-count tnum">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Underlined tabs (`.tab`), used inside detail pages. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: PillTabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-5 overflow-x-auto border-b border-hair', className)}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn('tab', it.value === value && 'tab-active')}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

/** Compact segmented control for chart ranges (Week / Month / Year). */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn('segmented', className)}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn(it.value === value && 'active')}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
