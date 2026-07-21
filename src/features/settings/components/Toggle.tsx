import { cn } from '@/lib/cn'

/* The pill toggle switch used across the settings pages (payment methods,
   checkout preferences, role permissions). The static kit toggled `bg-brand`/
   `bg-line` and the knob's `translate-x-4` imperatively; here it is controlled.

   Payments switches animate with `transition`, the role-permission switches with
   `transition-transform` — matched verbatim via the `transition` prop. */
export function Toggle({
  on,
  onChange,
  transition = 'transition',
  className,
}: {
  on: boolean
  onChange: (next: boolean) => void
  transition?: 'transition' | 'transition-transform'
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5',
        on ? 'bg-brand' : 'bg-line',
        className,
      )}
      aria-pressed={on}
    >
      <span
        className={cn('h-4 w-4 rounded-full bg-white shadow', transition, on && 'translate-x-4')}
      />
    </button>
  )
}
