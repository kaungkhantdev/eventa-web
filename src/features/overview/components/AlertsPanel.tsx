import { Link } from 'react-router'
import { Icon, PanelEmptyPreview } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { AlertRow } from '../overview.types'
import { SectionHeader } from './PanelChrome'

/**
 * What needs acting on (US-DASH-06).
 *
 * Every row is a link out: home never resolves anything, and the module that
 * owns the fix is the one that enforces who may make it. The API decides what
 * appears — an alert about money is simply absent for someone without finance
 * access, rather than shown and refused.
 */
const NOTHING_WRONG =
  "We'll flag failed payments, cancellations and check-in problems here."

export function AlertsPanel({ alerts, emptyMessage }: { alerts: AlertRow[]; emptyMessage: string }) {
  return (
    <section className="rounded-2xl bg-surface p-4 xl:col-span-1">
      <SectionHeader
        title="Alerts"
        link={{ to: '/admin/notifications', label: 'See all' }}
      />

      {alerts.length === 0 ? (
        <PanelEmptyPreview preview="alerts" description={NOTHING_WRONG}>
          {emptyMessage}
        </PanelEmptyPreview>
      ) : (
        <div className="mt-3.5 space-y-3.5">
          {alerts.map((a) => (
            <Link key={a.id} to={a.to} className="flex items-start gap-2.5 group">
              <Icon name={a.icon} size={18} className={cn('mt-0.5 shrink-0', a.tone)} />
              <p className="text-[13px] leading-snug text-ink group-hover:underline">{a.text}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
