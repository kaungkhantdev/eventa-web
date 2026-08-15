import { useLoaderData, useRouteLoaderData } from 'react-router'
import { ButtonLink, HeaderUser, Icon, PageFooter, PageHeader } from '@/components/ui'
import { ADMIN_ROUTE_ID } from '@/app/loaders'
import type { Me } from '@/features/auth/types'
import { cn } from '@/lib/cn'
import { RecentRegistrationsPanel } from '../components/RecentRegistrationsPanel'
import { RevenuePanel } from '../components/RevenuePanel'
import { SellingFastPanel } from '../components/SellingFastPanel'
import { TierMixPanel } from '../components/TierMixPanel'
import type { DashboardData } from '../dashboard.routes'
import type { StatCard } from '../overview.types'

/**
 * The analytics dashboard (US-DASH-08..13). Layout ported from
 * admin/dashboard.html.
 *
 * Every figure describes one period, fetched in one call, so the KPI cards, the
 * trend total and the ticket-type mix cannot disagree about what "this year"
 * meant. The revenue section is absent — not blank — for a reader without
 * finance access.
 */
export default function DashboardPage() {
  const { cards, revenue, range, tiers, totalRegistrations, sellingFast, recent } =
    useLoaderData() as DashboardData
  const me = (useRouteLoaderData(ADMIN_ROUTE_ID) as { me: Me } | undefined)?.me ?? null

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={subtitleFor(me)}
        actions={
          <>
            <ButtonLink to="/admin/event-form" variant="primary" className="shrink-0">
              <Icon name="hgi-calendar-add-01" size={16} />
              <span className="hidden sm:inline">New event</span>
              <span className="sm:hidden">New</span>
            </ButtonLink>
            <HeaderUser />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c, i) => (
          <StatTile key={c.id} card={c} last={i === cards.length - 1} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        {revenue && <RevenuePanel revenue={revenue} range={range} />}
        <TierMixPanel
          tiers={tiers}
          total={totalRegistrations}
          className={revenue ? 'xl:col-span-2' : 'xl:col-span-5'}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <SellingFastPanel rows={sellingFast} />
        <RecentRegistrationsPanel rows={recent} />
      </div>

      <PageFooter />
    </>
  )
}

function subtitleFor(me: Me | null): string {
  const greeting = me ? `Welcome back, ${me.name}` : 'Welcome back'
  return `${greeting} — here's what's happening with your events.`
}

/** The last tile widens on a two-column grid, so an odd count still fills it. */
function StatTile({ card, last }: { card: StatCard; last: boolean }) {
  return (
    <div className={cn('rounded-2xl bg-surface p-3.5', last && 'sm:col-span-2 xl:col-span-1')}>
      <div className="flex items-center gap-1.5 text-[12px] text-muted">
        <Icon name={card.icon} size={16} />
        {card.label}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <p className="tnum text-[22px] font-bold tracking-tight">{card.value}</p>
        <span
          className={cn('flex items-center gap-0.5 text-[12px] font-semibold', card.delta.tone)}
        >
          {card.delta.icon && <Icon name={card.delta.icon} size={13} />}
          {card.delta.text}
        </span>
      </div>
    </div>
  )
}
