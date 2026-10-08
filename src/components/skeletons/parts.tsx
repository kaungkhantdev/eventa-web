import { Skeleton, SkeletonCircle } from '@/components/ui'
import { cn } from '@/lib/cn'

/* Building blocks shared by the page skeletons.
 *
 * Each one mirrors the layout of the real thing it stands in for — same
 * wrapper classes, same grid, same heights — so the page does not jump when
 * the content lands. Widths inside a block are deliberately uneven; a grid of
 * identical bars reads as a table of data rather than as "loading".
 */

/* ---------- Page chrome ---------- */

/** The `<PageHeader>` row: mobile menu button, title/subtitle, right actions. */
export function SkelPageHeader({
  actions = 1,
  subtitle = true,
  back = false,
  eyebrow = false,
  titleClassName = 'w-44',
}: {
  /** Buttons sitting left of the bell + user chip. */
  actions?: number
  subtitle?: boolean
  /** Detail pages put a back arrow between the menu button and the title. */
  back?: boolean
  /** The settings pages add a small "Settings" line above the title. */
  eyebrow?: boolean
  titleClassName?: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 lg:hidden" />
        {back && <Skeleton className="h-9 w-9 shrink-0" />}
        <div className="min-w-0">
          {eyebrow && <Skeleton className="mb-1.5 h-2.5 w-16" />}
          <Skeleton className={cn('h-6', titleClassName)} />
          {subtitle && <Skeleton className="mt-1.5 hidden h-3 w-64 max-w-full sm:block" />}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {Array.from({ length: actions }, (_, i) => (
          <Skeleton key={i} className="hidden h-9 w-28 sm:block" />
        ))}
        <SkelHeaderUser />
      </div>
    </div>
  )
}

/** The `<HeaderUser>` pairing: notification bell then the signed-in user chip. */
export function SkelHeaderUser() {
  return (
    <>
      <Skeleton className="h-10 w-10 shrink-0" />
      <div className="flex shrink-0 items-center gap-2.5">
        <SkeletonCircle className="h-9 w-9" />
        <div className="hidden sm:block">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-1.5 h-2.5 w-16" />
        </div>
      </div>
    </>
  )
}

/** The standard footer line. */
export function SkelPageFooter({ className }: { className?: string }) {
  return <Skeleton className={cn('mt-4 h-2.5 w-72 max-w-full', className)} />
}

/* ---------- Filters ---------- */

/** A `<PillTabs>` strip — the rounded surface tray plus its pills. */
export function SkelPillTabs({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn(
        'flex w-fit max-w-full items-center gap-1 overflow-hidden rounded-xl bg-surface p-1',
        className,
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn('h-8', i === 0 ? 'w-20' : 'w-24')} />
      ))}
    </div>
  )
}

/**
 * The search + selects row that sits above a table card.
 * `selects` holds one width class per dropdown, matching the real page.
 */
export function SkelToolbar({
  search = true,
  selects = [],
  className = 'mt-3',
}: {
  search?: boolean
  selects?: string[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center', className)}>
      {search && <Skeleton className="h-10 w-full flex-1" />}
      {selects.map((w, i) => (
        <Skeleton key={i} className={cn('h-10 w-full', w)} />
      ))}
    </div>
  )
}

/* ---------- Tiles and cards ---------- */

/**
 * A row of KPI tiles (`card p-3.5`): icon + label, then the value with an
 * optional delta chip beside it.
 */
export function SkelStatTiles({
  count = 4,
  className = 'grid grid-cols-2 gap-3 xl:grid-cols-4',
  delta = true,
}: {
  count?: number
  className?: string
  delta?: boolean
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card p-3.5">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <Skeleton className="h-6 w-20" />
            {delta && <Skeleton className="h-3 w-10" />}
          </div>
        </div>
      ))}
    </div>
  )
}

/** A generic content card: heading line, optional subtitle, then body rows. */
export function SkelCard({
  className,
  heading = true,
  subtitle = false,
  children,
}: {
  className?: string
  heading?: boolean
  subtitle?: boolean
  children?: React.ReactNode
}) {
  return (
    <section className={cn('card p-4', className)}>
      {heading && (
        <div className="mb-3">
          <Skeleton className="h-4 w-40" />
          {subtitle && <Skeleton className="mt-1.5 h-2.5 w-56 max-w-full" />}
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * A list of rows separated by hairlines — the shape used by the notification
 * feed, meetings, announcements and the session lists in settings.
 */
export function SkelRowList({
  rows = 6,
  tile = true,
  lines = 2,
  trailing = 'badge',
  className,
}: {
  rows?: number
  /** Leading rounded icon tile. */
  tile?: boolean
  /** Text lines in the middle column. */
  lines?: number
  trailing?: 'badge' | 'button' | 'none'
  className?: string
}) {
  return (
    <div className={cn('divide-y divide-line', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-start gap-3 py-3.5">
          {tile && <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={cn('h-3.5', i % 3 === 1 ? 'w-1/2' : 'w-2/3')} />
            {Array.from({ length: lines - 1 }, (_, j) => (
              <Skeleton key={j} className={cn('h-2.5', j === 0 ? 'w-5/6' : 'w-1/3')} />
            ))}
          </div>
          {trailing === 'badge' && <Skeleton className="h-5 w-16 shrink-0 rounded-full" />}
          {trailing === 'button' && <Skeleton className="h-8 w-20 shrink-0" />}
        </div>
      ))}
    </div>
  )
}

/** A grid of equal cards — templates, roles, categories, landing pages. */
export function SkelCardGrid({
  count = 6,
  className = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3',
  cardClassName = 'card p-4',
  media = false,
  lines = 2,
  footer = true,
}: {
  count?: number
  className?: string
  cardClassName?: string
  /** Cards that lead with a cover image rather than an icon tile. */
  media?: boolean
  lines?: number
  footer?: boolean
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cardClassName}>
          {media ? (
            <Skeleton className="mb-3 aspect-[3/2] w-full rounded-xl" />
          ) : (
            <div className="mb-3 flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          )}
          <div className="space-y-2">
            {Array.from({ length: lines }, (_, j) => (
              <Skeleton key={j} className={cn('h-2.5', j === lines - 1 ? 'w-2/3' : 'w-full')} />
            ))}
          </div>
          {footer && (
            <div className="mt-4 flex items-center justify-between border-t border-hair pt-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-16" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ---------- Tables ---------- */

/** Uneven cell widths so a skeleton table doesn't read as a filled grid. */
const CELL_WIDTHS = ['w-24', 'w-16', 'w-20', 'w-28', 'w-14', 'w-24', 'w-20']

/** The paginator strip: "showing x of y" on the left, page controls right. */
export function SkelPaginator({ className = 'mt-3' }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <Skeleton className="h-3 w-40" />
      <div className="flex items-center gap-3">
        <Skeleton className="hidden h-8 w-28 sm:block" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}

/**
 * A data table: header cells, then rows whose first column carries the
 * avatar + two-line label most of these tables use, and whose last column
 * carries the row-action buttons.
 */
export function SkelTable({
  cols = 6,
  rows = 10,
  minWidth = 'min-w-[820px]',
  avatar = true,
  actions = true,
}: {
  cols?: number
  rows?: number
  minWidth?: string
  /** First column leads with a round avatar. */
  avatar?: boolean
  /** Last column is a cluster of icon buttons. */
  actions?: boolean
}) {
  const middle = Math.max(cols - (actions ? 2 : 1), 0)

  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-left', minWidth)}>
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, i) => (
              <th key={i} className="pb-3 pr-4">
                <Skeleton className={cn('h-2.5', i === 0 ? 'w-20' : 'w-14')} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r} className="border-t border-line">
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-3">
                  {avatar && <SkeletonCircle className="h-8 w-8 shrink-0" />}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className={cn('h-3', r % 2 ? 'w-28' : 'w-36')} />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
              </td>
              {Array.from({ length: middle }, (_, c) => (
                <td key={c} className="py-3.5 pr-4">
                  <Skeleton className={cn('h-3', CELL_WIDTHS[(r + c) % CELL_WIDTHS.length])} />
                </td>
              ))}
              {actions && (
                <td className="py-3.5">
                  <div className="flex justify-end gap-1.5">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The `card p-4` wrapper that every list page puts its table inside. */
export function SkelTableCard({
  className = 'mt-3',
  heading = false,
  ...table
}: {
  className?: string
  /** Pages without a filter bar title the card instead. */
  heading?: boolean
} & Parameters<typeof SkelTable>[0]) {
  return (
    <section className={cn('card p-4', className)}>
      {heading && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="hidden h-2.5 w-28 sm:block" />
        </div>
      )}
      <SkelTable {...table} />
      <SkelPaginator />
    </section>
  )
}

/* ---------- Forms ---------- */

/** One labelled input. */
export function SkelField({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="mt-2 h-9 w-full" />
    </div>
  )
}

/** A card of form fields laid out two-up, with save/cancel buttons beneath. */
export function SkelFormCard({
  fields = 6,
  className,
  buttons = true,
  grid = 'grid grid-cols-1 gap-4 sm:grid-cols-2',
}: {
  fields?: number
  className?: string
  buttons?: boolean
  grid?: string
}) {
  return (
    <section className={cn('card p-5', className)}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-1.5 h-2.5 w-56 max-w-full" />
      <div className={cn('mt-4', grid)}>
        {Array.from({ length: fields }, (_, i) => (
          <SkelField key={i} />
        ))}
      </div>
      {buttons && (
        <div className="mt-5 flex justify-end gap-2 border-t border-hair pt-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      )}
    </section>
  )
}

/** The 280px identity card the profile and organization pages open with. */
export function SkelProfileCard({ stats = 3 }: { stats?: number }) {
  return (
    <section className="card p-5">
      <div className="flex flex-col items-center text-center">
        <Skeleton className="h-20 w-20 rounded-2xl" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="mt-4 border-t border-hair pt-4 text-center">
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto mt-2 h-2.5 w-24" />
      </div>
      <div className="mt-4 space-y-2 border-t border-hair pt-4">
        {Array.from({ length: stats }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </div>
    </section>
  )
}

/** A card of toggle rows — notification preferences, payment methods. */
export function SkelToggleCard({
  rows = 5,
  toggles = 1,
  className,
}: {
  rows?: number
  toggles?: number
  className?: string
}) {
  return (
    <section className={cn('card p-4', className)}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-1.5 h-2.5 w-56 max-w-full" />
      <div className="mt-3 divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className={cn('h-3', i % 2 ? 'w-32' : 'w-40')} />
              <Skeleton className="h-2.5 w-52 max-w-full" />
            </div>
            <div className="flex shrink-0 items-center gap-6">
              {Array.from({ length: toggles }, (_, j) => (
                <Skeleton key={j} className="h-5 w-9 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Charts ---------- */

/**
 * An area/bar chart card: title, big figure, range switch, then the plot.
 * The plot is a row of bars of varying height so it reads as a chart rather
 * than a blank panel.
 */
export function SkelChartCard({
  className,
  height = 'h-56',
  range = true,
}: {
  className?: string
  height?: string
  range?: boolean
}) {
  return (
    <section className={cn('card p-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Skeleton className="h-4 w-40" />
          <div className="mt-2 flex items-center gap-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        {range && <Skeleton className="h-8 w-40 rounded-lg" />}
      </div>
      <div className={cn('mt-4 flex items-end gap-2', height)}>
        {CHART_BARS.map((h, i) => (
          <Skeleton key={i} className={cn('min-w-0 flex-1 rounded-md', h)} />
        ))}
      </div>
    </section>
  )
}

/* A fixed profile keeps the silhouette stable between renders. Percentages
   resolve against the container's explicit height. */
const CHART_BARS = [
  'h-[38%]',
  'h-[52%]',
  'h-[44%]',
  'h-[66%]',
  'h-[58%]',
  'h-[78%]',
  'h-[62%]',
  'h-[88%]',
  'h-[71%]',
  'h-[94%]',
  'h-[82%]',
  'h-full',
]

/** A donut card: title, the ring, then its legend rows. */
export function SkelDonutCard({
  className,
  legend = 4,
}: {
  className?: string
  legend?: number
}) {
  return (
    <section className={cn('card p-4', className)}>
      <Skeleton className="h-4 w-52 max-w-full" />
      <Skeleton className="mt-1.5 h-2.5 w-40" />
      <div className="mt-4 flex justify-center">
        <SkeletonCircle className="h-44 w-44" />
      </div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: legend }, (_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <SkeletonCircle className="h-2.5 w-2.5 shrink-0" />
            <Skeleton className="h-2.5 flex-1" />
            <Skeleton className="h-2.5 w-10 shrink-0" />
          </div>
        ))}
      </div>
    </section>
  )
}
