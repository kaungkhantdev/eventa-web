import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Delta, Tile } from '../insights.mapper'

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
  tile,
  wide,
}: {
  icon: string
  label: string
  tile: Tile
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
        <p className="text-[22px] font-bold tracking-tight tnum">{tile.value}</p>
        <span
          className={cn(
            'flex items-center gap-0.5 text-[12px] font-semibold',
            TONE[tile.delta.tone],
          )}
        >
          {tile.delta.direction && <Icon name={ARROW[tile.delta.direction]} size={13} />}
          {tile.delta.text}
        </span>
      </div>
    </div>
  )
}
