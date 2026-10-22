import { cn } from '@/lib/cn'
import { swatchClassOf } from '@/lib/seatSwatches'
import type { PaintOption } from '../eventSeating.mapper'

/**
 * "Paint seats with" on the wizard's Assign seats step (US-EVT-05): the ticket
 * type a click or a drag across the seat map gives the seats it touches — the
 * event's saved types, each in its seat colour, and "No ticket type".
 */
export function PaintPicker({
  options,
  value,
  onPick,
}: {
  options: PaintOption[]
  /** The picked option's value: a type's id, or `''` for "No ticket type". */
  value: string
  onPick: (value: string) => void
}) {
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Paint seats with
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value || 'none'} className="cursor-pointer">
            <input
              type="radio"
              name="paint-seats"
              value={option.value}
              className="peer sr-only"
              checked={value === option.value}
              onChange={() => onPick(option.value)}
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-hair bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-ink transition hover:border-brand/40 peer-checked:border-brand peer-checked:ring-1 peer-checked:ring-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
              <span
                aria-hidden="true"
                className={cn('h-3 w-3 shrink-0 rounded-[3px] bg-muted/30', swatchClassOf(option.swatch))}
              />
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
