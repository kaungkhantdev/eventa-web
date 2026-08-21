import { useSearchParams } from 'react-router'
import { AreaChart, Icon, Segmented } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { RevenueChart, RevenueRange } from '../overview.types'

/**
 * The revenue trend with its Week / Month / Year toggle (US-DASH-09).
 *
 * The toggle writes the range into the URL and the route's loader fetches that
 * period — the page never re-slices data it already holds, because the API is
 * the one that knows what "last week" earned. Navigating rather than reloading
 * keeps the rest of the screen mounted.
 */

const RANGES: { value: RevenueRange; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

export function RevenuePanel({ revenue, range }: { revenue: RevenueChart; range: RevenueRange }) {
  const [params, setParams] = useSearchParams()

  const choose = (value: RevenueRange) => {
    const next = new URLSearchParams(params)
    next.set('range', value)
    setParams(next)
  }

  return (
    <section className="rounded-2xl bg-surface p-4 xl:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight">Revenue Overview</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="tnum text-[24px] font-extrabold tracking-tight">{revenue.total}</span>
            <span
              className={cn(
                'flex items-center gap-0.5 text-[13px] font-semibold',
                revenue.delta.tone,
              )}
            >
              {revenue.delta.icon && <Icon name={revenue.delta.icon} size={13} />}
              {revenue.delta.text}
            </span>
            <span className="text-[12px] text-muted">vs previous period</span>
          </div>
        </div>
        <Segmented items={RANGES} value={range} onChange={choose} />
      </div>
      <div className="mt-2">
        <AreaChart
          labels={revenue.labels}
          values={revenue.values}
          max={revenue.max}
          prefix="฿"
          suffix="k"
          ariaLabel="Revenue overview"
        />
      </div>
    </section>
  )
}
