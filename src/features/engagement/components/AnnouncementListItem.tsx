import { Badge, Button, Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { AnnouncementRow } from '../announcements.mapper'
import type { AnnouncementStatus } from '../announcements.types'

/**
 * The icon tile, in the kit's own tints: brand for one that has gone, blue for
 * one still to come (`messaging-announcements.html`), grey for one called off.
 */
const TILE: Record<AnnouncementStatus, string> = {
  sent: 'bg-brand-soft text-brand',
  scheduled: 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

/** One row of the announcements history (US-MSG-04/05). */
export function AnnouncementListItem({
  row,
  first,
  onReschedule,
  onCancel,
}: {
  row: AnnouncementRow
  first: boolean
  onReschedule: (row: AnnouncementRow) => void
  onCancel: (row: AnnouncementRow) => void
}) {
  return (
    <div className={cn('flex items-start gap-3 py-3', !first && 'border-t border-line')}>
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
          TILE[row.status],
        )}
      >
        <Icon name="hgi-megaphone-01" size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{row.subject}</p>
        <p className="truncate text-[12px] text-muted">{row.body}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted tnum">{row.meta}</p>
        {/* Only while it can still be changed. The buttons disappearing is a
            tidy-up, not the rule: the API refuses a change to one that has
            gone, and says so. */}
        {row.canChange && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button variant="soft" size="sm" onClick={() => onReschedule(row)}>
              <Icon name="hgi-time-schedule" size={14} />
              Reschedule
            </Button>
            <Button variant="soft" size="sm" onClick={() => onCancel(row)}>
              <Icon name="hgi-cancel-circle" size={14} />
              Cancel
            </Button>
          </div>
        )}
      </div>
      <Badge tone={row.badge.tone} icon={row.badge.icon} className="shrink-0">
        {row.badge.label}
      </Badge>
    </div>
  )
}
