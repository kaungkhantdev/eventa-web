import { cn } from '@/lib/cn'
import type { RecentRow } from '../overview.types'
import { PanelEmpty, SectionHeader } from './PanelChrome'

/** The latest registrations (US-DASH-12). */

const NONE_YET = 'No registrations yet.'

export function RecentRegistrationsPanel({ rows }: { rows: RecentRow[] }) {
  return (
    <section className="rounded-2xl bg-surface p-4 xl:col-span-3">
      <SectionHeader
        title="Recent Registrations"
        link={{ to: '/admin/registrations', label: 'View all' }}
      />

      {rows.length === 0 ? (
        <PanelEmpty>{NONE_YET}</PanelEmpty>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                <th className="pb-2 pr-3 font-semibold">Attendee</th>
                <th className="pb-2 pr-3 font-semibold">Event</th>
                <th className="pb-2 pr-3 font-semibold">Amount</th>
                <th className="pb-2 pr-3 font-semibold">Status</th>
                <th className="pb-2 text-right font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-dark dark:text-brand">
                        {r.initials}
                      </span>
                      <span className="font-medium text-ink">{r.name}</span>
                    </div>
                  </td>
                  <td className="pr-3 text-muted">{r.event}</td>
                  <td className="tnum pr-3 font-semibold text-ink">{r.amount}</td>
                  <td className="pr-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        r.statusTone,
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="tnum text-right text-muted">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
