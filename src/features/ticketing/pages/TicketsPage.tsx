import { useEffect, useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Badge,
  Button,
  Card,
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
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import type { ActionResult } from '@/app/loaders'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { TicketPanel } from '../components/TicketPanel'
import { TicketQrModal } from '../components/TicketQrModal'
import type { TabCounts, TicketTab, TicketsData } from '../tickets.routes'
import type { TicketCard, TicketShareWire } from '../tickets.types'

/**
 * The cross-event ticket inventory (US-TKT-04). Layout ported from tickets.html.
 *
 * Every filter is a URL parameter and every count comes from the API, so the
 * pills, the cards and the paginator describe one answer rather than three
 * views of a list this page re-sliced.
 */

const ALL_EVENTS = 'All events'
const MAX_SEARCH_LENGTH = 120

export default function TicketsPage() {
  const data = useLoaderData() as TicketsData
  // No page writes a default into this URL — an absent `tab` is "all" — so
  // every parameter present is one the organizer chose.
  const { params, set, clear, filtered } = useFilters()
  const filtering = useIsFiltering()
  const panel = useDisclosure()
  const del = useDisclosure()
  const qr = useDisclosure()

  const [editing, setEditing] = useState<TicketCard | null>(null)
  const [sharing, setSharing] = useState<TicketCard | null>(null)
  const [deleting, setDeleting] = useState<TicketCard | null>(null)
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  const share = useFetcher<TicketShareWire>()
  const mutate = useFetcher<ActionResult>()

  const openShare = (card: TicketCard) => {
    setSharing(card)
    qr.onOpen()
    share.load(`/admin/tickets/share?eventId=${card.eventId}&ticketId=${card.id}`)
  }

  const openNew = () => {
    setEditing(null)
    panel.onOpen()
  }

  // Nothing to filter yet: the tabs, the search and the paginator are all noise
  // until a first tier exists, so first run replaces the whole working area.
  // Not `emptyReason`: the loader redirects a page past the end back to the
  // last real one whenever any row matches, so the only way to land here with
  // `page=2` is a list that is empty for these filters anyway — and "they are
  // still there" would be the one explanation that is false.
  const firstRun = data.cards.length === 0 && !filtered

  // A tier is created *inside* an event: TicketPanel's Event select is
  // `required` and holds nothing but the events below, so with none of them the
  // form can never be submitted. Offering the panel is gated on `> 0`, which is
  // the direction that proves something — `=== 0` only ever hides a control,
  // never asserts the workspace is empty.
  const hasEvents = data.events.length > 0

  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle="Manage ticket types across your events."
        actions={
          <>
            {hasEvents && (
              <Button variant="primary" className="shrink-0" onClick={openNew}>
                <Icon name="hgi-add-01" size={16} />
                <span className="hidden sm:inline">New ticket type</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
            <HeaderUser />
          </>
        }
      />

      {firstRun ? (
        <Card>
          {/* The kit page has one version of this because it has no data: it
              assumes nothing exists yet and sends the reader to the event
              wizard. Here the loader knows. An organizer with a published event
              and no tiers is the likeliest occupant of this screen, and for
              them the step that unblocks the page is the panel, not a second
              event. Only the closing instruction changes; the first sentence is
              the kit's. */}
          <EmptyState
            icon="hgi-ticket-01"
            title="No ticket types yet"
            actions={
              hasEvents
                ? [
                    { label: 'New ticket type', onClick: openNew, icon: 'hgi-add-01' },
                    { label: 'See all events', to: '/admin/events' },
                  ]
                : [
                    {
                      label: 'Create an event first',
                      to: '/admin/event-form',
                      icon: 'hgi-calendar-add-01',
                    },
                    { label: 'See all events', to: '/admin/events' },
                  ]
            }
          >
            {hasEvents ? (
              <>
                Every ticket type belongs to an event — its price in ฿, how many are available and
                when they go on sale. Add the first tier to one of your events and people can start
                buying it.
              </>
            ) : (
              <>
                Every ticket type belongs to an event — its price in ฿, how many are available and
                when they go on sale. Create an event first, then add the tickets people can buy for
                it.
              </>
            )}
          </EmptyState>
        </Card>
      ) : (
        <>
          <PillTabs<TicketTab>
            items={tabItems(data.tabs)}
            value={(params.get('tab') as TicketTab) ?? 'all'}
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
                  placeholder="Search ticket types…"
                  maxLength={MAX_SEARCH_LENGTH}
                  aria-label="Search ticket types"
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

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.cards.map((card) => (
                <TicketTile
                  key={card.id}
                  card={card}
                  onEdit={() => {
                    setEditing(card)
                    panel.onOpen()
                  }}
                  onShare={() => openShare(card)}
                  onDelete={() => {
                    setDeleting(card)
                    del.onOpen()
                  }}
                  onToggle={() =>
                    mutate.submit(
                      {
                        intent: card.status === 'paused' ? 'resume' : 'pause',
                        eventId: card.eventId,
                        ticketId: card.id,
                      },
                      { method: 'post' },
                    )
                  }
                />
              ))}
              {/* The filters stay on screen — they are what has to change. */}
              {data.cards.length === 0 && (
                <div className="col-span-full">
                  <NoResults noun="ticket types" onClear={clear}>
                    Nothing matches the current search, status tab and event filter. Try widening
                    them to see more ticket types.
                  </NoResults>
                </div>
              )}
            </div>

            <Paginator
              {...data.window}
              noun="ticket types"
              onPage={(page) => set({ page })}
              onSize={(size) => set({ limit: size, page: null })}
            />
          </div>
        </>
      )}

      {mutate.data?.ok === false && (
        <p role="alert" className="mt-3 text-[13px] text-red-500">
          {mutate.data.error}
        </p>
      )}

      <PageFooter />

      <TicketPanel
        open={panel.open}
        onClose={panel.onClose}
        editing={editing}
        events={data.events}
      />

      <TicketQrModal
        open={qr.open}
        onClose={qr.onClose}
        ticketName={sharing?.name ?? 'Ticket'}
        eventName={sharing?.event ?? ''}
        // Only this tier's answer counts. The fetcher still holds the last
        // one, and showing tier A's QR under tier B's name is a link that
        // sells the wrong ticket.
        share={share.data && share.data.ticketId === sharing?.id ? share.data : null}
        error={share.state === 'idle' && !share.data ? SHARE_FAILED : null}
      />

      <DeleteTicketModal open={del.open} onClose={del.onClose} target={deleting} />
    </>
  )
}

const SHARE_FAILED = "That link couldn't be prepared. Close this and try again."

function tabItems(counts: TabCounts): PillTabItem<TicketTab>[] {
  return [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'onsale', label: 'On sale', count: counts.onsale },
    { value: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { value: 'paused', label: 'Paused', count: counts.paused },
    { value: 'soldout', label: 'Sold out', count: counts.soldout },
  ]
}

interface TicketTileProps {
  card: TicketCard
  onEdit: () => void
  onShare: () => void
  onDelete: () => void
  onToggle: () => void
}

function TicketTile({ card, onEdit, onShare, onDelete, onToggle }: TicketTileProps) {
  const paused = card.status === 'paused'

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', card.iconTint)}>
            <Icon name="hgi-ticket-01" size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">{card.name}</p>
            <p className="truncate text-[11px] text-muted">{card.event}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-icon shrink-0"
          title={paused ? 'Resume sales' : 'Pause sales'}
          onClick={onToggle}
        >
          <Icon name={paused ? 'hgi-play' : 'hgi-pause'} size={16} />
        </button>
      </div>

      <div className="flex items-end justify-between">
        {card.isFree ? (
          <Badge tone="green">
            <Icon name="hgi-tick-02" size={12} />
            Free
          </Badge>
        ) : (
          <p className="tnum text-[22px] font-bold tracking-tight">{card.price}</p>
        )}
        <Badge tone={card.statusTone}>
          <Icon name={card.statusIcon} size={12} />
          {card.statusLabel}
        </Badge>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span className="tnum">{card.soldLabel}</span>
          {card.percent !== null && <span className="tnum">{card.percent}%</span>}
        </div>
        {card.percent === null ? (
          <p className="text-[11px] text-muted">Unlimited</p>
        ) : (
          <div className="h-1.5 w-full rounded-full bg-line">
            <div className="h-1.5 rounded-full bg-brand" style={{ width: `${card.percent}%` }} />
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 border-t border-hair pt-3">
        <button type="button" className="btn btn-soft btn-sm flex-1" onClick={onEdit}>
          <Icon name="hgi-edit-02" size={14} />
          Edit
        </button>
        <button type="button" className="btn-icon" title="Share link & QR" onClick={onShare}>
          <Icon name="hgi-qr-code-01" size={16} />
        </button>
        <button type="button" className="btn-icon" title="Delete" onClick={onDelete}>
          <Icon name="hgi-delete-02" size={16} />
        </button>
      </div>
    </div>
  )
}

/**
 * Deleting a tier.
 *
 * The API refuses once a tier has sold — it answers 409 with the reason, which
 * the modal shows verbatim rather than paraphrasing, because "retire it
 * instead" is an instruction written for the person reading it.
 */
function DeleteTicketModal({
  open,
  onClose,
  target,
}: {
  open: boolean
  onClose: () => void
  target: TicketCard | null
}) {
  const fetcher = useFetcher<ActionResult>()
  const refused = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (done && open) onClose()
  }, [done, open, onClose])

  return (
    <ConfirmDeleteModal
      open={open}
      onClose={onClose}
      title="Delete ticket type?"
      message={
        refused ??
        'This permanently removes the ticket type. Attendees who already hold one are not affected.'
      }
      tone={refused ? 'error' : 'default'}
      confirmLabel={fetcher.state === 'idle' ? 'Delete' : 'Deleting…'}
      onConfirm={() =>
        target &&
        fetcher.submit(
          { intent: 'delete', eventId: target.eventId, ticketId: target.id },
          { method: 'post' },
        )
      }
    />
  )
}
