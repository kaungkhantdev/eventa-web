import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@/lib/cn'
import { chartColors, computeDomain, formatValue } from './chartUtils'

/* Vertical bar chart — the React port of the `type: 'bar'` branch of the static
   kit's shared chart (assets/reports-chart.js). Same dotted-value axis and hover
   tooltip pill as AreaChart, so the two read as one family. By default the last
   bar is the accent and the rest are a soft brand tint; hover promotes whichever
   bar is under the pointer. Colours come from CSS tokens, so dark mode is free. */

const W = 640
const PL = 44
const PR = 14
const PT = 24
const PB = 36

export type BarChartProps = {
  labels: string[]
  values: number[]
  prefix?: string
  suffix?: string
  format?: (value: number) => string
  /** Top of a zero-based axis. Ignored when `fit` is set. */
  max?: number
  fit?: boolean
  /** Render the hover tooltip pill. */
  showTooltip?: boolean
  /** Keep the final bar as the accent when nothing is hovered (source default). */
  highlightLast?: boolean
  height?: number
  className?: string
  ariaLabel?: string
}

export function BarChart({
  labels,
  values,
  prefix,
  suffix,
  format,
  max,
  fit,
  showTooltip = true,
  highlightLast = true,
  height = 280,
  className,
  ariaLabel,
}: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const n = values.length
  const H = height
  const plotW = W - PL - PR
  const plotH = H - PT - PB
  const floor = PT + plotH
  const fmt = { prefix, suffix, format }
  const dom = computeDomain(values, { fit, max, suffix })
  const span = dom.hi - dom.lo || 1

  const slot = plotW / (n || 1)
  const bw = Math.max(5, Math.min(slot * 0.62, 40))
  const rx = Math.min(bw / 2, 6)
  const centerFor = (i: number) => PL + slot * (i + 0.5)
  const yFor = (v: number) => PT + (1 - (v - dom.lo) / span) * plotH

  const gridlines = Array.from({ length: 5 }, (_, k) => {
    const val = dom.lo + (span * k) / 4
    return { y: yFor(val), label: formatValue(val, fmt) }
  })

  const emphasized = hover ?? (highlightLast ? n - 1 : -1)

  function onMove(e: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg || n === 0) return
    const rect = svg.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.max(0, Math.min(n - 1, Math.floor((mx - PL) / slot)))
    setHover(i)
  }

  const tipIndex = hover ?? (highlightLast ? n - 1 : null)
  const tipLeft = tipIndex != null ? Math.min(94, Math.max(6, (centerFor(tipIndex) / W) * 100)) : 0
  const tipTop = tipIndex != null ? (yFor(values[tipIndex]) / H) * 100 : 0

  return (
    <div className={cn('relative', className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel}
        style={{ height: 'auto', display: 'block', fontFamily: 'inherit' }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {gridlines.map((g, k) => (
          <g key={k}>
            <line x1={PL} y1={g.y} x2={W - PR} y2={g.y} stroke={chartColors.grid} strokeWidth={1} />
            <text
              x={PL - 10}
              y={g.y + 4}
              textAnchor="end"
              fontSize={12}
              fill={chartColors.axis}
              className="tnum"
            >
              {g.label}
            </text>
          </g>
        ))}

        {values.map((v, i) => {
          const y = yFor(v)
          const h = Math.max(2, floor - y)
          return (
            <rect
              key={i}
              x={centerFor(i) - bw / 2}
              y={y}
              width={bw}
              height={h}
              rx={rx}
              fill={chartColors.brand}
              fillOpacity={i === emphasized ? 1 : 0.25}
            />
          )
        })}

        {labels.map((lb, i) => (
          <text
            key={i}
            x={centerFor(i)}
            y={floor + 24}
            textAnchor="middle"
            fontSize={12}
            fill={chartColors.axis}
            className="tnum"
          >
            {lb}
          </text>
        ))}
      </svg>

      {showTooltip && tipIndex != null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] leading-tight shadow-lg"
          style={{
            left: `${tipLeft}%`,
            top: `${tipTop}%`,
            marginTop: -10,
            background: chartColors.tipBg,
            color: chartColors.tipFg,
          }}
        >
          <div className="opacity-60">{labels[tipIndex]}</div>
          <div className="font-bold tnum">{formatValue(values[tipIndex], fmt)}</div>
        </div>
      )}
    </div>
  )
}
