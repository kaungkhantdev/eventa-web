import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/* Ring / donut chart with an optional centre label — the React port of the
   "Registrations by Ticket Type" donut in dashboard.html and reports.html.

   Geometry is ported verbatim: a 42×42 viewBox, R = 15.915 (so the circumference
   is ~100 and each segment's length is just its percentage), round caps, a small
   gap between segments, and stroke-dashoffset "25 - start" to seat the first
   segment at 12 o'clock. Segment colours are passed in; the centre is an HTML
   overlay so the total renders with crisp tabular-nums type. */

const R = 15.915
const GAP = 2.2
const SW = 4.5

export type DonutSegment = {
  label?: string
  value: number
  /** Any CSS colour — the source uses the brand tint ramp. */
  color: string
}

export type DonutChartProps = {
  data: DonutSegment[]
  /** Box size in px (the source uses 160 = h-40 w-40). */
  size?: number
  /** Ring thickness in viewBox units. */
  thickness?: number
  /** Gap between segments in viewBox units. */
  gap?: number
  /** Big centre value, e.g. a formatted total. */
  centerLabel?: ReactNode
  /** Small caption under the centre value. */
  centerSub?: ReactNode
  className?: string
  ariaLabel?: string
}

export function DonutChart({
  data,
  size = 160,
  thickness = SW,
  gap = GAP,
  centerLabel,
  centerSub,
  className,
  ariaLabel,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1

  // Each arc starts where the ones before it ended. Worked out up front rather
  // than by mutating a counter inside the map: reassigning a variable while
  // rendering is exactly what breaks when React re-runs a render.
  const offsets = data.reduce<number[]>(
    (running, d) => [...running, running[running.length - 1]! + (d.value / total) * 100],
    [0],
  )

  const arcs = data.map((d, i) => {
    const len = Math.max((d.value / total) * 100 - gap, 0.4)
    return (
      <circle
        key={i}
        cx={21}
        cy={21}
        r={R}
        fill="none"
        stroke={d.color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={`${len} ${100 - len}`}
        strokeDashoffset={25 - offsets[i]!}
      />
    )
  })

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ height: size, width: size }}
    >
      <svg
        viewBox="0 0 42 42"
        className="h-full w-full"
        role="img"
        aria-label={ariaLabel}
        style={{ transform: 'rotate(0deg)' }}
      >
        {arcs}
      </svg>
      {(centerLabel != null || centerSub != null) && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            {centerLabel != null && (
              <p className="text-[24px] font-bold leading-none tracking-tight text-ink tnum">
                {centerLabel}
              </p>
            )}
            {centerSub != null && <p className="mt-1 text-[11px] text-muted">{centerSub}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
