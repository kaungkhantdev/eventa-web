import { Link } from 'react-router'
import { ButtonLink, HeaderUser, Icon, PageFooter, PageHeader } from '@/components/ui'
import { cn } from '@/lib/cn'
import { UP_TONE, UPCOMING, type UpcomingEvent } from '../data/upcoming'

/* admin/events-upcoming.html — a responsive card grid of the soonest events. */

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none'
}

export default function UpcomingEventsPage() {
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

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          Next <span className="font-semibold text-ink tnum">{UPCOMING.length}</span> events, soonest
          first.
        </p>
        <Link to="/admin/events" className="text-[12px] font-semibold text-brand hover:underline">
          Manage all events →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {UPCOMING.map((e) => (
          <UpcomingCard key={e.name} e={e} />
        ))}
      </div>

      <PageFooter />
    </>
  )
}

function UpcomingCard({ e }: { e: UpcomingEvent }) {
  const t = UP_TONE[e.tone]
  return (
    <Link
      to="/admin/event-detail"
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
          {e.days} days left
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
          Registrations: <span className="font-semibold text-ink tnum">{e.reg}</span>
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted">Filled</span>
            <span className="font-semibold text-ink tnum">{e.pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
            <div className={cn('h-full rounded-full', t.bar)} style={{ width: `${e.pct}%` }} />
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
            <span className="tnum">{e.att}</span> attendees
          </span>
        </div>
      </div>
    </Link>
  )
}
