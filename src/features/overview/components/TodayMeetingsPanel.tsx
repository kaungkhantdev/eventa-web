import { Link } from 'react-router'
import { Icon } from '@/components/ui'
import type { Panel } from '@/app/panels'
import { cn } from '@/lib/cn'
import type { TodayMeetings } from '../overview.routes'
import { CountBadge, PanelEmptyPreview, PanelUnavailable, SectionHeader } from './PanelChrome'

/** Today's meetings (US-DASH-03). Markup ported from admin/home.html. */

const MEETINGS = '/admin/meetings'
const NONE_TODAY = 'No meetings scheduled today.'
const NOTHING_BOOKED = 'Meetings you schedule for today appear here with their time and guest.'
/** The empty card already offers this, so the footer link would be it twice. */
const noneToday = (m: Panel<TodayMeetings>) => m.ok && m.data.rows.length === 0

export function TodayMeetingsPanel({ meetings }: { meetings: Panel<TodayMeetings> }) {
  return (
    <section className="rounded-2xl bg-surface p-4">
      <SectionHeader
        title="Today's Meetings"
        badge={meetings.ok ? <CountBadge value={meetings.data.count} tone="plain" /> : undefined}
        link={{ to: MEETINGS, label: 'See all' }}
      />

      {meetings.ok ? <Rows rows={meetings.data.rows} /> : <PanelUnavailable error={meetings.error} />}

      {!noneToday(meetings) && (
        <Link
          to={MEETINGS}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-dark"
        >
          <Icon name="hgi-add-01" size={15} />
          Schedule meeting
        </Link>
      )}
    </section>
  )
}

function Rows({ rows }: { rows: TodayMeetings['rows'] }) {
  if (rows.length === 0) {
    return (
      <PanelEmptyPreview
        preview="meetings"
        description={NOTHING_BOOKED}
        action={{ label: 'Schedule meeting', icon: 'hgi-add-01', to: MEETINGS }}
      >
        {NONE_TODAY}
      </PanelEmptyPreview>
    )
  }

  return (
    <div className="mt-3.5 space-y-4">
      {rows.map((m) => (
        <div key={m.id} className="flex gap-3">
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', m.tint)}>
            <Icon name="hgi-video-01" size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">{m.title}</p>
            <p className="tnum mt-0.5 text-[12px] text-muted">{m.time}</p>
            <p className="text-[12px] text-muted">{m.who}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
