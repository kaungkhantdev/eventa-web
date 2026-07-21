import { useId } from 'react'
import { cn } from '@/lib/cn'
import { smoothPath, type Point } from './chartUtils'

/* Compact inline trend line — no axes, no labels, no tooltip. Sits next to a KPI
   number to show its recent direction. Uses the same Catmull-Rom curve as the big
   charts so the whole kit shares one line treatment. The colour defaults to the
   brand token but accepts any CSS colour (pass `currentColor` to inherit a red /
   green trend colour from the surrounding text). */

export type SparklineProps = {
  values: number[]
  /** viewBox width in user units. */
  width?: number
  /** viewBox height in user units. */
  height?: number
  /** Line colour; defaults to the brand token, accepts `currentColor`. */
  color?: string
  /** Draw a faint area under the line. */
  fill?: boolean
  /** Mark the final point with a dot. */
  showDot?: boolean
  strokeWidth?: number
  className?: string
  ariaLabel?: string
}

export function Sparkline({
  values,
  width = 100,
  height = 32,
  color = 'var(--color-brand)',
  fill = false,
  showDot = false,
  strokeWidth = 2,
  className,
  ariaLabel,
}: SparklineProps) {
  const gid = useId()
  const n = values.length
  const pad = 2
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1

  const xFor = (i: number) =>
    n === 1 ? width / 2 : pad + (i / (n - 1)) * (width - pad * 2)
  const yFor = (v: number) => pad + (1 - (v - lo) / span) * (height - pad * 2)

  const pts: Point[] = values.map((v, i) => [xFor(i), yFor(v)])
  const line = smoothPath(pts)
  const area = `${line} L ${xFor(n - 1)} ${height - pad} L ${xFor(0)} ${height - pad} Z`
  const last = pts[n - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      className={cn('block', className)}
      style={{ color }}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.24} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {showDot && last && (
        <circle cx={last[0]} cy={last[1]} r={2.5} fill="currentColor" vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  )
}
