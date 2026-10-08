import type { ReactNode } from 'react'
import { Skeleton, SkeletonCircle } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  SkelCard,
  SkelCardGrid,
  SkelChartCard,
  SkelDonutCard,
  SkelField,
  SkelFormCard,
  SkelHeaderUser,
  SkelPageFooter,
  SkelPageHeader,
  SkelPaginator,
  SkelPillTabs,
  SkelProfileCard,
  SkelRowList,
  SkelStatTiles,
  SkelTable,
  SkelTableCard,
  SkelToggleCard,
  SkelToolbar,
} from './parts'

/* Skeletons for the admin pages. Each renders the same top-level section
   sequence as the page it stands in for, so the layout doesn't shift when the
   real content arrives.
   These render inside AdminShell's <main>, so they start at the page header —
   never re-declare <main> or the sidebar. */

/* ---------- The list-page archetype ---------- */

/**
 * Header → optional tiles → optional tabs → toolbar → table card → footer.
 * Roughly half the admin console is this shape.
 */
export function ListPageSkeleton({
  actions = 1,
  subtitle = true,
  back = false,
  stats,
  tabs,
  search = true,
  selects = [],
  /** Tabs and filters share one justify-between row (taxes, check-in). */
  inlineFilters = false,
  cols = 6,
  rows = 10,
  minWidth,
  avatar = true,
  tableHeading = false,
  lead,
}: {
  actions?: number
  subtitle?: boolean
  back?: boolean
  stats?: { count: number; className?: string; delta?: boolean }
  tabs?: number
  search?: boolean
  selects?: string[]
  inlineFilters?: boolean
  cols?: number
  rows?: number
  minWidth?: string
  avatar?: boolean
  tableHeading?: boolean
  /** Anything the page puts between the header and the tabs. */
  lead?: ReactNode
}) {
  const hasToolbar = search || selects.length > 0

  return (
    <>
      <SkelPageHeader actions={actions} subtitle={subtitle} back={back} />
      {lead}

      {inlineFilters ? (
        <div
          className={cn(
            'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
            stats && 'mt-3',
          )}
        >
          {tabs ? <SkelPillTabs count={tabs} /> : <span />}
          <SkelToolbar search={search} selects={selects} className="" />
        </div>
      ) : (
        <>
          {tabs ? <SkelPillTabs count={tabs} className={stats ? 'mt-3' : undefined} /> : null}
          {hasToolbar && (
            <SkelToolbar
              search={search}
              selects={selects}
              className={tabs || stats || lead ? 'mt-3' : ''}
            />
          )}
        </>
      )}

      <SkelTableCard
        cols={cols}
        rows={rows}
        minWidth={minWidth}
        avatar={avatar}
        heading={tableHeading}
        className={tabs || hasToolbar || stats || lead ? 'mt-3' : ''}
      />
      <SkelPageFooter />
    </>
  )
}

/**
 * The six report sub-pages (income, transactions, payouts, registrations,
 * attendance, discounts): filter bar, four KPI tiles, then a titled table card.
 */
export function ReportSubPageSkeleton({
  cols = 6,
  minWidth = 'min-w-[720px]',
}: {
  cols?: number
  minWidth?: string
}) {
  return (
    <>
      <SkelPageHeader actions={1} />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:w-64" />
        <Skeleton className="h-10 w-full sm:w-52" />
      </div>
      <SkelStatTiles count={4} />
      <SkelTableCard cols={cols} minWidth={minWidth} avatar={false} heading />
      <SkelPageFooter />
    </>
  )
}

/* ---------- Overview screens ---------- */

/** Dashboard: five tiles, an area chart beside a donut, then two more panels. */
export function DashboardSkeleton() {
  return (
    <>
      <SkelPageHeader actions={1} />
      <SkelStatTiles count={5} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" />

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <SkelChartCard className="xl:col-span-3" />
        <SkelDonutCard className="xl:col-span-2" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <SkelCard className="xl:col-span-2" subtitle>
          <SkelRowList rows={3} lines={2} trailing="none" />
        </SkelCard>
        <SkelCard className="xl:col-span-3" subtitle>
          <SkelTable cols={5} rows={5} minWidth="min-w-[560px]" actions={false} />
        </SkelCard>
      </div>
      <SkelPageFooter />
    </>
  )
}

/** Reports overview: tabs + export buttons, five tiles, charts, bar panels, table. */
export function ReportsOverviewSkeleton() {
  return (
    <>
      <SkelPageHeader actions={0} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SkelPillTabs count={4} />
        <div className="flex items-center gap-2">
          <Skeleton className="hidden h-8 w-20 sm:block" />
          <Skeleton className="hidden h-8 w-20 sm:block" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <SkelStatTiles count={5} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" />

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <SkelChartCard className="xl:col-span-2" range={false} />
        <SkelDonutCard className="xl:col-span-1" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <SkelCard subtitle>
          <SkelBarRows rows={6} />
        </SkelCard>
        <SkelCard subtitle>
          <SkelBarRows rows={4} />
        </SkelCard>
      </div>

      <SkelCard className="mt-3" subtitle>
        <SkelTable cols={5} rows={6} minWidth="min-w-[720px]" avatar={false} actions={false} />
      </SkelCard>
      <SkelPageFooter />
    </>
  )
}

/** Label + track + figure rows, as used by the "by event" / "by channel" panels. */
function SkelBarRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3.5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-36 shrink-0 sm:w-44" />
          <Skeleton className="h-2 min-w-0 flex-1 rounded-full" />
          <Skeleton className="h-3 w-10 shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Home: three panels, then a 2/1 split, then the templates row. */
export function HomeSkeleton() {
  return (
    <>
      <header className="mb-5 flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 lg:hidden" />
        <div className="min-w-0">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-1.5 hidden h-3 w-72 sm:block" />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <Skeleton className="hidden h-9 w-28 sm:block" />
          <SkelHeaderUser />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <SkelCard subtitle>
          <SkelRowList rows={4} tile={false} lines={2} trailing="none" />
        </SkelCard>
        <SkelCard subtitle>
          <SkelRowList rows={2} lines={3} trailing="none" />
        </SkelCard>
        <SkelCard subtitle>
          <div className="mt-4 flex items-center gap-5">
            <SkeletonCircle className="h-36 w-36 shrink-0 sm:h-40 sm:w-40" />
            <div className="min-w-0 flex-1 space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <SkeletonCircle className="h-3 w-3 shrink-0" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </SkelCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <SkelCard className="xl:col-span-2" subtitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="rounded-xl bg-canvas p-4">
                <div className="flex items-center justify-between">
                  <SkeletonCircle className="h-7 w-12" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-3.5 w-full" />
                <Skeleton className="mt-3 h-2.5 w-24" />
                <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </SkelCard>
        <SkelCard className="xl:col-span-1" subtitle>
          <SkelRowList rows={4} tile={false} lines={2} trailing="none" />
        </SkelCard>
      </div>

      <SkelCard className="mt-4" subtitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="rounded-xl bg-canvas p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-16 rounded-full" />
                <SkeletonCircle className="h-7 w-7" />
              </div>
              <Skeleton className="mt-3 h-3.5 w-24" />
              <Skeleton className="mt-2 h-2.5 w-full" />
            </div>
          ))}
        </div>
      </SkelCard>
      <SkelPageFooter className="mt-6" />
    </>
  )
}

/* ---------- Card-grid pages ---------- */

/** Header → optional tabs/toolbar → a grid of cards → footer. */
export function CardGridPageSkeleton({
  actions = 1,
  tabs,
  search = false,
  selects = [],
  toggle = false,
  count = 6,
  grid = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3',
  cardClassName,
  media = false,
  countLine = false,
  paginator = false,
  lead,
}: {
  actions?: number
  tabs?: number
  search?: boolean
  selects?: string[]
  /** Grid/list view switch at the end of the toolbar. */
  toggle?: boolean
  count?: number
  grid?: string
  cardClassName?: string
  media?: boolean
  /** The "showing N results" line some grids put above the cards. */
  countLine?: boolean
  paginator?: boolean
  lead?: ReactNode
}) {
  const hasToolbar = search || selects.length > 0 || toggle
  // Something above the grid already supplies the gap.
  const spaced = tabs !== undefined || lead !== undefined

  return (
    <>
      <SkelPageHeader actions={actions} />
      {lead}
      {tabs ? <SkelPillTabs count={tabs} /> : null}
      {hasToolbar && (
        <div
          className={cn('flex flex-col gap-2 sm:flex-row sm:items-center', spaced && 'mt-3')}
        >
          {search && <Skeleton className="h-10 w-full flex-1" />}
          {selects.map((w, i) => (
            <Skeleton key={i} className={cn('h-10 w-full', w)} />
          ))}
          {toggle && <Skeleton className="h-10 w-20 shrink-0 self-start" />}
        </div>
      )}
      {countLine && <Skeleton className="mb-2 mt-3 h-2.5 w-40" />}

      <SkelCardGrid
        count={count}
        className={cn(grid, !countLine && (hasToolbar || spaced) && 'mt-3')}
        cardClassName={cardClassName}
        media={media}
      />
      {paginator && <SkelPaginator />}
      <SkelPageFooter />
    </>
  )
}

/* ---------- Bespoke admin pages ---------- */

/** Check-in: a progress card, then tabs beside the filters, then the table. */
export function CheckInSkeleton() {
  return (
    <>
      <SkelPageHeader actions={2} />
      <SkelCard className="p-4" heading={false}>
        <div className="flex items-baseline justify-between gap-2">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3.5 w-10" />
        </div>
        <Skeleton className="mt-2 h-2 w-full rounded-full" />
      </SkelCard>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SkelPillTabs count={3} />
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <Skeleton className="h-10 w-full sm:flex-1 lg:w-72" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
      </div>

      <SkelTableCard cols={5} minWidth="min-w-[760px]" />
      <SkelPageFooter />
    </>
  )
}

/** Check-in tool: the scanner column beside the stats + live feed rail. */
export function CheckInToolSkeleton() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-9 w-9 shrink-0 lg:hidden" />
          <div className="min-w-0">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-1.5 h-6 w-56 max-w-full" />
            <Skeleton className="mt-2 h-2.5 w-64 max-w-full" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="hidden h-9 w-28 sm:block" />
          <SkelHeaderUser />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        <section className="card overflow-hidden p-0 xl:col-span-3">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1.5 h-2.5 w-48" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="mx-5 mb-4 mt-1 rounded-2xl border border-hair px-6 py-8 sm:py-10">
            <Skeleton className="mx-auto aspect-square w-full max-w-[260px] rounded-xl" />
            <Skeleton className="mx-auto mt-6 h-2.5 w-56 max-w-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-hair px-5 py-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="ml-auto h-9 w-28" />
          </div>
          <div className="border-t border-hair px-5 py-4">
            <Skeleton className="h-9 w-full" />
          </div>
        </section>

        <div className="flex flex-col gap-3 xl:col-span-2">
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="mt-2 h-7 w-32" />
            <Skeleton className="mt-2.5 h-2 w-full rounded-full" />
            <div className="mt-3 flex items-center gap-4">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="ml-auto h-2.5 w-12" />
            </div>
          </section>
          <section className="card flex-1 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-10" />
            </div>
            <div className="mt-2 divide-y divide-line">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2.5">
                  <SkeletonCircle className="h-8 w-8 shrink-0" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <SkelPageFooter />
    </>
  )
}

/** Payouts: three balance cards, a section title, tabs, then the table. */
export function PayoutsSkeleton() {
  return (
    <>
      <SkelPageHeader actions={1} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <section key={i} className="card p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-7 w-32" />
            {i === 0 ? (
              <>
                <Skeleton className="mt-3 h-9 w-full" />
                <Skeleton className="mx-auto mt-2 h-2.5 w-32" />
              </>
            ) : (
              <Skeleton className="mt-3 h-2.5 w-40 max-w-full" />
            )}
          </section>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <SkelPillTabs count={5} className="mt-2" />
      <SkelTableCard cols={7} minWidth="min-w-[760px]" avatar={false} />
      <SkelPageFooter />
    </>
  )
}

/** Notifications: pill tabs over a grouped activity feed. */
export function NotificationsSkeleton() {
  return (
    <>
      <SkelPageHeader actions={1} />
      <SkelPillTabs count={2} />
      <div className="mt-4 space-y-4 rounded-2xl bg-surface p-2 sm:p-3">
        {[5, 3, 2].map((rows, g) => (
          <section key={g}>
            <Skeleton className="mb-2 ml-3 h-2.5 w-28" />
            <div className="space-y-0.5">
              {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className={cn('h-3', i % 2 ? 'w-1/2' : 'w-2/3')} />
                    <Skeleton className="h-2.5 w-5/6" />
                  </div>
                  <Skeleton className="h-2.5 w-12 shrink-0" />
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="px-1 pt-1 text-center">
          <Skeleton className="mx-auto h-8 w-40" />
        </div>
      </div>
      <SkelPageFooter />
    </>
  )
}

/** Announcements: the send banner, then the list of sent announcements. */
export function AnnouncementsSkeleton() {
  return (
    <>
      <SkelPageHeader actions={1} />
      <SkelCard heading={false}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-1.5 h-2.5 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </SkelCard>
      <SkelCard className="mt-3" heading={false}>
        <SkelRowList rows={6} lines={2} />
      </SkelCard>
      <SkelPageFooter />
    </>
  )
}

/** Meetings: tabs, filters, then a divided list of meeting rows. */
export function MeetingsSkeleton() {
  return (
    <>
      <SkelPageHeader actions={1} />
      <SkelPillTabs count={4} />
      <SkelToolbar selects={['sm:w-52']} />
      <section className="card mt-3 p-2 sm:p-3">
        <SkelRowList rows={8} lines={4} trailing="button" className="px-2" />
        <SkelPaginator className="mt-1 px-2 pb-1" />
      </section>
      <SkelPageFooter />
    </>
  )
}

/** Feedback: four tiles, then a searchable grid of per-event survey cards. */
export function FeedbackSkeleton() {
  return (
    <>
      <SkelPageHeader actions={1} />
      <SkelStatTiles count={4} className="grid grid-cols-2 gap-3 sm:grid-cols-4" />
      <section className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-2.5 w-52 max-w-full" />
          </div>
          <Skeleton className="h-10 w-44 shrink-0 sm:w-56" />
        </div>
        <SkelCardGrid
          count={5}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          footer={false}
          lines={1}
        />
      </section>
      <SkelPageFooter />
    </>
  )
}

/** Feedback detail: tiles, a 1/3–2/3 split, then the responses feed. */
export function FeedbackDetailSkeleton() {
  return (
    <>
      <SkelPageHeader actions={1} back />
      <SkelStatTiles count={4} className="grid grid-cols-2 gap-3 sm:grid-cols-4" delta={false} />

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <SkelCard className="xl:col-span-1" subtitle>
          <div className="mt-4 flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="h-2.5 w-9 shrink-0" />
                <Skeleton className="h-1.5 min-w-0 flex-1 rounded-full" />
                <Skeleton className="h-2.5 w-8 shrink-0" />
              </div>
            ))}
          </div>
        </SkelCard>
        <SkelCard className="xl:col-span-2" subtitle>
          <SkelTable cols={5} rows={4} minWidth="min-w-[560px]" avatar={false} />
        </SkelCard>
      </div>

      <SkelCard className="mt-4" heading={false}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1.5 h-2.5 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[9.5rem]" />
            <Skeleton className="h-9 w-[8rem]" />
          </div>
        </div>
        <SkelRowList rows={6} tile={false} lines={3} trailing="none" className="mt-3" />
        <SkelPaginator />
      </SkelCard>
      <SkelPageFooter className="mt-6" />
    </>
  )
}

/** Agenda: the week calendar — day columns over an hour grid. */
export function AgendaSkeleton() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 lg:hidden" />
          <div className="min-w-0">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-1.5 h-6 w-56 max-w-full" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <SkelHeaderUser />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-9" />
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-60" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-hair">
              <div />
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="space-y-1.5 px-3 py-3">
                  <Skeleton className="h-2.5 w-10" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
              <div className="border-r border-hair">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex h-14 items-start justify-end px-2 pt-1">
                    <Skeleton className="h-2.5 w-8" />
                  </div>
                ))}
              </div>
              {Array.from({ length: 7 }, (_, d) => (
                <div key={d} className="border-r border-line">
                  {Array.from({ length: 8 }, (_, h) => (
                    <div key={h} className="h-14 border-b border-line p-1">
                      {(d + h) % 4 === 1 && <Skeleton className="h-full w-full rounded-lg" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SkelPageFooter />
    </>
  )
}

/** Events: the view switch and status tabs above the events table. */
export function EventsSkeleton() {
  return (
    <>
      <SkelPageHeader actions={1} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-11 w-56 rounded-xl" />
        <SkelPillTabs count={2} />
      </div>
      <SkelToolbar selects={['sm:w-52', 'sm:w-44']} className="" />
      <section className="card mt-3 p-4">
        <SkelTable cols={5} minWidth="min-w-[640px]" avatar={false} />
        <SkelPaginator />
      </section>
      <SkelPageFooter />
    </>
  )
}

/** Landing pages: the "how it works" banner over four template previews. */
export function LandingPagesSkeleton() {
  return (
    <>
      <SkelPageHeader actions={1} />
      <div className="rounded-2xl bg-surface p-4 lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-2.5 w-64 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-64 max-w-full rounded-lg" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl bg-surface">
            <div className="bg-canvas p-3">
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-2.5 w-full" />
              <Skeleton className="mt-1.5 h-2.5 w-2/3" />
              <div className="mt-3 flex items-center gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <SkelPageFooter />
    </>
  )
}

/** The create-event wizard: step rail, form column, tips rail. */
export function EventFormSkeleton() {
  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 lg:hidden" />
        <Skeleton className="h-9 w-9 shrink-0" />
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <Skeleton className="hidden h-9 w-28 sm:block" />
          <SkelHeaderUser />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_270px]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="mt-2 h-6 w-40" />
          <Skeleton className="mt-2 h-2.5 w-28" />
          <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
          <div className="card mt-4 space-y-1 p-2.5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                <SkeletonCircle className="h-6 w-6 shrink-0" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-3">
          <div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1.5 h-2.5 w-64 max-w-full" />
          </div>
          <SkelFormCard fields={4} className="p-4" buttons={false} />
          <section className="card p-4">
            <Skeleton className="h-4 w-32" />
            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-hair py-8">
              <SkeletonCircle className="h-11 w-11" />
              <Skeleton className="h-2.5 w-40" />
            </div>
          </section>
          <section className="card p-4">
            <Skeleton className="h-4 w-28" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="grid grid-cols-[124px_minmax(0,1fr)_auto] items-center gap-2">
                  <Skeleton className="h-9" />
                  <Skeleton className="h-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              ))}
            </div>
          </section>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-[132px]" />
          </div>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-4 space-y-3">
            <div className="rounded-2xl bg-neutral-900 p-4">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-3 h-2.5 w-full" />
              <Skeleton className="mt-1.5 h-2.5 w-4/5" />
            </div>
            <section className="card p-4">
              <Skeleton className="h-3.5 w-24" />
              <div className="mt-3 space-y-2.5">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-2.5 w-12" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>
      <SkelPageFooter className="mt-6" />
    </>
  )
}

/** Event detail: cover hero, tab strip, then the overview panels. */
export function EventDetailSkeleton() {
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-9 w-9 shrink-0 lg:hidden" />
        <Skeleton className="h-9 w-9 shrink-0" />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Skeleton className="hidden h-9 w-20 sm:block" />
          <Skeleton className="hidden h-9 w-24 sm:block" />
          <SkelHeaderUser />
        </div>
      </div>

      <Skeleton className="mb-5 min-h-[190px] w-full rounded-2xl sm:min-h-[230px]" />

      <SkelPillTabs count={6} className="mb-5" />

      <div className="space-y-4">
        <SkelStatTiles count={4} className="grid grid-cols-2 gap-3 lg:grid-cols-4" delta={false} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <SkelCard subtitle>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Skeleton className="h-28 w-full shrink-0 rounded-xl sm:w-52" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            </SkelCard>
            <SkelCard subtitle>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </SkelCard>
          </div>
          <SkelCard className="xl:col-span-1">
            <SkelRowList rows={4} lines={2} trailing="none" />
          </SkelCard>
        </div>
      </div>
      <SkelPageFooter />
    </>
  )
}

/* ---------- Settings ---------- */

/** Profile and organization: the identity card beside a two-up form. */
export function SettingsProfileSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <>
      <SkelPageHeader actions={0} eyebrow />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <SkelProfileCard />
        <SkelFormCard fields={fields} />
      </div>
    </>
  )
}

/** Security: the two-up split of the security card and active sessions. */
export function SettingsSecuritySkeleton() {
  return (
    <>
      <SkelPageHeader actions={0} eyebrow />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="card p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1.5 h-2.5 w-56 max-w-full" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-hair bg-canvas px-3.5 py-3"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-44 max-w-full" />
                </div>
                <Skeleton className="h-8 w-20 shrink-0" />
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-1.5 h-2.5 w-52 max-w-full" />
          <SkelRowList rows={4} lines={2} className="mt-1" />
        </section>
      </div>
    </>
  )
}

/** Notification preferences: one card of email/SMS toggle rows. */
export function SettingsNotificationsSkeleton() {
  return (
    <>
      <SkelPageHeader actions={0} eyebrow />
      <SkelToggleCard rows={5} toggles={2} />
    </>
  )
}

/** Payment settings: test banner, connection, API keys, then a two-up split. */
export function SettingsPaymentsSkeleton() {
  return (
    <>
      <SkelPageHeader actions={0} eyebrow />
      <div className="space-y-3">
        <Skeleton className="h-11 w-full rounded-xl" />

        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-52 max-w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-36 rounded-lg" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </section>

        <section className="card p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-9 w-full rounded-lg" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SkelField />
            <SkelField />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-hair pt-3">
            <Skeleton className="h-2.5 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
          <SkelToggleCard rows={5} />
          <section className="card p-4">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-1.5 h-2.5 w-52 max-w-full" />
            <div className="mt-3 grid grid-cols-1 gap-4">
              <SkelField />
              <SkelField />
            </div>
            <div className="mt-3 space-y-3 border-t border-hair pt-3">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end border-t border-hair pt-3">
              <Skeleton className="h-9 w-28" />
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

/** Roles: a search + create row above four permission cards. */
export function RolesSkeleton() {
  return (
    <>
      <SkelPageHeader actions={0} />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:max-w-xs" />
        <Skeleton className="h-10 w-32 sm:ml-auto" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card flex flex-col p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <Skeleton className="mt-3 h-2.5 w-full" />
            <div className="mb-5 mt-3 space-y-1.5">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="h-2.5 w-5/6" />
              ))}
            </div>
            <Skeleton className="mt-auto h-9 w-full" />
          </div>
        ))}
      </div>
      <SkelPageFooter />
    </>
  )
}

/* ---------- Shell chrome ---------- */

/**
 * The whole admin screen, used when a navigation arrives from outside /admin
 * (or on first paint) and AdminShell itself is not mounted yet.
 */
export function AdminShellSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <aside className="hidden w-16 shrink-0 flex-col items-center bg-[#0e0f12] py-4 lg:flex dark:bg-[#101613]">
        <SkeletonCircle className="h-9 w-9 opacity-20" />
        <div className="mt-5 flex flex-col items-center gap-1.5">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-9 opacity-20" />
          ))}
        </div>
      </aside>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-hair bg-surface lg:flex">
        <div className="mt-4 flex h-9 items-center px-4">
          <Skeleton className="h-5 w-28" />
        </div>
        <nav className="mt-2 space-y-3 px-2.5">
          {Array.from({ length: 4 }, (_, g) => (
            <div key={g}>
              <Skeleton className="mx-2.5 h-3.5 w-28" />
              <div className="mt-2 space-y-1.5 pl-9 pr-2.5">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-3 w-24" />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-4 lg:px-7">
        <div className="mx-auto w-full max-w-[1600px]">{children}</div>
      </main>
    </div>
  )
}
