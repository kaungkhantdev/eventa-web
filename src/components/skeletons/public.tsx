import { Skeleton, SkeletonCircle } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SkelCardGrid, SkelField, SkelPillTabs } from './parts'

/* Skeletons for the pages that render outside AdminShell: the two sign-in
   personas, the attendee portal, the four landing-page themes and the 404.
   These own the whole viewport, so each one reproduces its page's outer frame
   (navbar, container width, background) as well as its content. */

/* ---------- Auth ---------- */

/** The `AuthLayout` frame: centred card under a brand lockup. */
export function AuthSkeleton({
  fields = 2,
  social = 2,
  divider = true,
}: {
  fields?: number
  /** Google / LinkedIn / Apple buttons under the "or" rule. */
  social?: number
  divider?: boolean
}) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-14 sm:py-20">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>

        <div className="card p-6">
          <div className="space-y-4">
            {Array.from({ length: fields }, (_, i) => (
              <SkelField key={i} />
            ))}
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          {divider && (
            <div className="my-5 flex items-center gap-3">
              <Skeleton className="h-px flex-1" />
              <Skeleton className="h-2.5 w-6" />
              <Skeleton className="h-px flex-1" />
            </div>
          )}

          {social > 0 && (
            <div className="space-y-2.5">
              {Array.from({ length: social }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
        </div>

        <Skeleton className="mx-auto mt-6 h-3 w-44" />
      </div>
    </div>
  )
}

/* ---------- Portal chrome ---------- */

/** The sticky portal navbar. Discover puts a search field in the middle. */
function PortalNav({
  width = 'max-w-5xl',
  search = false,
  items = 3,
}: {
  width?: string
  search?: boolean
  items?: number
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-hair bg-surface/90 backdrop-blur">
      <div
        className={cn('mx-auto flex h-14 items-center gap-3 px-4 lg:px-6', width)}
      >
        <Skeleton className="h-5 w-24 shrink-0" />
        {search && <Skeleton className="h-9 min-w-0 flex-1" />}
        <div className={cn('flex shrink-0 items-center gap-3', !search && 'ml-auto')}>
          {Array.from({ length: items }, (_, i) => (
            <Skeleton key={i} className={cn('h-8', i === items - 1 ? 'w-9' : 'hidden w-20 sm:block')} />
          ))}
        </div>
      </div>
    </header>
  )
}

/** Discover: hero, the category strip, then the event card grid. */
export function PortalDiscoverSkeleton() {
  return (
    <div className="h-full bg-surface">
      <PortalNav search items={4} />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-7 lg:px-6">
        <div className="mb-6">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="mt-2 h-3.5 w-96 max-w-full" />
        </div>

        <div className="no-scrollbar mb-6 flex gap-7 overflow-hidden px-0.5 sm:gap-9">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-2 pb-2.5">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          ))}
        </div>

        <Skeleton className="mb-3 h-2.5 w-32" />

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
              <div className="pt-3">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1.5 h-4 w-2/3" />
                <Skeleton className="mt-2.5 h-2.5 w-40" />
                <Skeleton className="mt-1.5 h-2.5 w-32" />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 3 }, (_, j) => (
                      <SkeletonCircle key={j} className="h-6 w-6" />
                    ))}
                  </div>
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="mx-auto mt-10 h-2.5 w-72 max-w-full" />
      </main>
    </div>
  )
}

/** My events: the tabbed attendee area, defaulting to the ticket cards. */
export function PortalMyEventsSkeleton() {
  return (
    <div className="h-full bg-canvas">
      <PortalNav items={4} />
      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-3.5 w-72 max-w-full" />
        <SkelPillTabs count={4} className="mt-4" />

        <div className="mt-5">
          <Skeleton className="mb-3 h-4 w-40" />
          <PortalEventCards />
          <Skeleton className="mb-3 mt-7 h-4 w-32" />
          <PortalEventCards />
        </div>

        <Skeleton className="mx-auto mt-8 h-2.5 w-72 max-w-full" />
      </main>
    </div>
  )
}

/** Three ticket cards: image header, overhanging badge, body, action row. */
function PortalEventCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          <Skeleton className="h-24 w-full rounded-none" />
          <div className="px-4 pb-4 pt-7">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-2.5 w-32" />
            <Skeleton className="mt-1.5 h-2.5 w-24" />
            <div className="mt-3.5 flex gap-2 border-t border-hair pt-3.5">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Registration: ticket tiers, the seat map, payment, and the fixed footer bar. */
export function PortalRegisterSkeleton() {
  return (
    <div className="h-full bg-canvas">
      <PortalNav width="max-w-4xl" items={2} />
      <main className="mx-auto max-w-4xl px-4 pb-36 pt-6 lg:px-6">
        <div className="mb-5">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="mt-2 h-8 w-96 max-w-full" />
          <Skeleton className="mt-2 h-3 w-72 max-w-full" />
        </div>

        <section className="mb-6">
          <Skeleton className="mb-3 h-3.5 w-32" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </section>

        <section>
          <Skeleton className="mb-3 h-3.5 w-40" />
          <div className="rounded-2xl bg-surface p-5 sm:p-7">
            <Skeleton className="mx-auto h-6 w-40" />
            <div className="mt-6 space-y-2">
              {Array.from({ length: 7 }, (_, r) => (
                <div key={r} className="flex justify-center gap-1.5">
                  {Array.from({ length: 16 }, (_, c) => (
                    <Skeleton
                      key={c}
                      className={cn('h-5 w-5 rounded', c === 8 && 'ml-5')}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center gap-4">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-2.5 w-16" />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <Skeleton className="mb-3 h-3.5 w-32" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
            <div className="card p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
              <div className="mt-4 space-y-3">
                <SkelField />
                <SkelField />
                <SkelField />
              </div>
            </div>
            <div className="card h-fit p-4 sm:p-5">
              <Skeleton className="h-4 w-32" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-2.5 w-14" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hair bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    </div>
  )
}

/** Survey: a single centred card of questions. */
export function PortalSurveySkeleton() {
  return (
    <div className="h-full bg-canvas">
      <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <Skeleton className="mx-auto mb-6 h-5 w-28" />
        <div className="card overflow-hidden">
          <Skeleton className="h-28 w-full rounded-none" />
          <div className="p-5 sm:p-7">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="mt-2 h-3 w-full" />

            <div className="mt-6 space-y-7">
              <div>
                <Skeleton className="h-3 w-64 max-w-full" />
                <div className="mt-2.5 flex gap-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-8 w-8" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-3 w-52" />
                <Skeleton className="mt-2.5 h-20 w-full" />
              </div>
              <div>
                <Skeleton className="h-3 w-56" />
                <div className="mt-2.5 space-y-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-11 w-full rounded-lg" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-3 w-48" />
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        <Skeleton className="mx-auto mt-6 h-2.5 w-72 max-w-full" />
      </main>
    </div>
  )
}

/* ---------- Landing themes ---------- */

type LandingVariant = 'atlas' | 'aurora' | 'minimal' | 'noir'

/** Per-theme frame geometry — the parts a skeleton actually draws. */
const LANDING: Record<
  LandingVariant,
  { width: string; hero: 'poster' | 'card' | 'centered' | 'split'; panelled: boolean }
> = {
  // Full-bleed poster hero over alternating colour bands.
  atlas: { width: 'max-w-6xl', hero: 'poster', panelled: false },
  // Every section is its own rounded surface card.
  aurora: { width: 'max-w-[1080px]', hero: 'card', panelled: true },
  // Narrow single column, sections split by hairlines.
  minimal: { width: 'max-w-[720px]', hero: 'centered', panelled: false },
  // Banner over a two-column split with a sticky register card.
  noir: { width: 'max-w-[1080px]', hero: 'split', panelled: true },
}

/**
 * A landing page. All four themes run the same content sequence — hero,
 * highlights, about, agenda, speakers, tickets, FAQ, CTA — so the variant only
 * changes the container width, the hero treatment and whether sections sit on
 * cards.
 */
export function LandingSkeleton({ variant }: { variant: LandingVariant }) {
  const { width, hero, panelled } = LANDING[variant]
  const section = cn('mx-auto px-5 py-8 sm:px-6 lg:py-10', width)
  const panel = panelled ? 'rounded-2xl bg-surface p-6 sm:p-8' : ''

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
        <div className={cn('mx-auto flex h-14 items-center justify-between gap-4 px-5 sm:px-6', width)}>
          <Skeleton className="h-5 w-28" />
          <div className="flex items-center gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="hidden h-3 w-16 sm:block" />
            ))}
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </header>

      {hero === 'poster' && (
        <div className="relative flex min-h-[70vh] items-end bg-surface">
          <div className={cn('relative w-full px-5 pb-14 pt-28 sm:px-6', 'mx-auto', width)}>
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="mt-5 h-14 w-full max-w-3xl" />
            <Skeleton className="mt-3 h-14 w-2/3 max-w-xl" />
            <div className="mt-7 flex flex-wrap gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-32 rounded-full" />
              ))}
            </div>
            <div className="mt-7 flex gap-3">
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {hero === 'card' && (
        <div className={cn('mx-auto px-4 py-8 sm:px-6', width)}>
          <div className="overflow-hidden rounded-2xl bg-surface">
            <Skeleton className="min-h-[240px] w-full rounded-none sm:min-h-[300px]" />
            <div className="px-6 py-6 sm:px-9 sm:py-7">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="mt-3 h-3 w-full max-w-xl" />
              <div className="mt-5 flex flex-wrap gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-8 w-28 rounded-full" />
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
          </div>
        </div>
      )}

      {hero === 'centered' && (
        <div className={cn('mx-auto px-6 pb-14 pt-16 text-center sm:pt-24', width)}>
          <Skeleton className="mx-auto h-2.5 w-24" />
          <Skeleton className="mx-auto mt-4 h-10 w-full" />
          <Skeleton className="mx-auto mt-3 h-10 w-3/4" />
          <Skeleton className="mx-auto mt-4 h-3 w-2/3" />
          <div className="mt-6 flex justify-center gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="mt-12 aspect-[16/8] w-full rounded-2xl" />
        </div>
      )}

      {hero === 'split' && (
        <div className={cn('mx-auto px-5 pb-12 pt-10 sm:px-6 lg:pb-16 lg:pt-16', width)}>
          <Skeleton className="mb-8 aspect-[21/9] w-full rounded-2xl" />
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
            <div>
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="mt-4 h-10 w-full" />
              <Skeleton className="mt-3 h-10 w-3/4" />
              <Skeleton className="mt-4 h-3 w-full max-w-lg" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-3 w-56 max-w-full" />
                ))}
              </div>
            </div>
            <aside className="rounded-2xl bg-surface p-5 sm:p-6">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="mt-4 h-10 w-32" />
              <Skeleton className="mt-4 h-10 w-full" />
              <Skeleton className="mt-2 h-10 w-full" />
              <div className="mt-5 space-y-3.5 border-t border-hair pt-5">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* highlights */}
      <section className={section}>
        <div className={cn('grid grid-cols-2 gap-4 md:grid-cols-4', panel)}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={panelled ? '' : 'rounded-2xl bg-surface p-5'}>
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="mt-3 h-3.5 w-24" />
              <Skeleton className="mt-2 h-2.5 w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* about */}
      <section className={section}>
        <div className={cn('grid gap-8 md:grid-cols-[1.5fr_1fr] md:gap-10', panel)}>
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* agenda */}
      <section className={section}>
        <div className={panel}>
          <Skeleton className="h-6 w-40" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="grid grid-cols-[64px_1fr] gap-4 border-b border-line pb-4 sm:grid-cols-[92px_1fr]">
                <Skeleton className="h-2.5 w-14" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* speakers */}
      <section className={section}>
        <div className={panel}>
          <Skeleton className="h-6 w-36" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={panelled ? '' : 'rounded-2xl bg-surface p-4'}>
                <SkeletonCircle className="h-14 w-14" />
                <Skeleton className="mt-3 h-3.5 w-24" />
                <Skeleton className="mt-2 h-2.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* tickets */}
      <section className={section}>
        <Skeleton className="h-6 w-32" />
        <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={cn('rounded-2xl bg-surface p-5', i === 1 && 'md:-translate-y-2')}>
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-4 h-9 w-28" />
              <div className="mt-5 space-y-2.5">
                {Array.from({ length: 4 }, (_, j) => (
                  <Skeleton key={j} className="h-2.5 w-5/6" />
                ))}
              </div>
              <Skeleton className="mt-6 h-10 w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* faq */}
      <section className={section}>
        <Skeleton className="h-6 w-24" />
        <div className={cn('mt-6', panelled && 'rounded-2xl bg-surface px-4')}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-line py-4">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* closing CTA + footer */}
      <section className={section}>
        <div className="rounded-2xl bg-surface p-8 text-center sm:p-10">
          <Skeleton className="mx-auto h-7 w-64 max-w-full" />
          <Skeleton className="mx-auto mt-3 h-3 w-80 max-w-full" />
          <Skeleton className="mx-auto mt-6 h-11 w-40" />
        </div>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Skeleton className="h-2.5 w-48" />
          <Skeleton className="h-2.5 w-32" />
        </div>
        <Skeleton className="mx-auto mt-6 h-2.5 w-56" />
      </section>
    </div>
  )
}

/* ---------- Fallbacks ---------- */

/** The 404 screen — and the shape used for any unmatched path. */
export function NotFoundSkeleton() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <Skeleton className="mx-auto h-5 w-28" />
        <Skeleton className="mx-auto mt-10 h-20 w-20 rounded-2xl" />
        <Skeleton className="mx-auto mt-6 h-2.5 w-20" />
        <Skeleton className="mx-auto mt-3 h-8 w-72 max-w-full" />
        <Skeleton className="mx-auto mt-3 h-3 w-80 max-w-full" />
        <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}

/** Used when a path has no registered skeleton — a plain centred page frame. */
export function GenericPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-3 h-3 w-80 max-w-full" />
      <SkelCardGrid count={6} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" />
    </div>
  )
}
