import { useEffect } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Button,
  Card,
  EmptyState,
  HeaderUser,
  Hint,
  Icon,
  Input,
  Label,
  NoResults,
  PageFooter,
  PageHeader,
  Paginator,
  Panel,
  PastEnd,
  PillTabs,
  Select,
  Textarea,
  type PillTabItem,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import type { ActionResult } from '@/app/loaders'
import { TAGS, type DirectoryData } from '../directory.routes'
import type { AttendeeRow, AttendeeSegment, AttendeeSort } from '../directory.types'

/**
 * The attendee directory (US-CHK-06/07). Layout ported from attendees.html.
 *
 * Every filter and the sort are URL parameters the API applies across the whole
 * directory — 390 people do not fit on a page, and sorting the ten that arrived
 * would put the wrong name at the top.
 */

const ALL_TAGS = 'All tags'
const MAX_SEARCH_LENGTH = 120

/** What the loader sorts by when the URL says nothing — see `SORTS`. */
const DEFAULT_SORT: AttendeeSort = 'recent'

const SORT_LABEL: Record<AttendeeSort, string> = {
  recent: 'Sort: Last activity',
  name: 'Sort: Name (A–Z)',
  events: 'Sort: Most events',
  tickets: 'Sort: Most tickets',
}

export default function AttendeesPage() {
  const data = useLoaderData() as DirectoryData
  // No defaults are declared: the sort select writes its value even when it is
  // the default one, but sorting reorders rather than hides, so `useFilters`
  // does not count it as narrowing in the first place.
  const { params, set, clear, emptyReason } = useFilters({ total: data.window.total })
  const filtering = useIsFiltering()
  const invite = useDisclosure()
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  // Nothing has been registered yet: there is nothing to search, tab through or
  // page, so the controls go with the table and the page explains itself.
  const firstRun = data.rows.length === 0 && emptyReason === 'first-run'

  // The loader fetches these for the invite panel, so the page already knows
  // whether anything has been published — and an organizer who is simply
  // waiting for the first signup must not be told to create their first event.
  //
  // Read in one direction only: a non-empty list proves events exist, so it can
  // withdraw an offer, but an empty one is not proof of the opposite anywhere it
  // could have been masked (Registrations loads the same list through
  // `withoutForbidden`, and gets `[]` for Staff who may not list events).
  const hasEvents = data.events.length > 0

  if (firstRun) {
    return (
      <>
        <DirectoryHeader onInvite={invite.onOpen} canInvite={hasEvents} />

        <Card>
          {/* Two different organizers land here, and the next step is not the
              same one: nothing published yet, or a live event nobody has
              registered for. With events on the calendar the remaining links
              in the chain are a ticket type on sale and the invitations this
              page can send itself — "Create an event" would be a step they
              have already taken, and "See registrations" would be this same
              empty card one page over. */}
          <EmptyState
            icon="hgi-user-multiple"
            title="No attendees yet"
            actions={
              hasEvents
                ? [
                    { label: 'Set up ticket types', to: '/admin/tickets', icon: 'hgi-ticket-01' },
                    { label: 'Invite attendees', onClick: invite.onOpen },
                  ]
                : [
                    {
                      label: 'Create an event',
                      to: '/admin/event-form',
                      icon: 'hgi-calendar-add-01',
                    },
                  ]
            }
          >
            {hasEvents
              ? 'Everyone who completes a registration gets a profile here, with their tickets, tags and history. Put a ticket type on sale, or invite people to one of your events, and the first profiles will follow.'
              : 'Everyone who completes a registration gets a profile here, with their tickets, tags and history. Publish an event with tickets on sale and the first attendees will follow.'}
          </EmptyState>
        </Card>

        <PageFooter />

        <InvitePanel open={invite.open} onClose={invite.onClose} events={data.events} />
      </>
    )
  }

  return (
    <>
      <DirectoryHeader onInvite={invite.onOpen} canInvite={hasEvents} />

      <PillTabs<AttendeeSegment>
        items={pills(data)}
        value={(params.get('segment') as AttendeeSegment) ?? 'all'}
        onChange={(segment) => set({ segment: segment === 'all' ? null : segment })}
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
              placeholder="Search by name or email…"
              maxLength={MAX_SEARCH_LENGTH}
              aria-label="Search attendees"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Icon
                name="hgi-tag-01"
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <select
                value={params.get('tag') ?? ''}
                onChange={(e) => set({ tag: e.target.value || null })}
                className="select h-10 w-full border-0 bg-surface pl-9 font-medium sm:w-44"
                aria-label="Filter by tag"
              >
                <option value="">{ALL_TAGS}</option>
                {TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative flex-1 sm:flex-none">
              <Icon
                name="hgi-arrow-up-down"
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <select
                value={params.get('sort') ?? DEFAULT_SORT}
                onChange={(e) => set({ sort: e.target.value })}
                className="select h-10 w-full border-0 bg-surface pl-9 font-medium sm:w-52"
                aria-label="Sort attendees"
              >
                {Object.entries(SORT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Card className="mt-3 p-4">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[860px]">
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Phone</th>
                  <th>Events</th>
                  <th>Tickets</th>
                  <th>Tags</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {data.rows.map((row) => (
                  <AttendeeTableRow key={row.id} row={row} />
                ))}
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      {emptyReason === 'past-end' ? (
                        /* A bookmarked `?page=4` that no longer has anybody on
                           it. Back to the first page keeping the search: it is
                           what the button says, and "Clear filters" would
                           throw away a search that may well have matches. */
                        <PastEnd noun="attendees" onFirstPage={() => set({ page: null })} />
                      ) : (
                        <NoResults noun="attendees" onClear={clear}>
                          Nothing matches the current search, tab and tag filter. Try a shorter
                          search term, or widen the filters.
                        </NoResults>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Paginator
            {...data.window}
            noun="attendees"
            onPage={(page) => set({ page })}
            onSize={(size) => set({ limit: size, page: null })}
          />
        </Card>
      </div>

      <PageFooter />

      <InvitePanel open={invite.open} onClose={invite.onClose} events={data.events} />
    </>
  )
}

/** The same header above both states — an invitation is still possible on a
 *  first run, as long as there is an event to invite people to. */
function DirectoryHeader({ onInvite, canInvite }: { onInvite: () => void; canInvite: boolean }) {
  return (
    <PageHeader
      title="Attendees"
      subtitle="Everyone who has registered for your events."
      actions={
        <>
          <Button variant="primary" onClick={onInvite} disabled={!canInvite}>
            <Icon name="hgi-mail-send-01" />
            <span>Invite</span>
          </Button>
          <HeaderUser />
        </>
      }
    />
  )
}

function pills(data: DirectoryData): PillTabItem<AttendeeSegment>[] {
  return [
    { value: 'all', label: 'All', count: data.counts.all },
    { value: 'new', label: 'New', count: data.counts.new },
    { value: 'checked_in', label: 'Checked in', count: data.counts.checkedIn },
    { value: 'vip', label: 'VIP', count: data.counts.vip },
  ]
}

function AttendeeTableRow({ row }: { row: AttendeeRow }) {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-2">
          <span className="avatar h-8 w-8 text-[11px]">{row.initials}</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-medium text-ink">{row.name}</p>
            <p className="truncate text-[11px] text-muted">{row.email}</p>
          </div>
        </div>
      </td>
      <td className="tnum text-muted">{row.phone}</td>
      <td className="tnum text-muted">{row.events}</td>
      <td className="tnum font-semibold text-ink">{row.tickets}</td>
      <td className={cn(!row.tag && 'text-muted')}>
        {row.tag ? (
          <span className={cn('badge', row.tagClass)}>
            <Icon name={row.tagIcon} size={12} />
            {row.tag}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="tnum text-muted">{row.lastActivity}</td>
    </tr>
  )
}

/**
 * Inviting people to an event (US-CHK-07).
 *
 * The event is required: an invitation is to something, and the API has no
 * notion of a workspace-wide one.
 */
function InvitePanel({
  open,
  onClose,
  events,
}: {
  open: boolean
  onClose: () => void
  events: { id: string; name: string }[]
}) {
  const fetcher = useFetcher<ActionResult>()
  const sending = fetcher.state !== 'idle'
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const sent = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!sent || !open) return
    toast.success('Invitations sent.')
    onClose()
  }, [sent, open, onClose])

  return (
    <Panel
      open={open}
      onClose={onClose}
      title="Invite attendees"
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            type="submit"
            form="invite-form"
            disabled={sending}
          >
            {sending ? 'Sending…' : 'Send invitations'}
          </Button>
        </>
      }
    >
      <fetcher.Form id="invite-form" method="post" className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <div>
          <Label htmlFor="invite-event">Event</Label>
          <Select id="invite-event" name="eventId" required defaultValue={events[0]?.id ?? ''}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="invite-emails">Email addresses</Label>
          <Textarea
            id="invite-emails"
            name="emails"
            rows={4}
            required
            placeholder="anong@example.com, somchai@example.com"
          />
          <Hint>One per line or separated by commas. Duplicates are only sent once.</Hint>
        </div>
        <div>
          <Label htmlFor="invite-message">Message</Label>
          <Input id="invite-message" name="message" type="text" placeholder="Optional note" />
        </div>
      </fetcher.Form>
    </Panel>
  )
}
