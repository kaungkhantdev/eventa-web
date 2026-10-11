import { useEffect, useState } from 'react'
import { useFetcher, useLoaderData, useRouteLoaderData } from 'react-router'
import {
  Button,
  Card,
  EmptyState,
  EventPicker,
  HeaderUser,
  Hint,
  Icon,
  IconButton,
  Input,
  Label,
  NoResults,
  PageFooter,
  PageHeader,
  Paginator,
  Panel,
  PastEnd,
  PillTabs,
  type PillTabItem,
} from '@/components/ui'
import { ADMIN_ROUTE_ID, type ActionResult } from '@/app/loaders'
import { can } from '@/features/auth/permissions'
import type { Me } from '@/features/auth/types'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import { AttendeeProfilePanel } from '../components/AttendeeProfilePanel'
import { EditContactPanel } from '../components/EditContactPanel'
import { PROFILE_PARAM, TAGS, type DirectoryData } from '../directory.routes'
import type { AttendeeRow, AttendeeSegment, AttendeeSort } from '../directory.types'
import { useOpenProfileId } from '../useOpenProfileId'

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
  //
  // Which profile is open is page state, not a filter: it hides nothing, so an
  // empty table with a panel over it is still a first run and not a search that
  // matched nothing — and "Clear filters" must not close the panel either.
  const { params, set, clear, emptyReason } = useFilters({
    total: data.window.total,
    ignore: [PROFILE_PARAM],
  })
  const filtering = useIsFiltering()
  const invite = useDisclosure()
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  const me = (useRouteLoaderData(ADMIN_ROUTE_ID) as { me: Me } | undefined)?.me ?? null
  // Correcting contact details is `regManage`; the directory itself is only
  // `regView`, which Staff hold so the door can look people up. This hides a
  // control they cannot use — the API is what enforces it, and the panel still
  // shows the 403 if it ever gets that far.
  const canManage = can(me, 'regManage')
  const edit = useDisclosure()
  // The id rather than the row: a save revalidates this loader, and holding the
  // row would leave the panel editing a copy of what the directory used to say.
  // Looked up afresh on every render, so the details it submits as "what the
  // row said" are the ones the table is showing now.
  const [editingId, setEditingId] = useState<number | null>(null)
  const editing = data.rows.find((row) => row.id === editingId) ?? null

  const openId = useOpenProfileId()
  // Whose details the panel is drawing. While it slides shut the URL has
  // already stopped naming anybody, so it falls back to the profile the loader
  // last read — which keeps the closing panel readable instead of emptying
  // under the animation, and is still router state rather than a copy of it.
  const shownId = openId ?? data.activity?.attendeeId ?? null
  // A `?profile=` naming somebody who is not on this page opens nothing: the
  // panel's subject is the row's own contact details, and no second read exists
  // to recover them.
  const viewing = data.rows.find((row) => row.id === shownId) ?? null
  // The history, once the loader has read *this* attendee's. Null while that is
  // in flight — including on the click that opened the panel, which shows
  // before its timeline could possibly have arrived.
  const timeline = data.activity?.attendeeId === shownId ? data.activity.timeline : null

  // The page number rides along in every patch. `nextParams` drops it for any
  // other change, because page 4 of a new filter is not page 4 of the old one —
  // but opening a panel narrows nothing, and losing page 4 would take the row
  // the panel was opened from off the screen behind it.
  const setProfile = (id: number | null) =>
    set({ [PROFILE_PARAM]: id, page: params.get('page') })

  /**
   * The kit's Edit lives in the profile footer, and its buttons close the panel
   * behind them — one route into the form rather than two.
   *
   * The profile is hidden by the condition on its `open` prop rather than by
   * clearing `?profile=`. Clearing it NAVIGATES, and the navigation discarded
   * the state set on the two lines above it, so Edit closed the profile and
   * opened nothing — found by clicking it, which is the only way: it type-
   * checks, and no unit test covers two panels and a loader between them.
   *
   * Keeping the parameter is better than a fix anyway: the form is a step
   * inside the profile, so closing it returns to the person it was opened from
   * instead of to a bare directory.
   */
  const onEditProfile = () => {
    if (!viewing) return
    setEditingId(viewing.id)
    edit.onOpen()
  }

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
                  {/* The kit's own Actions column. Opening a profile is reading,
                      so it is offered to everyone who may read the directory —
                      the Edit button inside the panel is what needs the extra
                      permission. */}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {data.rows.map((row) => (
                  <AttendeeTableRow key={row.id} row={row} onView={() => setProfile(row.id)} />
                ))}
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
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

      <AttendeeProfilePanel
        row={viewing}
        timeline={timeline}
        open={openId !== null && viewing !== null && !edit.open}
        onClose={() => setProfile(null)}
        onEdit={canManage ? onEditProfile : null}
      />

      {/* Rendered for anyone who may edit, not only once a row is chosen: the
          element stays mounted so the kit's slide-in transition has something
          to run on. Without a row it is never opened. */}
      {canManage && (
        <EditContactPanel row={editing} open={edit.open} onClose={edit.onClose} />
      )}
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

function AttendeeTableRow({ row, onView }: { row: AttendeeRow; onView: () => void }) {
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
      <td className="text-right">
        {/* The kit's actions cell. Its "More" button is still left out rather
            than wired to nothing; "View profile" now opens the panel it names,
            and the Edit that used to sit here moved into that panel's footer,
            where the kit puts it. */}
        <div className="flex items-center justify-end gap-1">
          <IconButton onClick={onView} title="View profile">
            <Icon name="hgi-eye" size={16} />
            <span className="sr-only">View {row.name}’s profile</span>
          </IconButton>
        </div>
      </td>
    </tr>
  )
}

/**
 * Inviting somebody to an event (US-REG-06).
 *
 * ONE NAMED PERSON, which is what the story asks for: "Given I enter a
 * recipient name, email and exactly one event". This was a textarea of
 * addresses with no name field — a bulk invite that appears in no story and
 * that no endpoint accepts. Two of the story's five criteria (the recipient
 * name, and the inline error when it is missing) could not be met by a form
 * with nowhere to type one, and the route it posted to was the event-wide
 * broadcast, which refused every request.
 *
 * The event is required: an invitation is to something, and the API has no
 * notion of a workspace-wide one.
 */
/** `SendInviteDto`: `@MaxLength(120)` on the name, 250 on the note. */
const MAX_RECIPIENT_NAME = 120
const MAX_INVITE_MESSAGE = 250

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
  // An invite must name an event, so the picker starts on one rather than on a
  // blank the browser can no longer enforce (`required` means nothing to the
  // hidden input a custom picker submits through).
  const [inviteEvent, setInviteEvent] = useState(events[0]?.id ?? '')
  const sending = fetcher.state !== 'idle'
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const sent = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!sent || !open) return
    toast.success('Invitation sent.')
    onClose()
  }, [sent, open, onClose])

  return (
    <Panel
      open={open}
      onClose={onClose}
      title="Invite someone to an event"
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
            {sending ? 'Sending…' : 'Send invitation'}
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
          <EventPicker
            id="invite-event"
            name="eventId"
            value={inviteEvent}
            onChange={setInviteEvent}
            options={events}
            allLabel={false}
            placeholder="Choose an event"
          />
        </div>
        <div>
          <Label htmlFor="invite-name">Recipient name</Label>
          <Input
            id="invite-name"
            name="recipientName"
            required
            maxLength={MAX_RECIPIENT_NAME}
            placeholder="Anong Pattana"
          />
        </div>
        <div>
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            name="recipientEmail"
            type="email"
            required
            placeholder="anong@example.com"
          />
        </div>
        <div>
          <Label htmlFor="invite-message">Message</Label>
          <Input
            id="invite-message"
            name="message"
            type="text"
            maxLength={MAX_INVITE_MESSAGE}
            placeholder="Optional note"
          />
          <Hint>
            Appears at the top of the invitation. Sending the same person the
            same invitation twice in a day does not send a second email.
          </Hint>
        </div>
      </fetcher.Form>
    </Panel>
  )
}
