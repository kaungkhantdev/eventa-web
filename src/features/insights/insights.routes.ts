import { redirect } from 'react-router'
import { pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'
import { api, type Query } from '@/lib/api'
import { MASKED, num, satangAmount } from '@/lib/format'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { OVERVIEW_RANGES } from './insights.types'
import { enumParam, intParam } from '@/lib/urlFilters'
import {
  earnedSomething,
  toAttendanceRow,
  toAttendanceTiles,
  toDiscountRow,
  toEventPerformanceRow,
  toMixSlices,
  toOverviewTiles,
  toTransactionRow,
  toTrendLabels,
  toIncomeRow,
  toIncomeTiles,
  toRegistrationRow,
  toRegistrationTiles,
  toDelta,
  type AttendanceReportRow,
  type Delta,
  type DiscountReportRow,
  type EventPerformanceRow,
  type MixSlice,
  type TransactionRow,
  type IncomeReportRow,
  type RegistrationReportRow,
} from './insights.mapper'
import type {
  AttendanceReportWire,
  DiscountsReportWire,
  OverviewRange,
  OverviewWire,
  TransactionsReportWire,
  EventsReportWire,
  IncomeReportWire,
  RegistrationsReportWire,
  ReportPeriodWire,
} from './insights.types'

/** The stages the status control offers; '' is "every stage". */
export const EVENT_LIFECYCLES = ['upcoming', 'live', 'completed', 'cancelled', ''] as const

/**
 * The reports that read straight from `/reports/*` (US-RPT-05/08/09).
 *
 * All three take the same filter, because the API does: a window, one event or
 * all of them, a search, and a page. Every one of those lives in the URL rather
 * than in component state — the API filters and pages server-side, so the query
 * string is the single source of truth and the row count can never disagree
 * with the rows.
 */

const MAX_SEARCH = 120

const reportsApi = {
  registrations: (query: Query) =>
    api.get<RegistrationsReportWire>('/reports/registrations', { query }),
  attendance: (query: Query) =>
    api.get<AttendanceReportWire>('/reports/attendance', { query }),
  income: (query: Query) => api.get<IncomeReportWire>('/reports/income', { query }),
  events: (query: Query) => api.get<EventsReportWire>('/reports/events', { query }),
  discounts: (query: Query) =>
    api.get<DiscountsReportWire>('/reports/discounts', { query }),
  transactions: (query: Query) =>
    api.get<TransactionsReportWire>('/reports/transactions', { query }),
  overview: (query: Query) => api.get<OverviewWire>('/reports/overview', { query }),
}

/** What every report page hands its screen, whatever its rows look like. */
interface ReportData<Row, Tiles> {
  rows: Row[]
  tiles: Tiles
  window: PageWindow
  period: ReportPeriodWire
  events: EventOption[]
  /** The filters to export under, paging dropped. */
  exportQuery: Record<string, string>
}

export type RegistrationsReportData = ReportData<
  RegistrationReportRow,
  ReturnType<typeof toRegistrationTiles>
>
export type AttendanceReportData = ReportData<
  AttendanceReportRow,
  ReturnType<typeof toAttendanceTiles>
>
export type IncomeReportData = ReportData<IncomeReportRow, ReturnType<typeof toIncomeTiles>>

/** The filter the three reports share, read out of the address bar. */
function reportQuery(request: Request) {
  const params = queryOf(request)
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const search = params.get('q')?.trim()
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    eventId: params.get('eventId') ?? undefined,
    q: search ? search.slice(0, MAX_SEARCH) : undefined,
    range: params.get('range') ?? undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
  }
}

/**
 * The paginator's window.
 *
 * Built from `matchedEvents` — how many events the FILTER matched — rather than
 * from the rows on screen, so "Showing 1–10 of 48" survives paging and cannot
 * disagree with the totals above it.
 */
function windowOf(matchedEvents: number, query: { page: number; limit: number }): PageWindow {
  return pageWindow({
    page: query.page,
    limit: query.limit,
    total: matchedEvents,
    totalPages: Math.max(1, Math.ceil(matchedEvents / query.limit)),
  })
}

/**
 * The filters to export under — the query minus paging, since an export is the
 * whole filtered set rather than the page on screen.
 */
function exportQuery(query: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (key === 'page' || key === 'limit') continue
    if (value !== undefined && value !== null && value !== '') out[key] = String(value)
  }
  return out
}

/** A page past the end is a dead view; send the reader to the last real one. */
function guardPage(request: Request, matchedEvents: number, query: { page: number; limit: number }) {
  const pages = Math.ceil(matchedEvents / query.limit)
  if (matchedEvents === 0 || query.page <= pages) return
  const url = new URL(request.url)
  url.searchParams.set('page', String(pages))
  throw redirect(url.pathname + url.search)
}

async function loadRegistrations({ request }: LoaderArgs): Promise<RegistrationsReportData> {
  const query = reportQuery(request)
  const [report, events] = await Promise.all([reportsApi.registrations(query), eventOptions()])
  guardPage(request, report.matchedEvents, query)

  return {
    rows: report.rows.map(toRegistrationRow),
    tiles: toRegistrationTiles(report.totals, report.changes),
    window: windowOf(report.matchedEvents, query),
    period: report.period,
    events,
    exportQuery: exportQuery(query),
  }
}

async function loadAttendance({ request }: LoaderArgs): Promise<AttendanceReportData> {
  const query = reportQuery(request)
  const [report, events] = await Promise.all([reportsApi.attendance(query), eventOptions()])
  guardPage(request, report.matchedEvents, query)

  return {
    rows: report.rows.map(toAttendanceRow),
    tiles: toAttendanceTiles(report.totals, report.changes),
    window: windowOf(report.matchedEvents, query),
    period: report.period,
    events,
    exportQuery: exportQuery(query),
  }
}

async function loadIncome({ request }: LoaderArgs): Promise<IncomeReportData> {
  const query = reportQuery(request)
  const [report, events] = await Promise.all([reportsApi.income(query), eventOptions()])
  guardPage(request, report.matchedEvents, query)

  return {
    rows: report.rows.map(toIncomeRow),
    tiles: toIncomeTiles(report.totals, report.changes),
    window: windowOf(report.matchedEvents, query),
    period: report.period,
    events,
    exportQuery: exportQuery(query),
  }
}

/**
 * Events ranked by registrations (US-RPT-04).
 *
 * The only report with a status control, and the only one whose rows are the
 * events themselves rather than a metric grouped by them — so an event nobody
 * signed up for still has a row, at the bottom.
 */
export interface EventsReportData {
  rows: EventPerformanceRow[]
  window: PageWindow
  period: ReportPeriodWire
  events: EventOption[]
  exportQuery: Record<string, string>
}

async function loadEvents({ request }: LoaderArgs): Promise<EventsReportData> {
  const params = queryOf(request)
  const query = {
    ...reportQuery(request),
    status: enumParam(params, 'status', EVENT_LIFECYCLES, '') || undefined,
  }
  const [report, events] = await Promise.all([reportsApi.events(query), eventOptions()])
  guardPage(request, report.matchedEvents, query)

  return {
    rows: report.rows.map(toEventPerformanceRow),
    window: windowOf(report.matchedEvents, query),
    period: report.period,
    events,
    exportQuery: exportQuery(query),
  }
}

/**
 * Promotion payback (US-RPT-10).
 *
 * The tiles carry no "vs previous period" chip, and that is deliberate: a
 * code's payback is its LIFETIME payback, so there is no previous period to
 * compare it against. The window decides which codes are listed, not what they
 * achieved.
 */
export interface DiscountsReportData {
  rows: DiscountReportRow[]
  tiles: {
    activeCodes: string
    redemptions: string
    discount: string
    influenced: string
  }
  window: PageWindow
  period: ReportPeriodWire
  events: EventOption[]
  exportQuery: Record<string, string>
}

async function loadDiscounts({ request }: LoaderArgs): Promise<DiscountsReportData> {
  const query = reportQuery(request)
  const [report, events] = await Promise.all([reportsApi.discounts(query), eventOptions()])
  guardPage(request, report.matchedCodes, query)

  const { totals } = report
  return {
    rows: report.rows.map(toDiscountRow),
    tiles: {
      activeCodes: num(totals.activeCodes),
      redemptions: num(totals.redemptions),
      discount: satangAmount(totals.discountSatang),
      influenced: satangAmount(totals.influencedSatang),
    },
    window: windowOf(report.matchedCodes, query),
    period: report.period,
    events,
    exportQuery: exportQuery(query),
  }
}

/** Every charge and reversal, for investigating one of them (US-RPT-06). */
export interface TransactionsReportData {
  rows: TransactionRow[]
  tiles: {
    entries: string
    collected: string
    refunds: string
    successRate: string
  }
  window: PageWindow
  period: ReportPeriodWire
  events: EventOption[]
  exportQuery: Record<string, string>
}

async function loadTransactions({
  request,
}: LoaderArgs): Promise<TransactionsReportData> {
  const query = reportQuery(request)
  const [report, events] = await Promise.all([
    reportsApi.transactions(query),
    eventOptions(),
  ])
  guardPage(request, report.matchedEntries, query)

  const { totals } = report
  return {
    rows: report.rows.map(toTransactionRow),
    tiles: {
      entries: num(totals.entries),
      collected: satangAmount(totals.collectedSatang),
      refunds: num(totals.refunds),
      // Null when nothing was attempted — a window of only refunds has no rate.
      successRate: totals.successRate === null ? MASKED : `${num(totals.successRate)}%`,
    },
    window: windowOf(report.matchedEntries, query),
    period: report.period,
    events,
    exportQuery: exportQuery(query),
  }
}

/** How many events the overview previews before "View all". */
const TOP_EVENTS = 6

/**
 * Workspace health at a glance (US-RPT-01/03/04).
 *
 * Two calls: the overview's own figures, and the top events — which serve both
 * the "registrations by event" bars and the Top events table, since the two
 * rank by the same thing and showing them from one response is what keeps them
 * agreeing.
 *
 * There is deliberately no "sales by channel". No source, channel or UTM column
 * exists anywhere in the schema, so the panel could only ever have been
 * invented; it is dropped rather than faked.
 */
export interface OverviewData {
  range: OverviewRange
  tiles: ReturnType<typeof toOverviewTiles>
  revenue: {
    total: string
    delta: Delta
    labels: string[]
    values: number[]
    /** False when the period took nothing — the chart says so instead. */
    earned: boolean
  } | null
  mix: MixSlice[]
  /** The donut's centre: the registrations the mix accounts for. */
  mixTotal: string
  bars: { id: string; name: string; count: string; width: number }[]
  topEvents: EventPerformanceRow[]
  period: ReportPeriodWire
}

async function loadOverview({ request }: LoaderArgs): Promise<OverviewData> {
  const params = queryOf(request)
  const range = enumParam(params, 'range', OVERVIEW_RANGES, 'year')
  const [report, events] = await Promise.all([
    reportsApi.overview({ range }),
    reportsApi.events({ range, page: 1, limit: TOP_EVENTS }),
  ])

  const busiest = events.rows[0]?.registrations ?? 0
  return {
    range,
    tiles: toOverviewTiles(report.kpis),
    revenue: report.revenue && {
      total: satangAmount(report.revenue.totalSatang),
      delta: toDelta(report.revenue.change),
      labels: toTrendLabels(report.revenue.points, report.revenue.granularity),
      // Baht, not satang: the axis formats what it is given, and satang would
      // put two zeroes on every tick.
      values: report.revenue.points.map((point) => Math.round(point.netSatang / 100)),
      earned: earnedSomething(report.revenue.totalSatang),
    },
    mix: toMixSlices(report.ticketMix),
    mixTotal: num(report.ticketMix.reduce((sum, slice) => sum + slice.seats, 0)),
    bars: events.rows.map((row) => ({
      id: row.eventId,
      name: row.eventName,
      count: num(row.registrations),
      // Relative to the busiest, so the longest bar fills the track.
      width: busiest === 0 ? 0 : Math.round((row.registrations / busiest) * 100),
    })),
    topEvents: events.rows.map(toEventPerformanceRow),
    period: report.period,
  }
}

export const overviewReportRoute = { loader: pageData(loadOverview) }
export const transactionsReportRoute = { loader: pageData(loadTransactions) }
export const discountsReportRoute = { loader: pageData(loadDiscounts) }
export const eventsReportRoute = { loader: pageData(loadEvents) }
export const registrationsReportRoute = { loader: pageData(loadRegistrations) }
export const attendanceReportRoute = { loader: pageData(loadAttendance) }
export const incomeReportRoute = { loader: pageData(loadIncome) }
