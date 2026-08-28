import { DonutChart } from '@/components/ui'
import { cn } from '@/lib/cn'
import { num } from '@/lib/format'
import type { TierRow } from '../overview.types'
import { PanelEmptyPreview } from './PanelChrome'

/**
 * How registrations split across ticket types (US-DASH-10).
 *
 * The caller sets the width: this panel shares a row with the revenue trend,
 * and takes the whole row when the reader has no finance access and the trend
 * is not rendered at all.
 */

const NO_REGISTRATIONS = 'No registrations yet.'
const NOTHING_TO_SPLIT = 'Once tickets sell, the split by type shows here.'

interface TierMixPanelProps {
  tiers: TierRow[]
  total: string
  className?: string
}

export function TierMixPanel({ tiers, total, className }: TierMixPanelProps) {
  return (
    // `flex flex-col`: this card shares a row with the revenue chart, which is
    // much taller, so the grid stretches this one. Left at the default the
    // empty state pins itself under the heading and the borrowed height hangs
    // below it.
    <section className={cn('flex flex-col rounded-2xl bg-surface p-4', className)}>
      <h2 className="text-[15px] font-bold tracking-tight">Registrations by Ticket Type</h2>
      <p className="mt-0.5 text-[12px] text-muted">Share of total registrations</p>

      {tiers.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center">
          <PanelEmptyPreview preview="ring" description={NOTHING_TO_SPLIT}>
            {NO_REGISTRATIONS}
          </PanelEmptyPreview>
        </div>
      ) : (
        <>
          <div className="mt-2 flex justify-center">
            <DonutChart
              data={tiers.map((t) => ({ value: t.percent, color: t.color, label: t.name }))}
              size={160}
              centerLabel={total}
              centerSub="total registrations"
              ariaLabel="Registrations by ticket type"
            />
          </div>
          <div className="mt-4 space-y-3">
            {tiers.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3.5 w-3.5 rounded" style={{ background: t.color }} />
                  <div className="leading-tight">
                    <p className="text-[13px] font-semibold text-ink">{t.name}</p>
                    <p className="tnum text-[11px] text-muted">{num(t.count)} registrations</p>
                  </div>
                </div>
                <span className="tnum text-[15px] font-bold">{t.percent}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
