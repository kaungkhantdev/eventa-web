import { PanelEmptyPreview } from '@/components/ui'
import { Link } from 'react-router'
import type { Panel } from '@/app/panels'
import { cn } from '@/lib/cn'
import type { UpcomingCard } from '../overview.types'
import { PanelUnavailable, SectionHeader } from './PanelChrome'

/** The next events and how full they are (US-DASH-04). */

const NONE_UPCOMING = 'No upcoming events.'
const NOTHING_SCHEDULED = 'Events you publish show up here as their date gets closer.'

export function UpcomingEventsPanel({ upcoming }: { upcoming: Panel<UpcomingCard[]> }) {
  return (
    // `flex flex-col`, because this card shares a grid row with Alerts and the
    // taller of the two stretches the other. Left at the default the empty
    // state stays pinned under the heading with the borrowed height dangling
    // below it, which reads as a card that failed to finish rendering.
    <section className="flex flex-col rounded-2xl bg-surface p-4 xl:col-span-2">
      <SectionHeader title="Upcoming Events" link={{ to: '/admin/events', label: 'See all' }} />
      {upcoming.ok ? <Cards cards={upcoming.data} /> : <PanelUnavailable error={upcoming.error} />}
    </section>
  )
}

function Cards({ cards }: { cards: UpcomingCard[] }) {
  if (cards.length === 0) {
    // Centred in whatever height the row hands this card, rather than sitting
    // at the top of it.
    return (
      <div className="flex flex-1 flex-col justify-center">
        <PanelEmptyPreview
          preview="events"
          description={NOTHING_SCHEDULED}
          action={{ label: 'New event', icon: 'hgi-calendar-add-01', to: '/admin/event-form' }}
        >
          {NONE_UPCOMING}
        </PanelEmptyPreview>
      </div>
    )
  }

  return (
    <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
      {cards.map((e) => (
        <Link
          key={e.id}
          to={`/admin/event-detail?id=${e.id}`}
          className={cn('rounded-xl p-4', e.look.card)}
        >
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              <span
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full text-[10px] font-semibold ring-2',
                  e.look.avatar,
                  e.look.ring,
                )}
              >
                {e.initials}
              </span>
              <span
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full text-[10px] font-semibold ring-2',
                  e.look.avatarMore,
                  e.look.ring,
                )}
              >
                {e.attendees}
              </span>
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-ink dark:bg-white/10">
              {e.daysLabel}
            </span>
          </div>
          <p className="mt-3 text-[14px] font-bold tracking-tight text-ink">{e.title}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted">Progress</span>
              <span className="tnum font-semibold text-ink">{e.progress}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
              <div
                className={cn('h-full rounded-full', e.look.bar)}
                style={{ width: `${e.progress}%` }}
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
