import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { SellingFastRow } from '../overview.types'
import { PanelEmpty, SectionHeader } from './PanelChrome'

/** Ticket types running low, scarcest first (US-DASH-11). */

const NOTHING_LOW = 'No tickets running low.'
const TIER_ICON = 'hgi-ticket-star'

export function SellingFastPanel({ rows }: { rows: SellingFastRow[] }) {
  return (
    <section className="rounded-2xl bg-surface p-4 xl:col-span-2">
      <SectionHeader title="Tickets Selling Fast" link={{ to: '/admin/tickets', label: 'Manage' }} />

      {rows.length === 0 ? (
        <PanelEmpty>{NOTHING_LOW}</PanelEmpty>
      ) : (
        <div className="mt-2">
          {rows.map((t, i) => (
            <div
              key={t.id}
              className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}
            >
              <span className={cn('grid h-10 w-10 place-items-center rounded-xl', t.iconTint)}>
                <Icon name={TIER_ICON} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{t.name}</p>
                <p className="truncate text-[11px] text-muted">{t.event}</p>
              </div>
              <span className={cn('tnum shrink-0 text-[13px] font-semibold', t.tone)}>
                {t.left}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
