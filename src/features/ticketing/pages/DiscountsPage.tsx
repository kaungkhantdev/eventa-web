import { useEffect, useRef, useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  HeaderUser,
  Icon,
  NoResults,
  PageFooter,
  PageHeader,
  Paginator,
  PillTabs,
  type PillTabItem,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import type { ActionResult } from '@/app/loaders'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { DiscountPanel } from '../components/DiscountPanel'
import type { DiscountTab, DiscountsData } from '../discounts.routes'
import type { DiscountRow } from '../discounts.types'

/**
 * Promo codes (US-TKT-07..10/12). Layout ported from discounts.html.
 *
 * The table is what the API returned for these filters — the page does not
 * re-slice it, so the paginator's count and the rows always agree.
 */

const ALL_EVENTS = 'All events'
const MAX_SEARCH_LENGTH = 120
const COPY_RESET_MS = 1200

export default function DiscountsPage() {
  const data = useLoaderData() as DiscountsData
  // Nothing here is written as a default — an absent `tab` is "all" — so any
  // parameter in the URL is a choice the organizer made.
  const { params, set, clear, filtered } = useFilters()
  const filtering = useIsFiltering()
  const panel = useDisclosure()
  const del = useDisclosure()
  const [deleting, setDeleting] = useState<DiscountRow | null>(null)
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))
  const mutate = useFetcher<ActionResult>()

  // Before the first code exists the tabs, filters and table have nothing to
  // describe, so first run replaces the whole working area. Not `emptyReason`:
  // the loader redirects a page past the end back to the last real one whenever
  // any row matches, so landing here with `page=2` still means the list is
  // empty for these filters — "they are still there" would be the one
  // explanation that is false.
  const firstRun = data.rows.length === 0 && !filtered

  // Whether the workspace has an event to point a code at. `> 0` is the
  // direction that proves something; `=== 0` only ever picks the more cautious
  // copy, it never asserts the workspace is empty.
  const hasEvents = data.events.length > 0

  return (
    <>
      <PageHeader
        title="Discounts"
        subtitle="Create promo codes to boost registrations."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={panel.onOpen}>
              <Icon name="hgi-add-01" size={16} />
              <span className="hidden sm:inline">New code</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {firstRun ? (
        <Card>
          {/* The kit's copy says a code "needs an event with tickets to apply
              to". That is not this product's contract: `eventId` is nullable —
              "Omit or null to apply the code to every event" — and the panel
              offers "All events", so a code applies workspace-wide when none is
              chosen. Repeating the kit verbatim would state a requirement the
              API does not have, and would send an organizer who already has
              events to the event wizard. The wording only differs where that
              claim was; the shape and the fallback branch are the kit's. */}
          <EmptyState
            icon="hgi-discount-tag-01"
            title="No discount codes yet"
            actions={
              hasEvents
                ? [
                    { label: 'New code', onClick: panel.onOpen, icon: 'hgi-add-01' },
                    { label: 'Set up ticket types', to: '/admin/tickets' },
                  ]
                : [
                    {
                      label: 'Create an event first',
                      to: '/admin/event-form',
                      icon: 'hgi-calendar-add-01',
                    },
                    { label: 'Set up ticket types', to: '/admin/tickets' },
                  ]
            }
          >
            {hasEvents ? (
              <>
                A code takes a percentage or a fixed ฿ amount off a ticket price — for one event, or
                for every event at once. Set one up, then share it with the people you want to give
                the discount to.
              </>
            ) : (
              <>
                A code takes a percentage or a fixed ฿ amount off a ticket price, so there has to be
                a ticket on sale for it to come off. Create an event and its ticket types first,
                then come back and set up a code.
              </>
            )}
          </EmptyState>
        </Card>
      ) : (
        <>
          <PillTabs<DiscountTab>
            items={TABS}
            value={(params.get('tab') as DiscountTab) ?? 'all'}
            onChange={(tab) => set({ tab: tab === 'all' ? null : tab })}
          />

          <div className={cn('mt-3', filtering && 'opacity-60 transition-opacity')}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full flex-1">
                <Icon
                  name="hgi-search-01"
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
                  placeholder="Search codes…"
                  maxLength={MAX_SEARCH_LENGTH}
                  aria-label="Search discount codes"
                />
              </div>
              <div className="relative w-full sm:w-56">
                <Icon
                  name="hgi-calendar-03"
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand"
                />
                <select
                  value={params.get('eventId') ?? ''}
                  onChange={(e) => set({ eventId: e.target.value || null })}
                  className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
                  aria-label="Filter by event"
                >
                  <option value="">{ALL_EVENTS}</option>
                  {data.events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Card className="mt-3 p-4">
              <div className="overflow-x-auto">
                <DataTable className="min-w-[860px]">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Applies to</th>
                      <th>Used / Limit</th>
                      <th>Valid</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {data.rows.map((row) => (
                      <DiscountTableRow
                        key={row.id}
                        row={row}
                        onDelete={() => {
                          setDeleting(row)
                          del.onOpen()
                        }}
                        onToggle={() =>
                          mutate.submit(
                            {
                              intent: row.status === 'disabled' ? 'enable' : 'disable',
                              id: row.id,
                            },
                            { method: 'post' },
                          )
                        }
                      />
                    ))}
                    {/* The filters stay above — putting them back is the way out. */}
                    {data.rows.length === 0 && (
                      <tr>
                        <td colSpan={7}>
                          <NoResults noun="discount codes" onClear={clear}>
                            Nothing matches the current search, status tab and event filter. Try
                            widening them to see more codes.
                          </NoResults>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </DataTable>
              </div>

              <Paginator
                {...data.window}
                noun="discount codes"
                onPage={(page) => set({ page })}
                onSize={(size) => set({ limit: size, page: null })}
              />
            </Card>
          </div>
        </>
      )}

      {mutate.data?.ok === false && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {mutate.data.error}
        </p>
      )}

      <PageFooter />

      <DiscountPanel
        open={panel.open}
        onClose={panel.onClose}
        events={data.events}
        suggestion={data.suggestion}
      />

      <DeleteDiscountModal open={del.open} onClose={del.onClose} target={deleting} />
    </>
  )
}

const TABS: PillTabItem<DiscountTab>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' },
]

function DiscountTableRow({
  row,
  onDelete,
  onToggle,
}: {
  row: DiscountRow
  onDelete: () => void
  onToggle: () => void
}) {
  const disabled = row.status === 'disabled'

  return (
    <tr>
      <td>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[12px] font-semibold uppercase tracking-wide text-ink">
            {row.code}
          </span>
          <CopyCodeButton code={row.code} />
        </div>
      </td>
      <td>
        <Badge tone={row.offerTone}>{row.offer}</Badge>
      </td>
      <td className="text-muted">{row.appliesTo}</td>
      <td>
        <div className="w-28">
          <p className="tnum text-[11px] text-muted">{row.usedLabel}</p>
          {row.percent !== null && (
            <div className="mt-1 h-1.5 w-full rounded-full bg-line">
              <div className="h-1.5 rounded-full bg-brand" style={{ width: `${row.percent}%` }} />
            </div>
          )}
        </div>
      </td>
      <td className="tnum text-muted">{row.valid}</td>
      <td>
        <Badge tone={row.statusTone} icon={row.statusIcon}>
          {row.statusLabel}
        </Badge>
      </td>
      <td className="text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className="btn-icon"
            title={disabled ? 'Enable code' : 'Disable code'}
            onClick={onToggle}
          >
            <Icon name={disabled ? 'hgi-play' : 'hgi-pause'} size={16} />
          </button>
          <button type="button" className="btn-icon" title="Delete" onClick={onDelete}>
            <Icon name="hgi-delete-02" size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

/** Copy-to-clipboard with a brief tick — the code is meant to be pasted. */
function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onClick = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS)
  }

  return (
    <button type="button" className="btn-icon h-7 w-7" title="Copy code" onClick={onClick}>
      <Icon
        name={copied ? 'hgi-tick-02' : 'hgi-copy-01'}
        size={13}
        className={copied ? 'text-brand' : undefined}
      />
    </button>
  )
}

/**
 * Deleting a code.
 *
 * The API refuses once it has been redeemed and says why — shown verbatim,
 * because "disable it instead" is the answer, not an error.
 */
function DeleteDiscountModal({
  open,
  onClose,
  target,
}: {
  open: boolean
  onClose: () => void
  target: DiscountRow | null
}) {
  const fetcher = useFetcher<ActionResult>()
  const refused = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!done || !open) return
    toast.success('Discount code deleted.')
    onClose()
  }, [done, open, onClose])

  return (
    <ConfirmDeleteModal
      open={open}
      onClose={onClose}
      title="Delete discount code?"
      message={
        refused ??
        'This permanently removes the code. Attendees who already redeemed it are not affected.'
      }
      tone={refused ? 'error' : 'default'}
      confirmLabel={fetcher.state === 'idle' ? 'Delete' : 'Deleting…'}
      onConfirm={() => target && fetcher.submit({ intent: 'delete', id: target.id }, { method: 'post' })}
    />
  )
}
