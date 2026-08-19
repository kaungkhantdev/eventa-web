import { useEffect, useRef, useState } from 'react'
import { Link, useFetcher, useLoaderData } from 'react-router'
import { Icon } from '@/components/ui'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useTheme } from '@/lib/useTheme'
import { cn } from '@/lib/cn'
import { MASKED } from '@/lib/format'
import type { PageWindow } from '@/lib/paging'
import type { ActionResult } from '@/app/loaders'
import { signUpPathFor } from '@/features/auth/personas'
import { ALL_CATEGORIES, lookOfCategory } from '../discover.presentation'
import type { DiscoverData } from '../discover.routes'
import type { DiscoverCard } from '../discover.types'

/**
 * Attendee "What's on" browser (portal/discover.html), on the public feed.
 *
 * The search box and the category strip write to the URL, not to component
 * state: the API pages server-side, so a filtered result is a request rather
 * than a slice of what happened to be loaded, and the address bar is what makes
 * a search shareable and the back button honest.
 *
 * The kit invented a rating, a cover photo and three attendee faces from each
 * slug. All three now come from the API or not at all.
 */

const SAVE_OFF =
  'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60'
const SAVE_ON =
  'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white text-red-500 shadow-sm transition'

export default function DiscoverPage() {
  const data = useLoaderData() as DiscoverData
  const { params, set } = useFilters()
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (next) =>
    // Replace, not push: a search is typed, and every keystroke does not
    // deserve its own entry in the back button's history.
    set({ q: next || null, page: null }, { replace: true }),
  )
  const category = params.get('category') ?? ALL_CATEGORIES
  const saved = new Set(data.saved)

  return (
    <div className="h-full bg-surface font-sans text-ink antialiased">
      <TopBar value={term} onSearch={setTerm} />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-7 lg:px-6">
        <div className="mb-6">
          <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[34px]">
            What's on in <span className="text-brand">Bangkok</span>
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            Find your next conference, concert, workshop or festival — all in one place.
          </p>
        </div>

        <CategoryStrip
          categories={data.categories}
          active={category}
          onPick={(next) => set({ category: next === ALL_CATEGORIES ? null : next, page: null })}
        />

        <p className="mb-3 text-[12px] font-medium text-muted">
          {data.window.total} {data.window.total === 1 ? 'event' : 'events'}
        </p>

        {data.cards.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.cards.map((card) => (
              <EventCard key={card.id} card={card} saved={saved.has(card.id)} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        <Pager window={data.window} onPage={(page) => set({ page })} />

        <p className="mt-10 text-center text-[11px] text-muted/70">
          Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
        </p>
      </main>
    </div>
  )
}

/** Where "Create an event" leads — the organizer's sign-up, not the attendee's. */
const ORGANIZER_SIGN_UP = signUpPathFor('admin')

function TopBar({ value, onSearch }: { value: string; onSearch: (next: string) => void }) {
  const { dark, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-30 border-b border-hair bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 lg:px-6">
        <Link to="/portal/discover" className="flex shrink-0 items-center gap-2.5">
          <span className="brand-logo text-brand h-[17px] w-[31px]" />
          <span className="hidden text-[15px] font-extrabold tracking-tight sm:inline">Eventa</span>
        </Link>
        <div className="relative min-w-0 flex-1">
          <i className="hgi-stroke hgi-search-01 pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-muted" />
          <input
            type="search"
            value={value}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search events"
            className="h-9 w-full rounded-full border border-transparent bg-canvas pl-10 pr-4 text-[13px] text-ink transition placeholder:text-muted hover:bg-line focus:border-brand/40 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
            placeholder="Search events, cities, categories…"
            autoComplete="off"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to="/portal/discover"
            className="hidden rounded-lg px-3 py-1.5 text-[13px] font-semibold text-brand md:inline-flex md:items-center md:gap-1.5"
          >
            <i className="hgi-stroke hgi-compass-01 text-[15px]" />
            Explore
          </Link>
          <Link
            to="/portal/my-events"
            className="hidden rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition hover:bg-line hover:text-ink md:inline-flex md:items-center md:gap-1.5"
          >
            <i className="hgi-stroke hgi-ticket-02 text-[15px]" />
            My tickets
          </Link>
          {/* The console's only door from the public side. An organizer
              arriving here would otherwise find just the attendee sign-in and
              no way through — the two personas never share a login. */}
          <Link
            to={ORGANIZER_SIGN_UP}
            className="hidden rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition hover:bg-line hover:text-ink md:inline-flex md:items-center md:gap-1.5"
          >
            <i className="hgi-stroke hgi-calendar-add-01 text-[15px]" />
            Create an event
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="btn-icon bg-surface"
            title="Toggle theme"
          >
            <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={18} />
          </button>
          <Link to="/portal/login" className="btn btn-primary btn-sm">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  )
}

/**
 * The Meetup-style strip: icon over label, active = underline.
 *
 * Its own panel, so a categories request that fails costs the visitor the
 * shortcut and nothing else — the grid beneath it is a separate request and
 * still works.
 */
function CategoryStrip({
  categories,
  active,
  onPick,
}: {
  categories: DiscoverData['categories']
  active: string
  onPick: (category: string) => void
}) {
  const strip = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  useEffect(() => {
    const el = strip.current
    const measure = () => {
      if (!el) return
      setCanLeft(el.scrollLeft > 2)
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
    }
    measure()
    el?.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    // Re-measure once the icon font lands — glyph widths shift the layout.
    const settle = window.setTimeout(measure, 350)
    return () => {
      el?.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      window.clearTimeout(settle)
    }
  }, [categories])

  if (!categories.ok) return null

  const chips = [ALL_CATEGORIES, ...categories.data]
  const scrollBy = (direction: number) =>
    strip.current?.scrollBy({
      left: direction * Math.max(200, strip.current.clientWidth * 0.7),
      behavior: 'smooth',
    })

  return (
    <div className="relative mb-6">
      <div
        ref={strip}
        className="no-scrollbar flex gap-7 overflow-x-auto scroll-smooth px-0.5 sm:gap-9"
      >
        {chips.map((chip) => {
          const on = chip === active
          const look = lookOfCategory(chip)
          return (
            <button
              key={chip}
              type="button"
              onClick={() => onPick(chip)}
              aria-pressed={on}
              className="group flex shrink-0 flex-col items-center gap-1.5 pt-0.5 outline-none"
            >
              <i
                className={cn(
                  'hgi-stroke text-[27px] leading-none transition group-hover:scale-110',
                  look.icon,
                )}
                style={{ color: look.colour }}
              />
              <span
                className={cn(
                  'whitespace-nowrap border-b-2 pb-2.5 text-[12.5px] transition',
                  on
                    ? 'border-ink font-semibold text-ink'
                    : 'border-transparent text-muted group-hover:text-ink',
                )}
              >
                {chip}
              </span>
            </button>
          )
        })}
      </div>
      <StripArrow side="left" shown={canLeft} onClick={() => scrollBy(-1)} />
      <StripArrow side="right" shown={canRight} onClick={() => scrollBy(1)} />
    </div>
  )
}

function StripArrow({
  side,
  shown,
  onClick,
}: {
  side: 'left' | 'right'
  shown: boolean
  onClick: () => void
}) {
  const left = side === 'left'
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-y-0 items-center',
        left ? 'left-0 pr-8' : 'right-0 justify-end pl-8',
        shown ? 'flex' : 'hidden',
      )}
      style={{
        background: `linear-gradient(${left ? '90deg' : '270deg'}, rgb(var(--surface)) 55%, transparent)`,
      }}
    >
      <button
        type="button"
        aria-label={`Scroll categories ${side}`}
        onClick={onClick}
        className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-ink text-canvas shadow-md transition hover:opacity-90"
      >
        <Icon name={left ? 'hgi-arrow-left-01' : 'hgi-arrow-right-01'} size={18} />
      </button>
    </div>
  )
}

function EventCard({ card, saved }: { card: DiscoverCard; saved: boolean }) {
  const look = lookOfCategory(card.category)
  const save = useFetcher<ActionResult>()
  // The heart answers the press, not the round trip.
  const on = save.formData ? save.formData.get('save') === 'true' : saved

  return (
    // The heart is a sibling of the link, not a child of it: a form inside an
    // anchor is invalid markup, and suppressing the anchor to let the button
    // through would suppress the submit with it.
    <div className="group relative">
      <Link to={card.href} className="block">
        <div
          className="relative aspect-[3/2] overflow-hidden rounded-2xl"
          style={{
            backgroundImage: `linear-gradient(135deg, ${card.accent}, ${look.colour}cc)`,
          }}
        >
          {card.cover && (
            <img
              src={card.cover}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          )}
          {card.badge && (
            <span
              className={cn(
                'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm',
                card.badge.kind === 'waitlist' ? 'bg-amber-500' : 'bg-black/60 backdrop-blur-sm',
              )}
            >
              {card.badge.label}
            </span>
          )}
        </div>

        <div className="pt-3">
          <p
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: card.accent }}
          >
            {card.category}
          </p>
          <h3 className="mt-1 line-clamp-2 text-[15.5px] font-bold leading-snug tracking-tight text-ink transition group-hover:text-brand">
            {card.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted">
            <Icon name="hgi-calendar-03" size={14} />
            <span className="truncate">{card.when}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
            <Icon name="hgi-location-01" size={14} />
            <span className="truncate">{card.where}</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-[12.5px] text-muted">
            <span className="truncate">by {card.organizer}</span>
            {card.rating && (
              <>
                <span>·</span>
                <i className="hgi-stroke hgi-star text-[13px] text-amber-400" />
                <span className="font-semibold text-ink">{card.rating}</span>
              </>
            )}
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[12px] text-muted">{card.going} going</span>
            <Price price={card.price} />
          </div>
        </div>
      </Link>

      <save.Form method="post" action="/portal/discover">
        <input type="hidden" name="eventId" value={card.id} />
        <input type="hidden" name="save" value={String(!on)} />
        <button
          type="submit"
          aria-label={on ? `Remove ${card.name} from saved` : `Save ${card.name}`}
          aria-pressed={on}
          className={on ? SAVE_ON : SAVE_OFF}
        >
          <Icon name="hgi-favourite" size={16} />
        </button>
      </save.Form>

      {save.data?.ok === false && (
        <p role="alert" className="mt-1 text-[11px] text-red-500">
          {save.data.error}
        </p>
      )}
    </div>
  )
}

/** No price is not a free price — nothing is left to buy. */
function Price({ price }: { price: DiscoverCard['price'] }) {
  if (price === null) return <span className="text-[13px] text-muted">{MASKED}</span>
  if (price.isFree) return <span className="text-[13px] font-semibold text-brand">Free</span>
  return (
    <span className="text-[13px] text-muted">
      From <span className="font-bold text-ink">{price.label}</span>
    </span>
  )
}

/**
 * Prev/next through the feed.
 *
 * Deliberately not the admin `Paginator`: that one offers a page-size dropdown,
 * which is a tool for working through a table, not for browsing what's on. The
 * grid is a fixed twelve so that every page is whole rows.
 */
function Pager({ window: page, onPage }: { window: PageWindow; onPage: (page: number) => void }) {
  if (page.pageCount <= 1) return null

  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={page.page <= 1}
        onClick={() => onPage(page.page - 1)}
      >
        <Icon name="hgi-arrow-left-01" size={16} />
        Previous
      </button>
      <span className="tnum text-[12.5px] text-muted">
        Page {page.page} of {page.pageCount}
      </span>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={page.page >= page.pageCount}
        onClick={() => onPage(page.page + 1)}
      >
        Next
        <Icon name="hgi-arrow-right-01" size={16} />
      </button>
    </nav>
  )
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-line text-muted">
        <Icon name="hgi-search-remove" size={26} />
      </span>
      <p className="mt-3 text-[15px] font-semibold">No events found</p>
      <p className="mt-1 text-[13px] text-muted">Try a different search or category.</p>
    </div>
  )
}
