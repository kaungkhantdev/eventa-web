import { useId, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@/lib/cn'
import {
  AREA_FILL_TOP_OPACITY,
  chartColors,
  computeDomain,
  formatValue,
  smoothPath,
  type Point,
} from './chartUtils'

/* Smoothed area/line chart with a soft gradient fill, dotted-value axis, and a
   hover tooltip pill — the React port of the revenue chart shared by
   admin/dashboard.html and admin/reports.html.

   Everything lives in one responsive SVG (viewBox 0 0 640 H, width:100%), so it
   scales to any container. The tooltip is an HTML pill layered over the SVG and
   positioned in percentages of the plot, which keeps it crisp at any size. Colours
   come from CSS tokens, so light/dark flips with no JS. */

// plot geometry, matching the static revenue chart (640×280 with these insets)
const W = 640
const PL = 44
const PR = 14
const PT = 24
const PB = 36

export type AreaChartProps = {
  labels: string[]
  values: number[]
  /** Unit prefix for axis + tooltip, e.g. '฿'. */
  prefix?: string
  /** Unit suffix, e.g. 'k' or '%'. */
  suffix?: string
  /** Full label override; wins over prefix/suffix. */
  format?: (value: number) => string
  /** Top of a zero-based axis. Ignored when `fit` is set. */
  max?: number
  /** Fit the axis to the data band instead of 0→max (for narrow rate bands). */
  fit?: boolean
  /** Draw the gradient area under the line. `false` gives a bare line chart. */
  fill?: boolean
  /** Render the tooltip pill (the dot marker always shows). */
  showTooltip?: boolean
  /** SVG height in user units; the width is fixed at 640 and scales down. */
  height?: number
  className?: string
  ariaLabel?: string
}

export function AreaChart({
  labels,
  values,
  prefix,
  suffix,
  format,
  max,
  fit,
  fill = true,
  showTooltip = true,
  height = 280,
  className,
  ariaLabel,
}: AreaChartProps) {
  const gid = useId()
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

  const xFor = (i: number) => (n === 1 ? PL + plotW / 2 : PL + (i / (n - 1)) * plotW)
  const yFor = (v: number) => PT + (1 - (v - dom.lo) / span) * plotH

  const pts: Point[] = values.map((v, i) => [xFor(i), yFor(v)])
  const line = smoothPath(pts)
  const area = `${line} L ${xFor(n - 1)} ${floor} L ${xFor(0)} ${floor} Z`

  // 5 horizontal gridlines with value labels, bottom-up
  const gridlines = Array.from({ length: 5 }, (_, k) => {
    const val = dom.lo + (span * k) / 4
    return { y: yFor(val), label: formatValue(val, fmt) }
  })

  const step = n > 1 ? plotW / (n - 1) : plotW
  const active = hover ?? n - 1
  const ax = xFor(active)
  const ay = yFor(values[active])

  function onMove(e: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg || n === 0) return
    const rect = svg.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.max(0, Math.min(n - 1, Math.round((mx - PL) / step)))
    setHover(i)
  }

  // tooltip position as a percentage of the plotted box (SVG scales uniformly)
  const tipLeft = Math.min(94, Math.max(6, (ax / W) * 100))
  const tipTop = (ay / H) * 100

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
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={chartColors.brand} stopOpacity={AREA_FILL_TOP_OPACITY} />
            <stop offset="100%" stopColor={chartColors.brand} stopOpacity={0} />
          </linearGradient>
        </defs>

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

        {/* An empty series still draws its axis — a period that earned nothing
            is a real answer — but not a line through no points: `smoothPath`
            has nothing to start with, and the browser rejects the path. */}
        {n > 0 && (
          <>
            {fill && <path d={area} fill={`url(#${gid})`} />}
            <path
              d={line}
              fill="none"
              stroke={chartColors.brand}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {labels.map((lb, i) => (
          <text
            key={i}
            x={xFor(i)}
            y={floor + 24}
            textAnchor="middle"
            fontSize={12}
            fill={chartColors.axis}
            className="tnum"
          >
            {lb}
          </text>
        ))}

        {n > 0 && (
          <>
            <line
              x1={ax}
              y1={PT}
              x2={ax}
              y2={floor}
              stroke={chartColors.brand}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.4}
            />
            <circle
              cx={ax}
              cy={ay}
              r={6}
              fill={chartColors.brand}
              stroke={chartColors.ring}
              strokeWidth={2.5}
            />
          </>
        )}
      </svg>

      {showTooltip && n > 0 && (
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
          <div className="opacity-60">{labels[active]}</div>
          <div className="font-bold tnum">{formatValue(values[active], fmt)}</div>
        </div>
      )}
    </div>
  )
}
