import { cn } from '@/lib/cn'
import { swatchClassOf } from '@/lib/seatSwatches'
import type { LandingSeatMap, LandingSeatRow } from '@/features/landing/types'

/** A seat; a row's swatch overrides the neutral fill (the palette is `!important`). */
const SEAT = 'shrink-0 rounded-[3px] bg-muted/30'

/**
 * The tickets section's seat map (US-PAGE-05): the stage, every seat row in
 * the colour of the ticket that sells it, and a key naming each ticket with its
 * rows and seats. Nothing is picked here — seats are chosen at checkout.
 *
 * Semantic tokens only, so it sits in any of the four templates in either
 * theme; `className` carries the template's own card styling. A room wider than
 * a phone scrolls sideways inside the block, never the page.
 */
export function SeatMapBlock({ seatMap, className }: { seatMap: LandingSeatMap; className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-[14px] font-semibold text-ink">Seat map</h3>
      <div role="img" aria-label={seatMap.summary} className="mt-4">
        <Stage />
        <div className="mt-3 overflow-x-auto pb-1">
          <div className="mx-auto flex w-max flex-col gap-[3px] sm:gap-1">
            {seatMap.rows.map((row) => (
              <SeatRow key={row.label} row={row} seats={seatMap.seatsPerRow} />
            ))}
          </div>
        </div>
      </div>
      <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[12px] text-muted">
        {seatMap.legend.map((entry) => (
          <li key={entry.swatch} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className={cn(SEAT, 'h-3 w-3', swatchClassOf(entry.swatch))} />
            {entry.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stage() {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 28" preserveAspectRatio="none" aria-hidden="true" className="h-5 w-full max-w-xs text-brand">
        <path
          d="M8 24 Q200 2 392 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* The left pad balances the tracking after the last letter, so the word sits centred. */}
      <span className="mt-1 pl-[0.3em] text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Stage</span>
    </div>
  )
}

/** One row, numbered on both sides as the venue numbers it. */
function SeatRow({ row, seats }: { row: LandingSeatRow; seats: number }) {
  const seat = cn(SEAT, 'h-2.5 w-2.5 sm:h-3 sm:w-3', swatchClassOf(row.swatch))
  return (
    <div className="flex items-center gap-[3px] sm:gap-1">
      <RowNumber label={row.label} />
      {Array.from({ length: seats }, (_, i) => (
        <span key={i} className={seat} />
      ))}
      <RowNumber label={row.label} />
    </div>
  )
}

function RowNumber({ label }: { label: string }) {
  return <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-muted tnum">{label}</span>
}
