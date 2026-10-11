import type { ReactNode } from 'react'
import { useRevalidator } from 'react-router'
import { Button, Card, EmptyState, Icon, Panel, Skeleton, SkeletonScreen } from '@/components/ui'
import type { Panel as PanelRead } from '@/app/panels'
import { cn } from '@/lib/cn'
import type { TimelineEntry } from '../activity.types'
import type { AttendeeRow } from '../directory.types'

/**
 * One attendee's profile, with their recorded activity (US-REG-08 AC5).
 *
 * Markup ported from `admin/attendees.html` → `#profile-panel`: the identity
 * block, the contact card and the Activity timeline, class strings verbatim.
 *
 * **Two of the kit's sections are deliberately absent.** Its "Registered
 * events" and "Tickets" lists are sample rows — four named events and three
 * priced tickets — and no endpoint answers them for one attendee: the API
 * offers `GET /attendees` (which the directory row here already came from),
 * `PATCH /attendees/:id`, and `GET /audit`. `/me/tickets` is the attendee's own
 * persona, not an organizer reading somebody else's. Drawing those lists would
 * mean inventing a history, which is exactly what the portal's "12 events
 * attended" was removed for; the real counts behind them are in the row the
 * panel opened from. They arrive here when the API does.
 */

/** Null while the open profile's history is still being read. */
type Timeline = PanelRead<TimelineEntry[]> | null

export function AttendeeProfilePanel({
  /** Kept while the panel closes, so it still reads correctly as it slides out. */
  row,
  timeline,
  open,
  onClose,
  /** Null for a caller who may only read the directory — `regView`, not `regManage`. */
  onEdit,
}: {
  row: AttendeeRow | null
  timeline: Timeline
  open: boolean
  onClose: () => void
  onEdit: (() => void) | null
}) {
  return (
    <Panel
      open={open}
      onClose={onClose}
      title="Attendee profile"
      footer={<ProfileActions row={row} onClose={onClose} onEdit={onEdit} />}
    >
      {row && (
        <div className="space-y-5">
          <Identity row={row} />
          <ContactCard row={row} />
          <Section title="Activity">
            <Activity timeline={timeline} />
          </Section>
        </div>
      )}
    </Panel>
  )
}

/** The kit's footer pair. Both of its buttons close the panel behind them. */
function ProfileActions({
  row,
  onClose,
  onEdit,
}: {
  row: AttendeeRow | null
  onClose: () => void
  onEdit: (() => void) | null
}) {
  if (!row) return null

  return (
    <>
      {/* A `mailto:` rather than a composer. The in-product one-off email is
          its own story (US-REG-09: a subject, a message, and the send logged on
          this timeline) and no endpoint exists for it yet — `POST
          /events/:id/attendees/email` invites people to an event, which is a
          different act. Handing the address to the organizer's own mail client
          is the whole of what this button claims to do, and claims nothing that
          is not true: it is not a logged send. */}
      <a href={`mailto:${row.email}`} onClick={onClose} className="btn btn-soft flex-1">
        <Icon name="hgi-mail-01" size={16} />
        Send email
      </a>
      {onEdit && (
        <Button variant="primary" className="flex-1" onClick={onEdit}>
          <Icon name="hgi-edit-02" size={16} />
          Edit
        </Button>
      )}
    </>
  )
}

function Identity({ row }: { row: AttendeeRow }) {
  return (
    <div className="flex items-center gap-3">
      <span className="avatar h-14 w-14 text-[18px]">{row.initials}</span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-ink">{row.name}</p>
        <p className="truncate text-[12px] text-muted">{row.email}</p>
        {row.tag && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {/* The row's own tint and glyph, so the badge beside the name and
                the badge in the table can never disagree. */}
            <span className={cn('badge', row.tagClass)}>
              <Icon name={row.tagIcon} size={12} />
              {row.tag}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactCard({ row }: { row: AttendeeRow }) {
  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-center gap-2 text-[13px]">
        <Icon name="hgi-mail-01" size={15} className="text-muted" />
        <span className="text-ink">{row.email}</span>
      </div>
      <div className="flex items-center gap-2 text-[13px]">
        <Icon name="hgi-call" size={15} className="text-muted" />
        {/* Already a dash when nobody ever left a number — see `toAttendeeRow`. */}
        <span className="tnum text-ink">{row.phone}</span>
      </div>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </h4>
      {children}
    </div>
  )
}

/**
 * The history, in its three states.
 *
 * None of them takes the panel down with it: the contact details above are the
 * subject of this screen, and the trail beside them is context.
 */
function Activity({ timeline }: { timeline: Timeline }) {
  if (timeline === null) return <ActivityLoading />
  if (!timeline.ok) return <ActivityUnavailable error={timeline.error} />
  if (timeline.data.length === 0) return <ActivityEmpty />
  return <ActivityLines entries={timeline.data} />
}

function ActivityLines({ entries }: { entries: readonly TimelineEntry[] }) {
  return (
    <div className="space-y-4 border-l border-line pl-4">
      {entries.map((entry) => (
        <div key={entry.id} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              'absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full',
              entry.isLatest ? 'bg-brand ring-4 ring-brand-soft' : 'bg-line',
            )}
          />
          <p className="text-[13px] font-medium text-ink">{entry.title}</p>
          <p className="tnum text-[11px] text-muted">{entry.when}</p>
        </div>
      ))}
    </div>
  )
}

/** Placeholder lines in the timeline's own geometry, so nothing jumps. */
function ActivityLoading() {
  return (
    <SkeletonScreen label="Loading activity">
      <div className="space-y-4 border-l border-line pl-4">
        {[0, 1, 2].map((line) => (
          <div key={line} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-line"
            />
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="mt-1.5 h-2.5 w-32" />
          </div>
        ))}
      </div>
    </SkeletonScreen>
  )
}

/**
 * No history, said plainly — and said carefully.
 *
 * The kit fills this list with four invented entries; an attendee the API
 * records nothing for gets the truth instead. It stops short of claiming
 * nothing ever happened, because an empty answer here has two causes: the
 * audit log shows the whole workspace only to an Admin, and narrows everyone
 * else to their own acts. An Organizer looking at a correction a colleague made
 * gets an empty page, and "nothing is recorded" would be false for them.
 *
 * No action is offered. Nobody can manufacture an audit entry, and the one
 * thing that writes one — Edit — is already in the footer.
 */
function ActivityEmpty() {
  return (
    <EmptyState icon="hgi-clock-01" compact>
      Nothing recorded to show yet. Corrections to this attendee’s contact details appear here
      as they are made, newest first; the trail lists only what your account may see.
    </EmptyState>
  )
}

/**
 * The read failed. A failure is not emptiness — "nothing happened" and "we
 * could not find out" are different facts — so it says so in the API's own
 * sentence, and offers the retry.
 */
function ActivityUnavailable({ error }: { error: string }) {
  const { revalidate, state } = useRevalidator()

  return (
    <div className="rounded-lg border border-hair p-3 text-center">
      <p role="alert" className="text-[13px] text-muted">
        {error}
      </p>
      <Button
        size="sm"
        className="mt-2"
        onClick={() => void revalidate()}
        disabled={state === 'loading'}
      >
        <Icon name="hgi-refresh" size={15} />
        Try again
      </Button>
    </div>
  )
}
