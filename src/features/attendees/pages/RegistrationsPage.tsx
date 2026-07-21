import { useEffect, useMemo, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Icon,
  Card,
  Panel,
  PillTabs,
  EventPicker,
  Paginator,
  usePagination,
  Label,
  Input,
  Select,
  Textarea,
  Hint,
  type PillTabItem,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import {
  REGISTRATIONS,
  REG_STATUS_BADGE,
  REG_TAB_STATUS,
  REG_EVENTS,
  REG_TICKETS,
  type RegTab,
} from '../data/registrations'

export default function RegistrationsPage() {
  const panel = useDisclosure()
  const [sendConfirm, setSendConfirm] = useState(true)

  const [q, setQ] = useState('')
  const [tab, setTab] = useState<RegTab>('all')
  const [eventFilter, setEventFilter] = useState('All events')
  const [ticketFilter, setTicketFilter] = useState('All ticket types')

  const counts = useMemo(
    () => ({
      all: REGISTRATIONS.length,
      pending: REGISTRATIONS.filter((r) => r.status === 'Pending').length,
      waitlist: REGISTRATIONS.filter((r) => r.status === 'Waitlisted').length,
      cancelled: REGISTRATIONS.filter((r) => r.status === 'Cancelled').length,
    }),
    [],
  )

  const tabs: PillTabItem<RegTab>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'waitlist', label: 'Waitlist', count: counts.waitlist },
    { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ]

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return REGISTRATIONS.filter((r) => tab === 'all' || r.status === REG_TAB_STATUS[tab])
      .filter((r) => eventFilter === 'All events' || r.event === eventFilter)
      .filter((r) => ticketFilter === 'All ticket types' || r.ticket === ticketFilter)
      .filter(
        (r) =>
          !query || r.name.toLowerCase().includes(query) || r.email.toLowerCase().includes(query),
      )
  }, [q, tab, eventFilter, ticketFilter])

  const pager = usePagination(filtered)
  const { setPage } = pager
  useEffect(() => setPage(1), [q, tab, eventFilter, ticketFilter, setPage])

  return (
    <>
      <PageHeader
        title="Registrations"
        subtitle="Manage attendee registrations & approvals."
        actions={
          <>
            <Button variant="ghost">
              <Icon name="hgi-download-01" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="primary" onClick={panel.onOpen}>
              <Icon name="hgi-user-add-01" />
              <span className="hidden sm:inline">Add registration</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* pill tabs (out of table) */}
      <PillTabs items={tabs} value={tab} onChange={setTab} />

      {/* search + filters (out of table) */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search attendee, email or order ID…"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <EventPicker
              value={eventFilter}
              onChange={setEventFilter}
              className="h-10 w-full border-0 bg-surface text-[14px] font-semibold sm:w-52"
            />
          </div>
          <div className="relative flex-1 sm:flex-none">
            <i className="hgi-stroke hgi-ticket-01 text-[15px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value)}
              className="select h-10 w-full border-0 bg-surface pl-9 font-medium sm:w-44"
            >
              <option>All ticket types</option>
              {REG_TICKETS.map((tk) => (
                <option key={tk}>{tk}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* table */}
      <Card className="mt-3 p-4">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Event</th>
                <th>Ticket</th>
                <th>Registered</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length ? (
                pager.slice.map((r) => {
                  const sb = REG_STATUS_BADGE[r.status]
                  return (
                    <tr key={r.email + r.event}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="avatar h-8 w-8 text-[11px]">{r.initials}</span>
                          <div className="leading-tight">
                            <p className="font-medium text-ink">{r.name}</p>
                            <p className="text-[11px] text-muted">{r.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted">{r.event}</td>
                      <td className="text-muted">{r.ticket}</td>
                      <td className="text-muted tnum">{r.date}</td>
                      {r.amount === 'Free' ? (
                        <td>
                          <span className="badge badge-green">Free</span>
                        </td>
                      ) : (
                        <td className="font-semibold text-ink tnum">{r.amount}</td>
                      )}
                      <td>
                        <span className={cn('badge', sb.cls)}>
                          <i className={cn('hgi-stroke', sb.icon, 'text-[12px]')} />
                          {r.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'Pending' && (
                            <>
                              <button className="btn-icon text-brand" title="Approve">
                                <i className="hgi-stroke hgi-checkmark-circle-02 text-[16px]" />
                              </button>
                              <button
                                className="btn-icon text-red-500 dark:text-red-400"
                                title="Reject"
                              >
                                <i className="hgi-stroke hgi-cancel-circle text-[16px]" />
                              </button>
                            </>
                          )}
                          <button className="btn-icon" title="View">
                            <i className="hgi-stroke hgi-eye text-[16px]" />
                          </button>
                          <button className="btn-icon" title="More">
                            <i className="hgi-stroke hgi-more-vertical text-[16px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="py-10 text-center text-[13px] text-muted">No matches.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          pageCount={pager.pageCount}
          size={pager.size}
          onPage={pager.setPage}
          onSize={pager.setSize}
          noun="registrations"
        />
      </Card>

      <PageFooter />

      {/* Add registration slide-over */}
      <Panel
        open={panel.open}
        onClose={panel.onClose}
        title="Add registration"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={panel.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={panel.onClose}>
              Save registration
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Attendee name</Label>
            <Input type="text" placeholder="e.g. Anong Phromsri" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="attendee@email.com" />
          </div>
          <div>
            <Label>Event</Label>
            <Select defaultValue={REG_EVENTS[0]}>
              {REG_EVENTS.map((ev) => (
                <option key={ev}>{ev}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Ticket type</Label>
            <Select defaultValue={REG_TICKETS[0]}>
              {REG_TICKETS.map((tk) => (
                <option key={tk}>{tk}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input type="number" defaultValue={1} min={1} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-hair p-3">
            <div>
              <p className="text-[13px] font-semibold text-ink">Send confirmation email</p>
              <Hint className="mt-0.5">Attendee will receive a ticket & QR code.</Hint>
            </div>
            <button
              type="button"
              onClick={() => setSendConfirm((v) => !v)}
              className={cn(
                'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
                sendConfirm ? 'bg-brand' : 'bg-line',
              )}
            >
              <span
                className={cn(
                  'h-4 w-4 rounded-full bg-white shadow transition-transform',
                  sendConfirm ? 'translate-x-4' : 'translate-x-0',
                )}
              />
            </button>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea placeholder="Optional internal note…" />
          </div>
        </div>
      </Panel>
    </>
  )
}
