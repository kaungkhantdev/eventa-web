import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Delta } from '../insights.mapper'

/**
 * One headline figure and how it moved — the kit's stat card, from the API.
 *
 * The chip's colour comes from the API's verdict on the move, never from its
 * direction: fewer refunds and fewer no-shows are wins, and painting them red
 * because the number went down would tell the organizer the opposite of what
 * happened. Where the API passes no verdict the chip is muted rather than
 * guessing one.
 */

const TONE: Record<Delta['tone'], string> = {
  good: 'text-brand',
  bad: 'text-red-500',
  neutral: 'text-muted',
}

const ARROW = {
  up: 'hgi-arrow-up-right-01',
  down: 'hgi-arrow-down-right-01',
} as const

export function StatTile({
  icon,
  label,
  value,
  delta,
  wide,
}: {
  icon: string
  label: string
  value: string
  /**
   * Omitted where there is no previous period to compare against — a lifetime
   * figure has none, and a chip permanently reading "—" looks like data that
   * failed to load rather than a comparison that does not exist.
   */
  delta?: Delta
  /** The odd card out on a two-column grid, as the kit lays it out. */
  wide?: boolean
}) {
  return (
    <div className={cn('card p-3.5', wide && 'sm:col-span-2 xl:col-span-1')}>
      <div className="flex items-center gap-1.5 text-[12px] text-muted">
        <Icon name={icon} size={16} />
        {label}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-[22px] font-bold tracking-tight tnum">{value}</p>
        {delta && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-[12px] font-semibold',
              TONE[delta.tone],
            )}
          >
            {delta.direction && <Icon name={ARROW[delta.direction]} size={13} />}
            {delta.text}
          </span>
        )}
      </div>
    </div>
  )
}
