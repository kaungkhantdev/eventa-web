import { pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { api, type Query } from '@/lib/api'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { enumParam, intParam } from '@/lib/urlFilters'
import { kindLabel, toDeliveryRow, type DeliveryRow } from './deliveries.mapper'
import type { DeliveryWire } from './deliveries.types'

/** The delivery log (US-MSG-06). */

const MAX_SEARCH = 120

/** 'all' is the absence of a filter, not a value the API understands. */
export const DELIVERY_TABS = ['all', 'failed'] as const
export type DeliveryTab = (typeof DELIVERY_TABS)[number]

const deliveriesApi = {
  list: (query: Query) => api.list<DeliveryWire>('/message-deliveries', { query }),
  kinds: () => api.get<string[]>('/message-deliveries/kinds'),
}

export interface KindOption {
  value: string
  label: string
}

export interface DeliveriesData {
  rows: DeliveryRow[]
  window: PageWindow
  tab: DeliveryTab
  /** How many of the MATCHED set failed — the number worth acting on. */
  failed: number
  /** Only the kinds this workspace has actually sent. */
  kinds: KindOption[]
  /** The filters to export under — paging dropped, since a file is the lot. */
  exportQuery: Record<string, string>
}

async function loadDeliveries({ request }: LoaderArgs): Promise<DeliveriesData> {
  const params = queryOf(request)
  const tab = enumParam(params, 'tab', DELIVERY_TABS, 'all')
  const page = intParam(params, 'page', 1)
  const asked = Number(params.get('limit'))
  const limit = isPageSize(asked) ? asked : DEFAULT_PAGE_SIZE
  const search = params.get('q')?.trim()

  const [deliveries, kinds] = await Promise.all([
    deliveriesApi.list({
      status: tab === 'failed' ? 'failed' : undefined,
      kind: params.get('kind') ?? undefined,
      q: search ? search.slice(0, MAX_SEARCH) : undefined,
      page,
      limit,
    }),
    deliveriesApi.kinds(),
  ])

  const total = deliveries.meta.total
  return {
    rows: deliveries.items.map(toDeliveryRow),
    window: pageWindow({
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }),
    tab,
    // The API counts this over the same filter as the rows, so it always
    // describes the list on screen rather than the whole workspace.
    failed: Number(deliveries.meta.failed ?? 0),
    kinds: kinds.map((kind) => ({ value: kind, label: kindLabel(kind) })),
    exportQuery: exportQuery({
      status: tab === 'failed' ? 'failed' : undefined,
      kind: params.get('kind') ?? undefined,
      q: search,
    }),
  }
}

/** Drops anything absent, so the URL carries only filters that are set. */
function exportQuery(
  filters: Record<string, string | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value) out[key] = value
  }
  return out
}

export const deliveriesRoute = { loader: pageData(loadDeliveries) }
