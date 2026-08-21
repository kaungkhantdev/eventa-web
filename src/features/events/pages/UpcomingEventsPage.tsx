import { Link, useLoaderData } from 'react-router'
import { ButtonLink, EmptyState, HeaderUser, Icon, PageFooter, PageHeader } from '@/components/ui'
import { cn } from '@/lib/cn'
import { UP_TONE } from '../events.presentation'
import type { UpcomingData } from '../events.routes'
import type { UpcomingCard } from '../types'

/* admin/events-upcoming.html — a responsive card grid of the soonest events. */

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none'
}

export default function UpcomingEventsPage() {
  const { cards } = useLoaderData() as UpcomingData

  return (
    <>
      <PageHeader
        title="Upcoming events"
        subtitle="Events happening soon, at a glance."
        actions={
          <>
            <ButtonLink to="/admin/event-form" variant="primary" className="shrink-0">
              <Icon name="hgi-calendar-add-01" />
              <span className="hidden sm:inline">New event</span>
              <span className="sm:hidden">New</span>
            </ButtonLink>
            <HeaderUser />
          </>
        }
      />

      {/* Nothing to filter here — the API answers with the next few events and
          that is the whole page, so an empty answer only ever means there is
          nothing ahead of today. The count strip goes with the grid rather than
          reading "Next 0 events".

          It says "Create an event", never "your first": this loader asks for
          events starting from now that are not cancelled, so an organizer with
          years of past events behind them sees exactly this screen. Only the
          title and the sentence — both about what is *ahead* — can be said with
          any confidence here. */}
      {cards.length === 0 ? (
        <EmptyState
          className="card"
          icon="hgi-calendar-03"
          title="Nothing coming up"
          actions={[
            {
              label: 'Create an event',
              to: '/admin/event-form',
              icon: 'hgi-calendar-add-01',
            },
            { label: 'Manage all events', to: '/admin/events' },
          ]}
        >
          This is a countdown of the events still ahead of today, soonest first. Create an event and
          give it a date and it will appear here until the day it runs.
        </EmptyState>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-muted">
              Next <span className="font-semibold text-ink tnum">{cards.length}</span> events,
              soonest first.
            </p>
            <Link
              to="/admin/events"
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              Manage all events →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card) => (
              <UpcomingEventCard key={card.id} e={card} />
            ))}
          </div>
        </>
      )}

      <PageFooter />
    </>
  )
}

function UpcomingEventCard({ e }: { e: UpcomingCard }) {
  const t = UP_TONE[e.tone]
  return (
    <Link
      to={`/admin/event-detail?id=${e.id}`}
      className={cn(
        'group block w-full overflow-hidden rounded-2xl ring-2 ring-transparent transition hover:ring-brand',
        t.bg,
      )}
    >
      <div className={cn('relative h-24 bg-gradient-to-br', t.grad)}>
        <img
          src={`https://picsum.photos/seed/${e.seed}/540/240`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={hideOnError}
        />
        <span className="absolute right-2.5 top-2.5 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur-sm">
          {e.daysLeft === 0 ? 'Today' : `${e.daysLeft} ${e.daysLeft === 1 ? 'day' : 'days'} left`}
        </span>
        <span
          className={cn(
            'absolute -bottom-5 left-4 grid h-11 w-11 place-items-center rounded-xl text-white shadow-md ring-4',
            t.solid,
            t.ring,
          )}
        >
          <Icon name={e.icon} size={22} />
        </span>
      </div>
      <div className="px-4 pb-4 pt-7">
        <p className="truncate text-[15px] font-bold tracking-tight text-ink">{e.name}</p>
        <p className="mt-0.5 text-[12px] text-muted">
          Registrations: <span className="font-semibold text-ink tnum">{e.registrations}</span>
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted">Filled</span>
            <span className="font-semibold text-ink tnum">{e.fillPercent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
            <div className={cn('h-full rounded-full', t.bar)} style={{ width: `${e.fillPercent}%` }} />
          </div>
        </div>
        <div className="mt-3.5 flex items-center gap-2 border-t border-black/5 pt-3 dark:border-white/10">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  'relative grid h-6 w-6 place-items-center overflow-hidden rounded-full ring-2',
                  t.solid,
                  t.ring,
                )}
              >
                <img
                  src={`https://picsum.photos/seed/${e.seed}-a${i}/48/48`}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={hideOnError}
                />
              </span>
            ))}
          </div>
          <span className="text-[12px] font-semibold text-ink">
            <span className="tnum">{e.sold}</span> attendees
          </span>
        </div>
      </div>
    </Link>
  )
}
