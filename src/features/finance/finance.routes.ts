import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { api, type Query } from '@/lib/api'
import { baht } from '@/lib/format'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { toBalances, toInvoiceRow, toPayoutRow, toTaxRow, type Balances } from './finance.mapper'
import type {
  BalancesWire,
  InvoiceCountsWire,
  InvoiceRow,
  InvoiceStatus,
  InvoiceWire,
  PayoutRow,
  PayoutStatus,
  PayoutWire,
  TaxRow,
  VatLedgerWire,
} from './finance.types'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'

/** Payouts, invoices and VAT periods (US-FIN-03..12). */

const MAX_SEARCH = 120

function withPage(current: string, page: number): string {
  const url = new URL(current)
  url.searchParams.set('page', String(page))
  return url.pathname + url.search
}

/* ── payouts ──────────────────────────────────────────────────────────── */

export const PAYOUT_TABS = ['all', 'scheduled', 'processing', 'paid', 'failed'] as const
export type PayoutTab = (typeof PAYOUT_TABS)[number]

const payoutsApi = {
  list: (query: Query) => api.list<PayoutWire>('/payouts', { query }),
  balances: () => api.get<BalancesWire>('/payouts/balances'),
  retry: (reference: string) => api.post<void>(`/payouts/${reference}/retry`),
  /** A one-time provider URL for connecting or changing the bank account. */
  settingsLink: () => api.post<{ connected: boolean; url: string | null }>('/payouts/settings-link'),
}

export interface PayoutsData {
  rows: PayoutRow[]
  window: PageWindow
  balances: Balances
}

async function loadPayouts({ request }: LoaderArgs): Promise<PayoutsData> {
  const params = queryOf(request)
  const tab = enumParam(params, 'tab', PAYOUT_TABS, 'all')
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const page = intParam(params, 'page', 1)

  const [list, balances] = await Promise.all([
    payoutsApi.list({
      page,
      limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
      status: tab === 'all' ? undefined : (tab as PayoutStatus),
    }),
    payoutsApi.balances(),
  ])

  if (list.meta.total > 0 && page > list.meta.totalPages) {
    throw redirect(withPage(request.url, list.meta.totalPages))
  }

  return {
    rows: list.items.map(toPayoutRow),
    window: pageWindow(list.meta),
    balances: toBalances(balances),
  }
}

/**
 * Retrying a failed payout, or opening the provider's settings.
 *
 * The settings link is one-time and comes from the provider, so it is fetched
 * on demand rather than held in loader data where it could go stale in a tab
 * left open.
 */
async function runPayoutsAction({ request }: LoaderArgs): Promise<unknown> {
  const form = await request.formData()
  if (String(form.get('intent')) === 'connect') {
    const link = await payoutsApi.settingsLink()
    return { url: link.url }
  }
  await payoutsApi.retry(String(form.get('reference') ?? ''))
  return null
}

export const payoutsRoute = {
  loader: pageData(loadPayouts),
  action: pageAction(runPayoutsAction),
}

/* ── invoices ─────────────────────────────────────────────────────────── */

export const INVOICE_TABS = ['all', 'issued', 'paid', 'overdue', 'void'] as const
export type InvoiceTab = (typeof INVOICE_TABS)[number]

const invoicesApi = {
  list: (query: Query) => api.list<InvoiceWire>('/invoices', { query }),
  void: (id: number, reason: string | undefined) =>
    api.post<void>(`/invoices/${id}/void`, { reason }),
}

export interface TabCounts extends InvoiceCountsWire {
  all: number
}

export interface InvoicesData {
  rows: InvoiceRow[]
  window: PageWindow
  tabs: TabCounts
  events: EventOption[]
  exportQuery: Record<string, string>
}

const NO_COUNTS: InvoiceCountsWire = { issued: 0, paid: 0, overdue: 0, void: 0 }

async function loadInvoices({ request }: LoaderArgs): Promise<InvoicesData> {
  const params = queryOf(request)
  const tab = enumParam(params, 'tab', INVOICE_TABS, 'all')
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const search = params.get('q')?.trim()
  const query = {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    status: tab === 'all' ? undefined : (tab as InvoiceStatus),
    eventId: params.get('eventId') ?? undefined,
    search: search ? search.slice(0, MAX_SEARCH) : undefined,
  }

  const [list, events] = await Promise.all([invoicesApi.list(query), eventOptions()])

  if (list.meta.total > 0 && query.page > list.meta.totalPages) {
    throw redirect(withPage(request.url, list.meta.totalPages))
  }

  const counts = (list.meta.counts as InvoiceCountsWire | undefined) ?? NO_COUNTS
  return {
    rows: list.items.map(toInvoiceRow),
    window: pageWindow(list.meta),
    tabs: { ...counts, all: counts.issued + counts.paid + counts.overdue + counts.void },
    events,
    exportQuery: exportQueryOf(query),
  }
}

/** The filters to export — paging dropped, since an export is the whole set. */
export function exportQueryOf(query: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (key === 'page' || key === 'limit') continue
    if (value !== undefined && value !== null && value !== '') out[key] = String(value)
  }
  return out
}

async function runInvoicesAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  await invoicesApi.void(
    Number(form.get('invoiceId')),
    String(form.get('reason') ?? '').trim() || undefined,
  )
}

export const invoicesRoute = {
  loader: pageData(loadInvoices),
  action: pageAction(runInvoicesAction),
}

/* ── VAT ──────────────────────────────────────────────────────────────── */

const taxesApi = {
  ledger: (year: number) => api.get<VatLedgerWire>('/tax-periods', { query: { year } }),
  file: (year: number, month: number, remittedSatang: number | null) =>
    api.post<void>(`/tax-periods/${year}/${month}/file`, { remittedSatang }),
}

export interface TaxesData {
  year: number
  /** The years the picker offers, newest first. */
  years: number[]
  rows: TaxRow[]
  headlines: {
    collected: string
    remitted: string
    payable: string
    withholding: string
  }
}

/** How many years back the picker goes. VAT records are kept for five. */
const YEARS_BACK = 5

/**
 * Which tax year is on screen.
 *
 * `/tax-periods` requires a year — it is not optional, whatever the parameter
 * list suggests — so the loader always states one. The default is the current
 * Bangkok year, because a filing deadline is a Thai calendar fact.
 */
export function yearOf(params: URLSearchParams, thisYear: number): number {
  const asked = intParam(params, 'year', thisYear)
  return asked >= thisYear - YEARS_BACK && asked <= thisYear ? asked : thisYear
}

async function loadTaxes({ request }: LoaderArgs): Promise<TaxesData> {
  const thisYear = bangkokYear()
  const year = yearOf(queryOf(request), thisYear)
  const ledger = await taxesApi.ledger(year)

  return {
    year,
    years: Array.from({ length: YEARS_BACK + 1 }, (_, i) => thisYear - i),
    rows: ledger.periods.map(toTaxRow),
    headlines: {
      collected: money(ledger.headlines.vatCollectedSatang),
      remitted: money(ledger.headlines.vatRemittedSatang),
      payable: money(ledger.headlines.vatPayableSatang),
      withholding: money(ledger.headlines.withholdingSatang),
    },
  }
}

const SATANG_PER_BAHT = 100

/** The headline figures are always disclosed here, so plain baht will do. */
function money(satang: number): string {
  return baht(Math.round(satang / SATANG_PER_BAHT))
}

/** The current year in Bangkok — never the browser's, which may be behind. */
function bangkokYear(): number {
  return Number(
    new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric' }),
  )
}

async function runTaxesAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const remitted = Number(form.get('remitted'))
  await taxesApi.file(
    Number(form.get('year')),
    Number(form.get('month')),
    Number.isFinite(remitted) && remitted > 0 ? Math.round(remitted * SATANG_PER_BAHT) : null,
  )
}

export const taxesRoute = {
  loader: pageData(loadTaxes),
  action: pageAction(runTaxesAction),
}
