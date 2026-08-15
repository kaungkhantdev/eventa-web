import { pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import {
  countLabel,
  toRecentRow,
  toRevenueChart,
  toSellingFastRow,
  toStatCards,
  toTierRows,
} from './dashboard.mapper'
import { overviewApi } from './overview.api'
import type {
  RecentRow,
  RevenueChart,
  RevenueRange,
  SellingFastRow,
  StatCard,
  TierRow,
} from './overview.types'

/** The analytics dashboard (US-DASH-08..13). It only ever reads. */

export interface DashboardData {
  cards: StatCard[]
  /** Null without finance access — the section is not rendered at all. */
  revenue: RevenueChart | null
  range: RevenueRange
  tiers: TierRow[]
  /** The donut's centre — the same figure as the registrations card. */
  totalRegistrations: string
  sellingFast: SellingFastRow[]
  recent: RecentRow[]
}

const DEFAULT_RANGE: RevenueRange = 'year'
const RANGES: readonly string[] = ['week', 'month', 'year']

/**
 * Which slice of time the page is showing.
 *
 * Read from the URL rather than component state, so the range survives a
 * reload, a share and the back button — and so the loader can ask the API for
 * that period instead of the page re-slicing what it already has.
 */
export function rangeOf(params: URLSearchParams): RevenueRange {
  const asked = params.get('range')
  return asked !== null && RANGES.includes(asked) ? (asked as RevenueRange) : DEFAULT_RANGE
}

export const dashboardRoute = {
  loader: pageData(async ({ request }: LoaderArgs): Promise<DashboardData> => {
    const range = rangeOf(queryOf(request))
    const view = await overviewApi.analytics(range)

    return {
      cards: toStatCards(view.kpis),
      revenue: view.revenue && toRevenueChart(view.revenue),
      range,
      tiers: toTierRows(view.tierMix),
      totalRegistrations: countLabel(view.kpis.registrations.value),
      sellingFast: view.sellingFast.map(toSellingFastRow),
      recent: view.recent.map(toRecentRow),
    }
  }),
}
