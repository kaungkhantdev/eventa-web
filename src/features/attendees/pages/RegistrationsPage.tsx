import { useEffect, useMemo, useState } from 'react'
import { useFetcher, useLoaderData, useRouteLoaderData } from 'react-router'
import {
  Button,
  Card,
  HeaderUser,
  Hint,
  Icon,
  Input,
  Label,
  PageFooter,
  PageHeader,
  Panel,
  PillTabs,
  Select,
  type PillTabItem,
} from '@/components/ui'
import { ADMIN_ROUTE_ID, type ActionResult } from '@/app/loaders'
import { can } from '@/features/auth/permissions'
import type { Me } from '@/features/auth/types'
import { cn } from '@/lib/cn'
import { num } from '@/lib/format'
import { PAGE_SIZES, type PageWindow } from '@/lib/paging'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import { STATUS_BADGE } from '../registrations.presentation'
import {
  REG_TABS,
  type EventOption,
  type RegTab,
  type RegistrationsData,
  type TabCounts,
  type TierOption,
} from '../registrations.routes'
import type { Registration } from '../registrations.types'

/* admin/registrations.html — the organizer's approval queue (US-REG-01..03).

   The tab, event, search and page live in the URL: the API filters and pages
   server-side, so nothing is re-filtered here. The count on each pill and the
   rows below it come from one response and cannot disagree.

   Two controls from the static kit are gone rather than faked: the ticket-type
   filter, which `GET /registrations` does not offer (narrowing one page of a
   server-paged list would print counts that contradict the rows), and the
   panel's Notes field, which has nowhere to be stored. */

const ALL_EVENTS = 'All events'

/** What the API's `search` accepts; longer and it answers 400 (`@MaxLength`). */
const MAX_SEARCH_LENGTH = 120

const TAB_LABEL: Record<RegTab, string> = {
  all: 'All',
  pending: 'Pending',
  waitlist: 'Waitlist',
  cancelled: 'Cancelled',
}

export default function RegistrationsPage() {
  const data = useLoaderData() as RegistrationsData
  const { params, set } = useFilters()
  const filtering = useIsFiltering()
  const panel = useDisclosure()
  const me = (useRouteLoaderData(ADMIN_ROUTE_ID) as { me: Me } | undefined)?.me ?? null

  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))
  const canManage = can(me, 'regManage')

  return (
    <>
      <PageHeader
        title="Registrations"
        subtitle="Manage attendee registrations & approvals."
        actions={
          <>
            {canManage && (
              <Button variant="primary" onClick={panel.onOpen}>
                <Icon name="hgi-user-add-01" />
                <span className="hidden sm:inline">Add registration</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
            <HeaderUser />
          </>
        }
      />

      <PillTabs<RegTab>
        items={tabItems(data.tabs)}
        value={(params.get('tab') as RegTab) ?? 'all'}
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
              placeholder="Search attendee, email or order ID…"
              maxLength={MAX_SEARCH_LENGTH}
              aria-label="Search registrations"
            />
          </div>
          <div className="relative w-full sm:w-52">
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

        <QueueTable
          rows={data.rows}
          range={data.window}
          canManage={canManage}
          onPage={(page) => set({ page })}
          onSize={(limit) => set({ limit })}
        />
      </div>

      <PageFooter />

      {panel.open && (
        <AddRegistrationPanel
          events={data.events}
          tiers={data.tiers}
          onClose={panel.onClose}
        />
      )}
    </>
  )
}

function tabItems(counts: TabCounts): PillTabItem<RegTab>[] {
  return REG_TABS.map((value) => ({ value, label: TAB_LABEL[value], count: counts[value] }))
}

function QueueTable({
  rows,
  range,
  canManage,
  onPage,
  onSize,
}: {
  rows: Registration[]
  range: PageWindow
  canManage: boolean
  onPage: (page: number) => void
  onSize: (size: number) => void
}) {
  return (
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
            {rows.length ? (
              rows.map((row) => <QueueRow key={row.id} r={row} canManage={canManage} />)
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

      <PageNumbers range={range} onPage={onPage} onSize={onSize} />
    </Card>
  )
}

function QueueRow({ r, canManage }: { r: Registration; canManage: boolean }) {
  const badge = STATUS_BADGE[r.status]
  const decide = useFetcher<ActionResult>()
  const refusal = decide.data?.ok === false ? decide.data.error : null

  return (
    <>
      <tr>
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
          <span className={cn('badge', badge.cls)}>
            <i className={cn('hgi-stroke', badge.icon, 'text-[12px]')} />
            {r.status}
          </span>
        </td>
        <td className="text-right">
          <div className="flex items-center justify-end gap-1">
            {canManage && <DecideButtons row={r} fetcher={decide} />}
          </div>
        </td>
      </tr>
      {/* The API decides what may be done and writes the refusal for the person
          reading it — "money has been captured, cancel and refund it instead".
          Shown verbatim, under the row it belongs to. */}
      {refusal && (
        <tr>
          <td colSpan={7} className="pt-0">
            <p role="alert" className="text-[12px] leading-snug text-red-500">
              {refusal}
            </p>
          </td>
        </tr>
      )}
    </>
  )
}

/**
 * Approve and reject, each disabled with the API's own reason as its tooltip.
 * `canApprove` only tidies the UI — the server refuses regardless, and that
 * refusal is what the row shows.
 */
function DecideButtons({
  row,
  fetcher,
}: {
  row: Registration
  fetcher: ReturnType<typeof useFetcher<ActionResult>>
}) {
  const busy = fetcher.state !== 'idle'

  return (
    <fetcher.Form method="post" className="flex items-center gap-1">
      <input type="hidden" name="id" value={row.id} />
      <button
        type="submit"
        name="intent"
        value="approve"
        disabled={!row.canApprove || busy}
        title={row.approveBlockedReason ?? 'Approve'}
        className="btn-icon text-brand disabled:cursor-not-allowed disabled:opacity-40"
      >
        <i className="hgi-stroke hgi-checkmark-circle-02 text-[16px]" />
        <span className="sr-only">Approve {row.name}</span>
      </button>
      <button
        type="submit"
        name="intent"
        value="reject"
        disabled={!row.canReject || busy}
        title={row.rejectBlockedReason ?? 'Reject'}
        className="btn-icon text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400"
      >
        <i className="hgi-stroke hgi-cancel-circle text-[16px]" />
        <span className="sr-only">Reject {row.name}</span>
      </button>
    </fetcher.Form>
  )
}

/**
 * A booking taken at the door or over the phone (US-REG-03).
 *
 * It carries no amount: the API prices the tier and applies the workspace's VAT
 * at the moment it saves, so an organizer cannot mistype a price or bill the
 * wrong tax.
 */
function AddRegistrationPanel({
  events,
  tiers,
  onClose,
}: {
  events: EventOption[]
  tiers: TierOption[]
  onClose: () => void
}) {
  const fetcher = useFetcher<ActionResult>()
  const [eventId, setEventId] = useState(events[0]?.id ?? '')
  const busy = fetcher.state !== 'idle'
  const refusal = fetcher.data?.ok === false ? fetcher.data.error : null

  // Only the chosen event's tiers can be booked; the API rejects a mismatch.
  const forEvent = useMemo(() => tiers.filter((t) => t.eventId === eventId), [tiers, eventId])

  // The panel is closed by the save landing, not by the click — a refusal has to
  // stay on screen, next to the fields that caused it.
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.ok) onClose()
  }, [fetcher.state, fetcher.data, onClose])

  return (
    <Panel
      open
      onClose={onClose}
      title="Add registration"
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            type="submit"
            form="add-registration"
            disabled={busy || !forEvent.length}
          >
            {busy ? 'Saving…' : 'Save registration'}
          </Button>
        </>
      }
    >
      <fetcher.Form method="post" id="add-registration" className="space-y-4">
        <input type="hidden" name="intent" value="add" />
        <div>
          <Label htmlFor="reg-name">Attendee name</Label>
          <Input id="reg-name" name="name" type="text" required placeholder="e.g. Anong Phromsri" />
        </div>
        <div>
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            name="email"
            type="email"
            required
            placeholder="attendee@email.com"
          />
        </div>
        <div>
          <Label htmlFor="reg-phone">Phone</Label>
          <Input id="reg-phone" name="phone" type="tel" placeholder="+66 81 234 5678" />
        </div>
        <div>
          <Label htmlFor="reg-event">Event</Label>
          <Select
            id="reg-event"
            name="eventId"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="reg-tier">Ticket type</Label>
          <Select id="reg-tier" name="ticketTypeId" disabled={!forEvent.length}>
            {forEvent.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.label}
              </option>
            ))}
          </Select>
          {!forEvent.length && (
            <Hint className="mt-1">This event has no ticket types to book yet.</Hint>
          )}
        </div>
        <div>
          <Label htmlFor="reg-qty">Quantity</Label>
          <Input id="reg-qty" name="quantity" type="number" defaultValue={1} min={1} />
        </div>
        <label className="flex items-center justify-between rounded-lg border border-hair p-3">
          <span>
            <span className="block text-[13px] font-semibold text-ink">
              Send confirmation email
            </span>
            <Hint className="mt-0.5">Attendee will receive a ticket &amp; QR code.</Hint>
          </span>
          <input
            type="checkbox"
            name="sendConfirmation"
            defaultChecked
            className="h-4 w-4 accent-brand"
          />
        </label>
        {refusal && (
          <p role="alert" className="text-[12px] leading-snug text-red-500">
            {refusal}
          </p>
        )}
      </fetcher.Form>
    </Panel>
  )
}

function PageNumbers({
  range,
  onPage,
  onSize,
}: {
  range: PageWindow
  onPage: (page: number) => void
  onSize: (size: number) => void
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
      <p>
        {range.total === 0 ? (
          'No registrations'
        ) : (
          <>
            Showing{' '}
            <span className="font-semibold text-ink">
              {range.from}–{range.to}
            </span>{' '}
            of <span className="font-semibold text-ink tnum">{num(range.total)}</span> registrations
          </>
        )}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 whitespace-nowrap">
          Rows per page
          <select
            value={range.size}
            onChange={(e) => onSize(Number(e.target.value))}
            className="select h-8 w-auto min-w-[3.75rem] py-0 pl-2.5 pr-7 text-[12px] font-medium text-ink"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-label="Previous page"
            disabled={range.page <= 1}
            onClick={() => onPage(range.page - 1)}
          >
            <Icon name="hgi-arrow-left-01" size={14} />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-label="Next page"
            disabled={range.page >= range.pageCount}
            onClick={() => onPage(range.page + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <Icon name="hgi-arrow-right-01" size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
