import { num } from '@/lib/format'
import type { EventStats } from '../data/checkin'

/** The "Checked in" counter card — rate, progress bar and the on-site / late /
 *  remaining breakdown. */
export function CheckInStats({ stats }: { stats: EventStats }) {
  const pct = Math.round((stats.checked / stats.total) * 100)
  const remaining = Math.max(0, stats.total - stats.checked)

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Checked in</p>
        <span className="text-[13px] font-bold text-brand tnum">{pct}%</span>
      </div>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[26px] font-bold leading-none text-ink tnum">{num(stats.checked)}</span>
        <span className="text-[14px] text-muted">
          / <span className="tnum">{num(stats.total)}</span>
        </span>
      </p>
      <div className="mt-2.5 h-2 w-full rounded-full bg-line">
        <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted">
        <span>
          On-site <b className="text-ink tnum">{num(stats.onsite)}</b>
        </span>
        <span>
          Late <b className="text-red-500 tnum">{num(stats.late)}</b>
        </span>
        <span className="ml-auto">
          Remaining <b className="text-ink tnum">{num(remaining)}</b>
        </span>
      </div>
    </section>
  )
}
