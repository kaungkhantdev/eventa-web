import { useMemo } from 'react'
import { Link, useLoaderData } from 'react-router'
import {
  Card,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  PanelEmptyPreview,
} from '@/components/ui'
import { MASKED } from '@/lib/format'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import type { FeedbackData, FeedbackEventCard } from '../surveys.routes'

/**
 * Feedback across every event (US-MSG-08/09). Ported from
 * `eventa-ui-kit/admin/feedback.html`.
 *
 * **Three of the kit's four KPI tiles are here.** Responses and average rating
 * arrive the moment an attendee answers. NPS is still absent: it needs a 0–10
 * recommendation question, which is not a question type this product has, so
 * its slot holds the survey count instead.
 *
 * Completion is of the people the post-event thank-you reached — it carries
 * the survey link, so it is what ASKS — the share who answered. It reads "—"
 * when nobody has been asked (the thank-you switched off, no live survey, or
 * every send failed), never "0%": nobody ignoring a question and nobody being
 * asked one are different facts. Somebody who answered without being emailed
 * counts under Responses but not in completion, which is why completion never
 * passes 100%. It takes the kit's fourth slot, where a "Live" count stood in;
 * each event card still says how many of its surveys are live.
 *
 * The kit's trend chips are not ported: there is no previous period to
 * compare with, and an arrow with nothing behind it is invented.
 *
 * The average reads "—" when nobody has rated anything, never "0.0". Nought
 * out of five is a verdict about how attendees felt; this is the absence of
 * one, and they are not the same fact.
 */
export default function FeedbackPage() {
  const data = useLoaderData() as FeedbackData
  const { params, set, clear } = useFilters()
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) =>
    set({ q }, { replace: true }),
  )

  // Filtered here, not by the API: the whole event list is already loaded for
  // the grid, and there is no paging to disagree with.
  const query = (params.get('q') ?? '').trim().toLowerCase()
  const events = useMemo(
    () =>
      query
        ? data.events.filter((event) => event.name.toLowerCase().includes(query))
        : data.events,
    [data.events, query],
  )

  return (
    <>
      <PageHeader
        title="Feedback"
        subtitle="Surveys you have written, and the events they ask about."
        actions={<HeaderUser />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          icon="hgi-message-01"
          label="Responses"
          value={String(data.summary.responses)}
        />
        <Tile
          icon="hgi-star"
          label="Average rating"
          value={data.summary.average ?? MASKED}
        />
        <Tile icon="hgi-note-01" label="Surveys" value={String(data.totals.total)} />
        <Tile
          icon="hgi-checkmark-badge-01"
          label="Completion rate"
          value={data.summary.completion ?? MASKED}
        />
      </div>

      <Card className="mt-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Feedback by event</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Pick an event to write or manage its surveys.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <i className="hgi-stroke hgi-search-01 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-muted" />
            <input
              type="text"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              className="h-10 w-full rounded-lg bg-canvas pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
              placeholder="Search events…"
              aria-label="Search events"
            />
          </div>
        </div>

        {events.length ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : query ? (
          <PanelEmptyPreview
            preview="events"
            description="No event matches that name. Try a different spelling."
            action={{ label: 'Clear search', icon: 'hgi-refresh', onClick: clear }}
          >
            No events match.
          </PanelEmptyPreview>
        ) : (
          <PanelEmptyPreview
            preview="events"
            description="Surveys ask about an event, so there is nowhere to put one yet."
            action={{ label: 'Create an event', to: '/admin/event-form', icon: 'hgi-add-01' }}
          >
            No events yet.
          </PanelEmptyPreview>
        )}
      </Card>

      <PageFooter />
    </>
  )
}

function Tile({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon name={icon} size={15} />
        <p className="text-[12px] font-medium">{label}</p>
      </div>
      <p className="mt-1 text-[24px] font-extrabold tracking-tight tnum">{value}</p>
    </Card>
  )
}

function EventCard({ event }: { event: FeedbackEventCard }) {
  const { surveys } = event
  return (
    <Link
      to={`/admin/feedback-detail?event=${encodeURIComponent(event.id)}`}
      className="rounded-xl border border-hair p-4 transition hover:border-brand"
    >
      <p className="truncate text-[14px] font-semibold text-ink">{event.name}</p>
      <p className="mt-0.5 text-[11px] text-muted">{event.date}</p>

      {surveys.total === 0 ? (
        /* Not "0 surveys": the useful sentence is the one that says what to do
           about it. */
        <p className="mt-3 text-[12px] text-muted">No surveys yet</p>
      ) : (
        <p className="mt-3 text-[12px] text-muted">
          <span className="font-semibold text-ink tnum">{surveys.total}</span>{' '}
          {surveys.total === 1 ? 'survey' : 'surveys'}
          {surveys.live > 0 && (
            <span className="text-brand"> · {surveys.live} live</span>
          )}
          {' · '}
          {event.responses === 0 ? (
            'no responses yet'
          ) : (
            <>
              <span className="font-semibold text-ink tnum">{event.responses}</span>{' '}
              {event.responses === 1 ? 'response' : 'responses'}
            </>
          )}
        </p>
      )}
    </Link>
  )
}
