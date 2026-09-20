import { useLoaderData } from 'react-router'
import {
  Badge,
  Card,
  DownloadButton,
  HeaderUser,
  PageFooter,
  PageHeader,
  PanelEmptyPreview,
  PastEnd,
  Paginator,
  PillTabs,
  Select,
  type PillTabItem,
} from '@/components/ui'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import type { DeliveriesData, DeliveryTab } from '../deliveries.routes'

/**
 * Every message this workspace sent, and what became of it (US-MSG-06). Ported
 * from `eventa-ui-kit/admin/messaging-log.html`.
 *
 * **Two statuses, not the kit's four.** Delivered and Opened are gone: the
 * first needs a provider webhook and the second a tracking pixel, and this
 * product has neither. A log is the thing an organizer opens when an attendee
 * says "I never got my ticket" — inventing "Delivered" there would answer that
 * question wrongly, with confidence.
 *
 * **The SMS channel column is gone** for the same reason it went from the
 * templates page: nothing in the product sends one.
 *
 * **Read-only, with no re-send.** A failed message failed for a reason — a dead
 * address, a full mailbox — and firing the same message at the same address
 * would look like an action while changing nothing. The failure reason is shown
 * instead, because that is what tells you where to go and fix it.
 */

const TABS: PillTabItem<DeliveryTab>[] = [
  { value: 'all', label: 'All' },
  { value: 'failed', label: 'Needs attention' },
]

export default function MessagingLogPage() {
  const data = useLoaderData() as DeliveriesData
  const { params, set, clear, emptyReason } = useFilters({
    total: data.window.total,
    ignore: ['tab'],
  })
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) =>
    set({ q, page: null }, { replace: true }),
  )

  return (
    <>
      <PageHeader
        title="Delivery log"
        subtitle="Every email sent to your attendees, and what became of it."
        actions={
          <>
            <DownloadButton
              path="/message-deliveries/export.csv"
              query={data.exportQuery}
              filename="eventa-delivery-log.csv"
            />
            <HeaderUser />
          </>
        }
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <PillTabs
          items={TABS}
          value={data.tab}
          onChange={(tab) => set({ tab: tab === 'all' ? null : tab, page: null })}
        />
        <div className="relative w-full sm:w-64">
          <i className="hgi-stroke hgi-search-01 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-muted" />
          <input
            type="text"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search name or address…"
            aria-label="Search recipients"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            value={params.get('kind') ?? ''}
            onChange={(event) => set({ kind: event.target.value, page: null })}
            aria-label="Message type"
            className="h-10 border-0 bg-surface text-[13px] font-semibold"
          >
            <option value="">All message types</option>
            {data.kinds.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold tracking-tight">Delivery log</h2>
          {/* Counted over the current filter, so it always describes the rows
              below rather than the workspace as a whole. */}
          {data.failed > 0 && (
            <p className="text-[12px] font-semibold text-red-500">
              {data.failed} of these didn’t get through
            </p>
          )}
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Message</th>
                <th>Event</th>
                <th>Status</th>
                <th className="text-right">Sent</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="avatar h-8 w-8 text-[11px]">{row.initials}</span>
                        <div className="min-w-0 leading-tight">
                          <p className="font-medium text-ink">{row.name}</p>
                          {row.email && (
                            <p className="text-[11px] text-muted">{row.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{row.kind}</td>
                    <td className="text-muted">{row.event ?? '—'}</td>
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={row.status.tone} icon={row.status.icon}>
                          {row.status.label}
                        </Badge>
                        {/* The reason is the useful half of a failure: it says
                            whether to fix an address or wait. */}
                        {row.error && (
                          <span className="text-[11px] text-muted">{row.error}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right text-muted tnum">{row.sentAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <DeliveriesEmpty
                      tab={data.tab}
                      reason={emptyReason}
                      onClear={clear}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          {...data.window}
          noun="messages"
          onPage={(page) => set({ page })}
          onSize={(size) => set({ limit: size, page: null })}
        />
      </Card>

      <PageFooter />
    </>
  )
}

function DeliveriesEmpty({
  tab,
  reason,
  onClear,
}: {
  tab: DeliveryTab
  reason: ReturnType<typeof useFilters>['emptyReason']
  onClear: () => void
}) {
  if (reason === 'past-end') {
    return <PastEnd noun="messages" onFirstPage={onClear} />
  }
  // Nothing failing is GOOD NEWS, and the only empty state on this page that
  // is. It gets a sentence that says so rather than one offering a way out of
  // a filter that is working perfectly.
  if (tab === 'failed') {
    return (
      <PanelEmptyPreview
        preview="table"
        description="Every message this workspace has sent was accepted by the mail server."
      >
        Nothing has failed.
      </PanelEmptyPreview>
    )
  }
  if (reason === 'no-results') {
    return (
      <PanelEmptyPreview
        preview="table"
        description="No message matches the current search and type. Try a different name or address."
        action={{ label: 'Clear filters', icon: 'hgi-refresh', onClick: onClear }}
      >
        No messages match.
      </PanelEmptyPreview>
    )
  }
  return (
    <PanelEmptyPreview
      preview="table"
      description="Every automated email and announcement lands here as it goes out, with what the mail server said about it."
    >
      Nothing sent yet.
    </PanelEmptyPreview>
  )
}
