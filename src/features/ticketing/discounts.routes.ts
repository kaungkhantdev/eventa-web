import { redirect } from 'react-router'
import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { bangkokInstant } from '@/lib/format'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { eventsApi } from '@/features/events/events.api'
import { discountsApi, type DiscountInput, type ListDiscountsQuery } from './discounts.api'
import { toDiscountRow } from './discounts.mapper'
import type { DiscountRow } from './discounts.types'
import type { DiscountStatus, DiscountType } from './types'
import type { EventOption } from './tickets.routes'

/** Promo codes (US-TKT-07..10/12). Filtered, counted and paged by the API. */

export const DISCOUNT_TABS = ['all', 'active', 'scheduled', 'expired', 'disabled'] as const
export type DiscountTab = (typeof DISCOUNT_TABS)[number]

const MAX_SEARCH = 120
const EVENT_OPTIONS = 100
const SATANG_PER_BAHT = 100

export function tabOf(params: URLSearchParams): DiscountTab {
  return enumParam(params, 'tab', DISCOUNT_TABS, 'all')
}

export function listQueryOf(params: URLSearchParams): ListDiscountsQuery {
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const tab = tabOf(params)
  const search = params.get('q')?.trim()
  return {
    page: intParam(params, 'page', 1),
    limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    status: tab === 'all' ? undefined : (tab as DiscountStatus),
    eventId: params.get('eventId') ?? undefined,
    search: search ? search.slice(0, MAX_SEARCH) : undefined,
  }
}

/**
 * A filled-in form → the body `POST /discounts` accepts.
 *
 * A percentage stays a percentage; a fixed amount becomes integer satang, which
 * is the only unit money travels in. The code is uppercased because that is how
 * it is printed and how a buyer types it, and an unset event means the code
 * applies workspace-wide — which the API spells `null`, not `''`.
 */
export function discountInputOf(form: FormData): DiscountInput {
  const type = (String(form.get('type') ?? 'percent') as DiscountType) || 'percent'
  const value = Number(form.get('value')) || 0
  const version = Number(form.get('version'))
  return {
    code: String(form.get('code') ?? '').trim().toUpperCase(),
    type,
    value: type === 'fixed' ? Math.round(value * SATANG_PER_BAHT) : value,
    eventId: String(form.get('eventId') ?? '') || null,
    redemptionLimit: Number(form.get('redemptionLimit')) || undefined,
    perPersonLimit: Number(form.get('perPersonLimit')) || undefined,
    validFrom: bangkokInstant(String(form.get('validFrom') ?? '')) ?? undefined,
    validUntil: bangkokInstant(String(form.get('validUntil') ?? '')) ?? undefined,
    version: Number.isInteger(version) && version > 0 ? version : undefined,
  }
}

export interface DiscountsData {
  rows: DiscountRow[]
  window: PageWindow
  events: EventOption[]
  /** A code nobody is using, ready for the "Generate" button. */
  suggestion: string
}

async function loadDiscounts({ request }: LoaderArgs): Promise<DiscountsData> {
  const query = listQueryOf(queryOf(request))
  const [page, events, suggestion] = await Promise.all([
    discountsApi.list(query),
    eventOptions(),
    discountsApi.suggest(),
  ])

  if (page.meta.total > 0 && query.page! > page.meta.totalPages) {
    throw redirect(withPage(request.url, page.meta.totalPages))
  }

  return {
    rows: page.items.map(toDiscountRow),
    window: pageWindow(page.meta),
    events,
    suggestion: suggestion.code,
  }
}

async function eventOptions(): Promise<EventOption[]> {
  const page = await eventsApi.list({ limit: EVENT_OPTIONS, sort: 'recent' })
  return page.items.map((event) => ({ id: event.id, name: event.name }))
}

function withPage(current: string, page: number): string {
  const url = new URL(current)
  url.searchParams.set('page', String(page))
  return url.pathname + url.search
}

async function runDiscountsAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')
  const id = String(form.get('id') ?? '')

  if (intent === 'create') {
    await discountsApi.create(discountInputOf(form))
    return
  }
  if (intent === 'update') {
    await discountsApi.update(id, discountInputOf(form))
    return
  }
  // Turning a code off leaves the redemptions already made standing; only
  // delete removes it, and the API refuses that once it has been used.
  if (intent === 'enable') {
    await discountsApi.enable(id)
    return
  }
  if (intent === 'disable') {
    await discountsApi.disable(id)
    return
  }
  await discountsApi.remove(id)
}

export const discountsRoute = {
  loader: pageData(loadDiscounts),
  action: pageAction(runDiscountsAction),
}
