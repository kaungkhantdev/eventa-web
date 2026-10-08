import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { api, type Query } from '@/lib/api'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { toPaymentRow } from './payments.mapper'
import type {
  LedgerCountsWire,
  LedgerEntryWire,
  LedgerStatus,
  PaymentMethod,
  PaymentRow,
} from './payments.types'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'

/**
 * The payments ledger (US-FIN-01/02).
 *
 * Status, method, event, search and page all live in the URL — the API filters
 * server-side, so the pill counts and the rows come from one answer. Nothing
 * here decides whether a charge may be refunded: the server owns that, and the
 * row carries both its verdict and its reason.
 */

export const LEDGER_TABS = ['all', 'paid', 'pending', 'refunded', 'failed'] as const
export type LedgerTab = (typeof LEDGER_TABS)[number]

export const METHODS: readonly PaymentMethod[] = ['Card', 'PromptPay', 'Bank transfer']

const MAX_SEARCH = 120
interface LedgerQuery extends Query {
  page?: number
  limit?: number
  status?: LedgerStatus
  method?: PaymentMethod
  eventId?: string
  search?: string
}

const paymentsApi = {
  list: (query: LedgerQuery) => api.list<LedgerEntryWire>('/payments', { query }),
  refund: (id: string, amountSatang: number | null, reason: string | undefined) =>
    api.post<void>(`/payments/${id}/refund`, { amountSatang, reason }),
}

export function tabOf(params: URLSearchParams): LedgerTab {
  return enumParam(params, 'tab', LEDGER_TABS, 'all')
}

export function listQueryOf(params: URLSearchParams): LedgerQuery {
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const tab = tabOf(params)
  const method = params.get('method')
  const search = params.get('q')?.trim()
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    status: tab === 'all' ? undefined : (tab as LedgerStatus),
    method: METHODS.includes(method as PaymentMethod) ? (method as PaymentMethod) : undefined,
    eventId: params.get('eventId') ?? undefined,
    search: search ? search.slice(0, MAX_SEARCH) : undefined,
  }
}

export interface TabCounts extends LedgerCountsWire {
  all: number
}

export function tabCountsOf(counts: LedgerCountsWire): TabCounts {
  return { ...counts, all: counts.paid + counts.pending + counts.refunded + counts.failed }
}

export interface PaymentsData {
  rows: PaymentRow[]
  window: PageWindow
  tabs: TabCounts
  events: EventOption[]
  /** The filters to export, so the CSV matches what is on screen. */
  exportQuery: Record<string, string>
}

const NO_COUNTS: LedgerCountsWire = { paid: 0, pending: 0, refunded: 0, failed: 0 }

async function loadPayments({ request }: LoaderArgs): Promise<PaymentsData> {
  const params = queryOf(request)
  const query = listQueryOf(params)
  const [page, events] = await Promise.all([paymentsApi.list(query), eventOptions()])

  if (page.meta.total > 0 && query.page! > page.meta.totalPages) {
    throw redirect(withPage(request.url, page.meta.totalPages))
  }

  return {
    rows: page.items.map(toPaymentRow),
    window: pageWindow(page.meta),
    tabs: tabCountsOf((page.meta.counts as LedgerCountsWire | undefined) ?? NO_COUNTS),
    events,
    exportQuery: exportQueryOf(query),
  }
}

/**
 * The filters to export, which are the ones the loader just used.
 *
 * Paging is dropped: an export is the whole filtered ledger, not the ten rows
 * that happen to be on screen. An export that ignored the filters entirely
 * would hand somebody a spreadsheet of the wrong month.
 */
export function exportQueryOf(query: LedgerQuery): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (key === 'page' || key === 'limit') continue
    if (value !== undefined && value !== null && value !== '') out[key] = String(value)
  }
  return out
}

function withPage(current: string, page: number): string {
  const url = new URL(current)
  url.searchParams.set('page', String(page))
  return url.pathname + url.search
}

/**
 * Baht typed into the refund box → integer satang, or null for the full amount.
 *
 * An empty box means "all of it", which the API spells as a null amount. Sending
 * 0 would ask it to refund nothing and call that a success.
 */
export function refundAmountOf(raw: string): number | null {
  const baht = Number(raw)
  if (!raw.trim() || !Number.isFinite(baht) || baht <= 0) return null
  return Math.round(baht * SATANG_PER_BAHT)
}

const SATANG_PER_BAHT = 100

async function runPaymentsAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  await paymentsApi.refund(
    String(form.get('paymentId') ?? ''),
    refundAmountOf(String(form.get('amount') ?? '')),
    String(form.get('reason') ?? '').trim() || undefined,
  )
}

export const paymentsRoute = {
  loader: pageData(loadPayments),
  action: pageAction(runPaymentsAction),
}
