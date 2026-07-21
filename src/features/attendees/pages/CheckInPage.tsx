import { useEffect, useMemo, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  ButtonLink,
  Icon,
  Card,
  PillTabs,
  Paginator,
  usePagination,
  EventPicker,
  type PillTabItem,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  CHECKIN_ATTENDEES,
  TONE,
  CHECKIN_TICKETS,
  type CheckinAttendee,
  type CheckinFilter,
} from '../data/checkin'

type Row = CheckinAttendee & { id: number }

function nowTime(): string {
  const d = new Date()
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

export default function CheckInPage() {
  const [rows, setRows] = useState<Row[]>(() => CHECKIN_ATTENDEES.map((a, i) => ({ ...a, id: i })))
  const [event, setEvent] = useState<string>('Tech Summit 2026')
  const [filter, setFilter] = useState<CheckinFilter>('all')
  const [q, setQ] = useState('')
  const [ticket, setTicket] = useState('') // '' = all ticket types

  const inCount = rows.filter((a) => a.in).length
  const total = rows.length
  const pct = total ? Math.round((inCount / total) * 100) : 0

  const tabs: PillTabItem<CheckinFilter>[] = [
    { value: 'all', label: 'All', count: total },
    { value: 'in', label: 'Checked in', count: inCount },
    { value: 'notyet', label: 'Not yet', count: total - inCount },
  ]

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return rows.filter((a) => {
      if (filter === 'in' && !a.in) return false
      if (filter === 'notyet' && a.in) return false
      if (ticket && a.ticket !== ticket) return false
      if (query && (a.name + ' ' + a.email + ' ' + a.ticket).toLowerCase().indexOf(query) === -1)
        return false
      return true
    })
  }, [rows, filter, ticket, q])

  const pager = usePagination(filtered)
  const { setPage } = pager
  useEffect(() => setPage(1), [q, ticket, filter, setPage])

  function checkIn(id: number) {
    setRows((rs) => rs.map((a) => (a.id === id ? { ...a, in: true, time: nowTime() } : a)))
  }
  function undo(id: number) {
    setRows((rs) => rs.map((a) => (a.id === id ? { ...a, in: false, time: '' } : a)))
  }

  return (
    <>
      <PageHeader
        title="Check-in"
        subtitle="The attendance record for your event."
        actions={
          <>
            <div className="relative w-40 sm:w-52">
              <EventPicker
                value={event}
                onChange={setEvent}
                allLabel={false}
                className="h-10 w-full border-0 bg-surface text-[14px] font-semibold"
              />
            </div>
            <ButtonLink to="/admin/check-in-tool" variant="primary" className="shrink-0">
              <Icon name="hgi-qr-code-01" />
              <span className="hidden sm:inline">Open check-in tool</span>
              <span className="sm:hidden">Tool</span>
            </ButtonLink>
            <HeaderUser />
          </>
        }
      />

      {/* progress strip */}
      <Card className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[13px] text-muted">
            <span className="text-[17px] font-bold text-ink tnum">{inCount}</span> /{' '}
            <span className="tnum">{total}</span> attendees checked in
          </p>
          <p className="text-[13px] font-bold text-brand tnum">{pct}%</p>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-line">
          <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      {/* tabs (left) + search & filter (right) */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PillTabs items={tabs} value={filter} onChange={setFilter} />

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:flex-1 lg:w-72 lg:flex-none">
            <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
              placeholder="Search attendee, email or ticket…"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <i className="hgi-stroke hgi-ticket-01 text-[15px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
            >
              <option value="">All ticket types</option>
              {CHECKIN_TICKETS.map((tk) => (
                <option key={tk}>{tk}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* table */}
      <Card className="mt-3 p-4">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Ticket</th>
                <th>Checked in</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                          TONE[a.tone],
                        )}
                      >
                        {a.ini}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{a.name}</p>
                        <p className="truncate text-[11px] text-muted">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-medium text-muted">
                      {a.ticket}
                    </span>
                  </td>
                  <td className="text-muted tnum">{a.time || '—'}</td>
                  <td>
                    {a.in ? (
                      <span className="badge badge-green">
                        <i className="hgi-stroke hgi-tick-02 text-[12px]" />
                        Checked in
                      </span>
                    ) : (
                      <span className="badge badge-gray">Not checked in</span>
                    )}
                  </td>
                  <td className="text-right">
                    {a.in ? (
                      <button className="btn btn-soft btn-sm" onClick={() => undo(a.id)}>
                        <i className="hgi-stroke hgi-arrow-turn-backward text-[14px]" />
                        Undo
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => checkIn(a.id)}>
                        <i className="hgi-stroke hgi-tick-02 text-[14px]" />
                        Check in
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-[13px] text-muted">
            No attendees match your filters.
          </p>
        )}

        <Paginator
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          pageCount={pager.pageCount}
          size={pager.size}
          onPage={pager.setPage}
          onSize={pager.setSize}
          noun="attendees"
        />
      </Card>

      <PageFooter />
    </>
  )
}
