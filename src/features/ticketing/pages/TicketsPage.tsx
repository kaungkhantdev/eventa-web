import { useMemo, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Badge,
  Icon,
  Panel,
  PillTabs,
  Label,
  Hint,
  Input,
  Select,
  Textarea,
  type PillTabItem,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { baht, num } from '@/lib/format'
import { useDisclosure } from '@/lib/useDisclosure'
import { TICKETS, TICKET_STATUS_META, type Ticket } from '../data/tickets'
import { EVENT_NAMES, EVENT_PICKER_OPTIONS } from '../data/events'
import type { TicketStatus } from '../types'
import { ToggleSwitch } from '../components/ToggleSwitch'
import { TicketQrModal } from '../components/TicketQrModal'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'

type TicketTab = 'all' | TicketStatus

export default function TicketsPage() {
  const [tab, setTab] = useState<TicketTab>('all')
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('')

  // Panel / modal disclosure state (replaces shell.js data-open wiring).
  const ticketPanel = useDisclosure()
  const delModal = useDisclosure()
  const qrModal = useDisclosure()
  const [qrTicket, setQrTicket] = useState<Ticket | null>(null)

  // New-ticket panel: Paid/Free segmented + Transferable toggle.
  const [ticketType, setTicketType] = useState<'paid' | 'free'>('paid')
  const [transferable, setTransferable] = useState(true)

  const counts = useMemo(() => {
    const c: Record<TicketStatus, number> = { onsale: 0, scheduled: 0, paused: 0, soldout: 0 }
    for (const t of TICKETS) c[t.status]++
    return c
  }, [])

  const tabs: PillTabItem<TicketTab>[] = [
    { value: 'all', label: 'All', count: TICKETS.length },
    { value: 'onsale', label: 'On sale', count: counts.onsale },
    { value: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { value: 'paused', label: 'Paused', count: counts.paused },
    { value: 'soldout', label: 'Sold out', count: counts.soldout },
  ]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TICKETS.filter(
      (t) =>
        (tab === 'all' || t.status === tab) &&
        (!eventFilter || t.event === eventFilter) &&
        (!q || t.name.toLowerCase().includes(q) || t.event.toLowerCase().includes(q)),
    )
  }, [tab, query, eventFilter])

  const openQr = (t: Ticket) => {
    setQrTicket(t)
    qrModal.onOpen()
  }

  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle="Manage ticket types across your events."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={ticketPanel.onOpen}>
              <Icon name="hgi-add-01" size={16} />
              <span className="hidden sm:inline">New ticket type</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* pill tabs */}
      <PillTabs items={tabs} value={tab} onChange={setTab} />

      {/* search + filter */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search ticket types…"
          />
        </div>
        <div className="relative w-full sm:w-56">
          <i className="hgi-stroke hgi-calendar-03 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
          <select
            value={eventFilter || 'All events'}
            onChange={(e) => setEventFilter(e.target.value === 'All events' ? '' : e.target.value)}
            className="select h-10 w-full border-0 bg-surface pl-9 text-[14px] font-semibold"
          >
            {EVENT_PICKER_OPTIONS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ticket type cards */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t) => {
          const meta = TICKET_STATUS_META[t.status]
          const pct = t.total ? Math.round((t.sold / t.total) * 100) : 0
          return (
            <div key={t.id} className="card flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', t.iconClass)}
                  >
                    <Icon name="hgi-ticket-01" size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-ink">{t.name}</p>
                    <p className="truncate text-[11px] text-muted">{t.event}</p>
                  </div>
                </div>
                <button type="button" className="btn-icon shrink-0" title="More">
                  <Icon name="hgi-more-vertical" size={16} />
                </button>
              </div>
              <div className="flex items-end justify-between">
                {t.free ? (
                  <Badge tone="green">
                    <Icon name="hgi-tick-02" size={12} />
                    Free
                  </Badge>
                ) : (
                  <p className="text-[22px] font-bold tracking-tight tnum">{baht(t.price)}</p>
                )}
                <Badge tone={meta.tone}>
                  <Icon name={meta.icon} size={12} />
                  {meta.label}
                </Badge>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                  <span className="tnum">
                    {num(t.sold)} / {num(t.total)} sold
                  </span>
                  <span className="tnum">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-line">
                  <div className="h-1.5 rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="mt-1 flex items-center gap-2 border-t border-hair pt-3">
                <button
                  type="button"
                  className="btn btn-soft btn-sm flex-1"
                  onClick={ticketPanel.onOpen}
                >
                  <Icon name="hgi-edit-02" size={14} />
                  Edit
                </button>
                <button type="button" className="btn-icon" title="QR code" onClick={() => openQr(t)}>
                  <Icon name="hgi-qr-code-01" size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  title="Delete"
                  onClick={delModal.onOpen}
                >
                  <Icon name="hgi-delete-02" size={16} />
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-10 text-center text-[13px] text-muted">No matches.</div>
        )}
      </div>

      <PageFooter />

      {/* New / edit ticket type panel */}
      <Panel
        open={ticketPanel.open}
        onClose={ticketPanel.onClose}
        title="New ticket type"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={ticketPanel.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={ticketPanel.onClose}>
              Save ticket type
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Ticket name</Label>
            <Input type="text" placeholder="e.g. VIP Access" />
          </div>
          <div>
            <Label>Event</Label>
            <Select defaultValue="Tech Summit 2026">
              {EVENT_NAMES.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <div className="segmented w-full">
              <button
                type="button"
                className={cn('flex-1', ticketType === 'paid' && 'active')}
                onClick={() => setTicketType('paid')}
              >
                Paid
              </button>
              <button
                type="button"
                className={cn('flex-1', ticketType === 'free' && 'active')}
                onClick={() => setTicketType('free')}
              >
                Free
              </button>
            </div>
          </div>
          {ticketType === 'paid' && (
            <div>
              <Label>Price (฿)</Label>
              <Input type="number" min={0} step={1} placeholder="1250" />
            </div>
          )}
          <div>
            <Label>Quantity available</Label>
            <Input type="number" min={0} step={1} placeholder="250" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sales start</Label>
              <Input type="date" />
            </div>
            <div>
              <Label>Sales end</Label>
              <Input type="date" />
            </div>
          </div>
          <div>
            <Label>Per-order limit</Label>
            <Input type="number" min={1} step={1} placeholder="4" />
            <Hint>Maximum tickets a single order can include.</Hint>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea placeholder="What's included with this ticket…" />
          </div>
          <div className="flex items-center justify-between border-t border-hair pt-4">
            <div>
              <p className="text-[13px] font-medium text-ink">Transferable</p>
              <Hint className="mt-0.5">Allow this ticket to be transferred to another attendee</Hint>
            </div>
            <ToggleSwitch checked={transferable} onChange={setTransferable} />
          </div>
        </div>
      </Panel>

      {/* Share ticket type (registration QR) modal */}
      <TicketQrModal
        open={qrModal.open}
        onClose={qrModal.onClose}
        ticketName={qrTicket?.name ?? 'Ticket'}
        eventName={qrTicket?.event ?? ''}
      />

      {/* Delete confirm modal */}
      <ConfirmDeleteModal
        open={delModal.open}
        onClose={delModal.onClose}
        title="Delete ticket type?"
        message="This will permanently remove the ticket type. Attendees who already hold this ticket won't be affected."
      />
    </>
  )
}
