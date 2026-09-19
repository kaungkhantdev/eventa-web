import { redirect } from 'react-router'
import { pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'
import { api, type Query } from '@/lib/api'
import { MASKED, num, satangAmount } from '@/lib/format'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import {
  toAttendanceRow,
  toAttendanceTiles,
  toDiscountRow,
  toEventPerformanceRow,
  toTransactionRow,
  toIncomeRow,
  toIncomeTiles,
  toRegistrationRow,
  toRegistrationTiles,
  type AttendanceReportRow,
  type DiscountReportRow,
  type EventPerformanceRow,
  type TransactionRow,
  type IncomeReportRow,
  type RegistrationReportRow,
} from './insights.mapper'
import type {
  AttendanceReportWire,
  DiscountsReportWire,
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
}

/** What every report page hands its screen, whatever its rows look like. */
interface ReportData<Row, Tiles> {
  rows: Row[]
  tiles: Tiles
  window: PageWindow
  period: ReportPeriodWire
  events: EventOption[]
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
  }
}

export const transactionsReportRoute = { loader: pageData(loadTransactions) }
export const discountsReportRoute = { loader: pageData(loadDiscounts) }
export const eventsReportRoute = { loader: pageData(loadEvents) }
export const registrationsReportRoute = { loader: pageData(loadRegistrations) }
export const attendanceReportRoute = { loader: pageData(loadAttendance) }
export const incomeReportRoute = { loader: pageData(loadIncome) }
