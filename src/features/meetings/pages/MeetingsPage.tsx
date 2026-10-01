import { useEffect, useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Button,
  Card,
  EmptyState,
  EventPicker,
  HeaderUser,
  Icon,
  Input,
  Label,
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
import { MeetingPanel } from '../components/MeetingPanel'
import { MEETING_TYPES, type MeetingTab, type MeetingsData } from '../meetings.routes'
import type { MeetingCard, MeetingDraft } from '../meetings.types'

/**
 * Meetings (US-MTG-01..06). Layout ported from meetings.html.
 *
 * Which bucket a meeting is in — today, upcoming, past — is the API's answer,
 * derived per request from the Bangkok day. The old page pinned "today" to a
 * hard-coded Jul 19, 2026 so the demo buckets stayed still.
 */

const ALL_EVENTS = 'All events'
const ALL_TYPES = 'All types'
const MAX_SEARCH_LENGTH = 120

export default function MeetingsPage() {
  const data = useLoaderData() as MeetingsData
  // Nothing here is written as a default — an absent `tab` is "all" — so every
  // parameter in the URL is a choice the organizer made, the bucket included.
  const { params, set, clear, filtered } = useFilters()
  const filtering = useIsFiltering()
  const panel = useDisclosure()
  const cancelling = useDisclosure()
  const [editing, setEditing] = useState<MeetingDraft | null>(null)
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  const schedule = () => {
    setEditing(null)
    panel.onOpen()
  }

  // With nothing narrowing the list, an empty first page is the whole diary:
  // there are no meetings at all, so the tabs, filters and rows have nothing
  // to describe and the panel is the only thing worth offering.
  const firstRun = data.cards.length === 0 && !filtered

  return (
    <>
      <PageHeader
        title="Meetings"
        subtitle="Venue, sponsor, vendor and speaker meetings."
        actions={
          <>
            <Button variant="primary" onClick={schedule}>
              <Icon name="hgi-add-01" size={16} />
              <span className="hidden sm:inline">Schedule meeting</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {firstRun ? (
        /* Nothing to filter, so the tabs, search and list go with it — what is
           left is the one step that fills the page. */
        <EmptyState
          className="card"
          icon="hgi-meeting-room"
          title="No meetings scheduled"
          actions={[
            { label: 'Schedule a meeting', onClick: schedule, icon: 'hgi-calendar-add-01' },
            { label: 'See your speakers', to: '/admin/speakers' },
          ]}
        >
          Keep your calls and site walkthroughs with speakers, sponsors, venues and vendors in one
          place. Schedule one and every guest gets a Google Calendar invite with a Meet link.
        </EmptyState>
      ) : (
        <>
          <PillTabs<MeetingTab>
            items={tabItems(data.counts)}
            value={(params.get('tab') as MeetingTab) ?? 'all'}
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
                  placeholder="Search meetings or people…"
                  maxLength={MAX_SEARCH_LENGTH}
                  aria-label="Search meetings"
                />
              </div>
              <select
                value={params.get('type') ?? ''}
                onChange={(e) => set({ type: e.target.value || null })}
                className="select h-10 border-0 bg-surface font-medium sm:w-44"
                aria-label="Meeting type"
              >
                <option value="">{ALL_TYPES}</option>
                {MEETING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="relative sm:w-52">
                <EventPicker
                  value={params.get('eventId') ?? ''}
                  onChange={(eventId) => set({ eventId: eventId || null })}
                  options={data.events}
                  allLabel={ALL_EVENTS}
                  allValue=""
                  placeholder={ALL_EVENTS}
                  className="h-10 w-full border-0 bg-surface font-medium"
                />
              </div>
            </div>

            <Card className="mt-3 p-2 sm:p-3">
              <div className="divide-y divide-line">
                {data.cards.map((card) => (
                  <MeetingRow
                    key={card.id}
                    card={card}
                    onEdit={() => {
                      setEditing(card.edit)
                      panel.onOpen()
                    }}
                  />
                ))}
              </div>

              {/* The tabs and filters stay above — changing them is the way out. */}
              {data.cards.length === 0 && (
                <NoResults noun="meetings" onClear={clear}>
                  No meeting matches the current tab, type, event and search. Try a different name,
                  or widen the filters.
                </NoResults>
              )}

              <Paginator
                {...data.window}
                noun="meetings"
                onPage={(page) => set({ page })}
                onSize={(size) => set({ limit: size, page: null })}
              />
            </Card>
          </div>
        </>
      )}

      <PageFooter />

      <MeetingPanel
        open={panel.open}
        onClose={panel.onClose}
        editing={editing}
        events={data.events}
        onCancelMeeting={() => {
          panel.onClose()
          cancelling.onOpen()
        }}
      />

      <CancelModal open={cancelling.open} onClose={cancelling.onClose} target={editing} />
    </>
  )
}

function tabItems(counts: MeetingsData['counts']): PillTabItem<MeetingTab>[] {
  return [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'today', label: 'Today', count: counts.today },
    { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { value: 'past', label: 'Past', count: counts.past },
  ]
}

function MeetingRow({ card, onEdit }: { card: MeetingCard; onEdit: () => void }) {
  const sync = useFetcher<ActionResult>()

  return (
    <div className="flex items-start gap-3.5 px-2 py-3.5">
      <span
        className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', card.typeStyle.tint)}
      >
        <Icon name={card.typeStyle.icon} size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-semibold text-ink">{card.title}</p>
          <span className={cn('badge', card.modeBadge)}>
            <Icon name={card.modeIcon} size={12} />
            {card.modeLabel}
          </span>
          {card.bucket === 'today' && <span className="badge badge-green">Today</span>}
          {card.bucket === 'past' && <span className="badge badge-gray">Past</span>}
        </div>
        <p className="tnum mt-1 flex items-center gap-1.5 text-[12px] text-muted">
          <Icon name="hgi-clock-01" size={13} />
          {card.when}
        </p>
        <p className="mt-0.5 text-[12px] text-muted">
          {card.who} · {card.event}
        </p>
        {/* The kit's "where" line: an icon for how the meeting happens, and for
            a video call the Meet link itself, clickable. It was plain grey text
            here, so the one thing on the row somebody needs at the top of the
            hour could not be opened without first opening the meeting. */}
        {(card.place || card.link) && (
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name={card.modeIcon} size={13} className="shrink-0" />
            {card.link ? (
              <a
                href={card.link}
                target="_blank"
                rel="noopener"
                className="truncate font-medium text-brand hover:underline"
              >
                {card.place || card.link}
              </a>
            ) : (
              <span className="truncate">{card.place}</span>
            )}
          </p>
        )}
        {card.cancellationReason && (
          <p role="alert" className="mt-1 text-[12px] text-red-500">
            Cancelled — {card.cancellationReason}
          </p>
        )}
        {card.syncNote && (
          // A div, not a p: the retry is a form, and a form inside a paragraph
          // is invalid HTML that React reports as a hydration error.
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-amber-500">
            <span>{card.syncNote}</span>
            <sync.Form method="post">
              <input type="hidden" name="intent" value="sync" />
              <input type="hidden" name="meetingId" value={card.id} />
              <button
                type="submit"
                className="font-semibold underline"
                disabled={sync.state !== 'idle'}
              >
                {sync.state === 'idle' ? 'Send it now' : 'Sending…'}
              </button>
            </sync.Form>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {card.canJoin && card.link && (
          <a href={card.link} target="_blank" rel="noopener" className="btn btn-soft btn-sm">
            <Icon name="hgi-video-01" size={14} />
            <span className="hidden sm:inline">Join</span>
          </a>
        )}
        {card.canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
            title="Edit meeting"
          >
            <Icon name="hgi-edit-02" size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Cancelling a meeting (US-MTG-06).
 *
 * The reason is passed on to the guest, so it is asked for here rather than
 * being invented by the system.
 */
function CancelModal({
  open,
  onClose,
  target,
}: {
  open: boolean
  onClose: () => void
  target: MeetingDraft | null
}) {
  const fetcher = useFetcher<ActionResult>()
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!done || !open) return
    toast.success('Meeting cancelled.')
    onClose()
  }, [done, open, onClose])

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true">
        <fetcher.Form method="post" className="p-5">
          <input type="hidden" name="intent" value="cancel" />
          <input type="hidden" name="meetingId" value={target?.id ?? ''} />
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
            <Icon name="hgi-calendar-remove-01" size={18} />
          </div>
          <h3 className="mt-3 text-[15px] font-bold tracking-tight">Cancel this meeting?</h3>
          <p className="mt-1 text-[13px] text-muted">
            {target ? `${target.title} · ${target.person}` : ''}
          </p>

          {error && (
            <p role="alert" className="mt-3 text-[13px] text-red-500">
              {error}
            </p>
          )}

          <div className="mt-4">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Input id="cancel-reason" name="reason" type="text" placeholder="Told to the guest" />
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="soft" className="flex-1" onClick={onClose}>
              Keep it
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              type="submit"
              disabled={fetcher.state !== 'idle'}
            >
              {fetcher.state === 'idle' ? 'Cancel meeting' : 'Cancelling…'}
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  )
}
