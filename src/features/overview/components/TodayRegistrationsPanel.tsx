import { Link } from 'react-router'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { TodayRegistrations } from '../overview.types'
import { CountBadge, PanelEmpty, SectionHeader } from './PanelChrome'

/**
 * Today's sign-ups (US-DASH-02). Markup ported from admin/home.html.
 *
 * The whole panel is absent — not empty, not zero — for someone who may not see
 * attendee personal data; `today` is null in that case and the page omits it.
 */

const REGISTRATIONS = '/admin/registrations'

export function TodayRegistrationsPanel({ today }: { today: TodayRegistrations }) {
  return (
    <section className="rounded-2xl bg-surface p-4">
      <SectionHeader
        title="Today's Registrations"
        badge={<CountBadge value={today.count} tone="brand" />}
        link={{ to: REGISTRATIONS, label: 'See all' }}
      />

      {today.emptyMessage ? (
        <PanelEmpty>{today.emptyMessage}</PanelEmpty>
      ) : (
        <div className="mt-3.5 space-y-3.5">
          {today.rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5">
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                  r.tint,
                )}
              >
                {r.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{r.name}</p>
                <p className="truncate text-[12px] text-muted">{r.detail}</p>
              </div>
              <span className="tnum shrink-0 text-[11px] text-muted">{r.time}</span>
            </div>
          ))}
        </div>
      )}

      <Link
        to={REGISTRATIONS}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-dark"
      >
        <Icon name="hgi-user-add-01" size={15} />
        View all registrations
      </Link>
    </section>
  )
}
