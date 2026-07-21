import { cn } from '@/lib/cn'
import type { FeedEntry } from '../data/checkin'

export type FeedItem = FeedEntry & { id: number }

/** The "Just checked in" live feed — newest entry first. */
export function CheckInFeed({ feed }: { feed: FeedItem[] }) {
  return (
    <section className="card flex min-h-0 flex-1 flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-tight">Just checked in</h2>
        <span className="flex items-center gap-1 text-[11px] font-medium text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Live
        </span>
      </div>
      <div className="mt-2">
        {feed.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-2.5 border-t border-line py-2.5 first:border-t-0 first:pt-0"
          >
            <span className="avatar h-8 w-8 shrink-0 text-[10px]">{f.ini}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{f.name}</p>
              <span className={cn('badge mt-0.5', f.badge)}>{f.ticket}</span>
            </div>
            <span className="shrink-0 text-[11px] tnum text-muted">{f.time}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
