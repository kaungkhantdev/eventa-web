import { cn } from '@/lib/cn'

/** The kit's `.demo-toggle` pill switch, ported to a controlled component.
 *  Snaps the knob between the off (bg-line) and on (bg-brand) states. */
export function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={cn(
        'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5',
        checked ? 'bg-brand' : 'bg-line',
      )}
    >
      <span className={cn('h-4 w-4 rounded-full bg-white shadow', checked && 'translate-x-4')} />
    </button>
  )
}
