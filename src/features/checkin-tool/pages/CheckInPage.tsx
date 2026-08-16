import { useFetcher, useLoaderData } from 'react-router'
import {
  ButtonLink,
  Card,
  DataTable,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  Paginator,
  PillTabs,
  type PillTabItem,
} from '@/components/ui'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import type { ActionResult } from '@/app/loaders'
import { EventChooser } from '../components/EventChooser'
import type { QueueData } from '../door.routes'
import type { AttendanceRow, DoorCounts } from '../door.types'

/**
 * The attendance record for one event (US-REG-11). Ported from check-in.html.
 *
 * The tab, the search and the page live in the URL, because the API pages and
 * filters server-side: the counts on the tabs are the whole event's, not the
 * rows that happen to be loaded, and the two must not disagree.
 */

/** `''` is the third tab — everyone, which the API spells by asking for neither. */
type StatusTab = '' | 'checked_in' | 'expected'

export default function CheckInPage() {
  const data = useLoaderData() as QueueData
  const { params, set } = useFilters()
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (next) =>
    set({ q: next || null, page: null }, { replace: true }),
  )
  const status = (params.get('status') ?? '') as StatusTab

  const tabs: PillTabItem<StatusTab>[] = [
    { value: '', label: 'All', count: data.counts.total },
    { value: 'checked_in', label: 'Checked in', count: data.counts.checkedIn },
    { value: 'expected', label: 'Not yet', count: data.counts.expected },
  ]

  return (
    <>
      <PageHeader
        title="Check-in"
        subtitle="The attendance record for your event."
        actions={
          <>
            <EventChooser
              events={data.events}
              value={data.event?.id ?? ''}
              onChange={(eventId) => set({ eventId, page: null })}
            />
            <ButtonLink
              to={`/admin/check-in-tool${data.event ? `?eventId=${data.event.id}` : ''}`}
              variant="primary"
              className="shrink-0"
            >
              <Icon name="hgi-qr-code-01" />
              <span className="hidden sm:inline">Open check-in tool</span>
              <span className="sm:hidden">Tool</span>
            </ButtonLink>
            <HeaderUser />
          </>
        }
      />

      <ProgressStrip counts={data.counts} />

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PillTabs
          items={tabs}
          value={status}
          onChange={(next) => set({ status: next || null, page: null })}
        />

        <div className="relative w-full sm:w-72">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Search attendees"
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search name, email or ticket…"
          />
        </div>
      </div>

      <Card className="mt-3 p-4">
        <div className="overflow-x-auto">
          <DataTable className="min-w-[760px]">
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
              {data.rows.map((row) => (
                <AttendeeRow key={row.ticketId} row={row} eventId={data.event?.id ?? ''} />
              ))}
            </tbody>
          </DataTable>
        </div>

        {data.rows.length === 0 && (
          <p className="py-10 text-center text-[13px] text-muted">
            {data.event ? 'Nobody matches these filters.' : 'Create an event to check people in.'}
          </p>
        )}

        <Paginator
          {...data.window}
          noun="attendees"
          onPage={(page) => set({ page })}
          onSize={(size) => set({ limit: size, page: null })}
        />
      </Card>

      <PageFooter />
    </>
  )
}

function ProgressStrip({ counts }: { counts: DoorCounts }) {
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] text-muted">
          <span className="text-[17px] font-bold text-ink tnum">{counts.checkedIn}</span> /{' '}
          <span className="tnum">{counts.total}</span> attendees checked in
        </p>
        <p className="text-[13px] font-bold text-brand tnum">{counts.percent}%</p>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-line">
        <div
          className="h-2 rounded-full bg-brand transition-all"
          style={{ width: `${counts.percent}%` }}
        />
      </div>
    </Card>
  )
}

function AttendeeRow({ row, eventId }: { row: AttendanceRow; eventId: string }) {
  const act = useFetcher<ActionResult>()
  const busy = act.state !== 'idle'

  return (
    <tr>
      <td>
        <div className="flex items-center gap-2.5">
          <span className="avatar h-8 w-8 text-[11px]">{row.initials}</span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.name}</p>
            {row.email && <p className="truncate text-[11px] text-muted">{row.email}</p>}
          </div>
        </div>
      </td>
      <td>
        <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-medium text-muted">
          {row.ticketType}
        </span>
      </td>
      <td className="text-muted tnum">{row.time}</td>
      <td>
        {row.checkedIn ? (
          <span className="badge badge-green">
            <i className="hgi-stroke hgi-tick-02 text-[12px]" />
            Checked in
          </span>
        ) : (
          <span className="badge badge-gray">Not checked in</span>
        )}
        {act.data?.ok === false && (
          <p role="alert" className="mt-1 text-[11px] text-red-500">
            {act.data.error}
          </p>
        )}
      </td>
      <td className="text-right">
        <act.Form method="post" className="inline">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="ticketId" value={row.ticketId} />
          <input type="hidden" name="intent" value={row.checkedIn ? 'undo' : 'admit'} />
          <button
            type="submit"
            disabled={busy}
            className={row.checkedIn ? 'btn btn-soft btn-sm' : 'btn btn-primary btn-sm'}
          >
            <i
              className={`hgi-stroke text-[14px] ${
                row.checkedIn ? 'hgi-arrow-turn-backward' : 'hgi-tick-02'
              }`}
            />
            {row.checkedIn ? 'Undo' : 'Check in'}
          </button>
        </act.Form>
      </td>
    </tr>
  )
}
