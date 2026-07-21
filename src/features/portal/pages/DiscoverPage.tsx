import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '@/components/ui'
import { useTheme } from '@/lib/useTheme'
import { cn } from '@/lib/cn'
import { num } from '@/lib/format'
import { PORTAL_EVENTS, type PortalEvent } from '../data/events'

/* Attendee "What's on" browser (portal/discover.html). Standalone page with a
   Meetup-style category strip (icon over label, active = underline), search,
   and a responsive event-card grid derived from the shared event catalogue. */

const ALL = 'All events'

const GRAD: [string, string][] = [
  ['#1ba770', '#059669'],
  ['#7c3aed', '#c026d3'],
  ['#f59e0b', '#f97316'],
  ['#0ea5e9', '#6366f1'],
  ['#f43f5e', '#ec4899'],
  ['#14b8a6', '#06b6d4'],
  ['#8b5cf6', '#6d28d9'],
  ['#10b981', '#0d9488'],
  ['#eab308', '#f59e0b'],
]

const CAT_ICON: Record<string, string> = {
  'All events': 'hgi-sparkles',
  Concert: 'hgi-music-note-01',
  Conference: 'hgi-presentation-01',
  Exhibition: 'hgi-image-01',
  'Food & Drink': 'hgi-restaurant-02',
  Meetup: 'hgi-user-group',
  Networking: 'hgi-connect',
  'Sports & Wellness': 'hgi-workout-run',
  Wedding: 'hgi-favourite',
}

const CAT_COLOR: Record<string, string> = {
  'All events': '#1ba770',
  Concert: '#7c3aed',
  Conference: '#0ea5e9',
  Exhibition: '#ec4899',
  'Food & Drink': '#f97316',
  Meetup: '#6366f1',
  Networking: '#14b8a6',
  'Sports & Wellness': '#f59e0b',
  Wedding: '#f43f5e',
}

const SAVE_OFF =
  'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60'
const SAVE_ON =
  'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white text-red-500 shadow-sm transition'

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function catIcon(c: string) {
  return CAT_ICON[c] || 'hgi-ticket-star'
}
function rating(slug: string) {
  return (4.3 + (hash(slug) % 7) / 10).toFixed(1)
}
function going(ev: PortalEvent) {
  return Math.max(0, ev.capacity - ev.seatsLeft)
}
function tpl(cat: string) {
  const c = (cat || '').toLowerCase()
  if (/festival|food|music|concert/.test(c)) return 'atlas'
  if (/wedding/.test(c)) return 'minimal'
  if (/exhibition|art/.test(c)) return 'noir'
  return 'aurora'
}
function isFree(ev: PortalEvent) {
  return /free/i.test(ev.priceFrom || '') || /^฿?0$/.test((ev.priceFrom || '').replace(/[, ]/g, ''))
}

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

function Avatars({ slug }: { slug: string }) {
  return (
    <span className="flex -space-x-2">
      {[0, 1, 2].map((i) => {
        const gg = GRAD[(hash(slug) + i * 3) % GRAD.length]!
        return (
          <span
            key={i}
            className="relative inline-block h-6 w-6 overflow-hidden rounded-full ring-2 ring-canvas"
            style={{ backgroundImage: `linear-gradient(135deg,${gg[0]},${gg[1]})` }}
          >
            <img
              src={`https://picsum.photos/seed/${encodeURIComponent(slug)}-a${i}/48/48`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={hideOnError}
            />
          </span>
        )
      })}
    </span>
  )
}

function EventCard({
  ev,
  saved,
  onToggleSave,
}: {
  ev: PortalEvent
  saved: boolean
  onToggleSave: () => void
}) {
  const g = GRAD[hash(ev.slug) % GRAD.length]!
  const free = isFree(ev)
  const left = ev.seatsLeft
  const cap = ev.capacity
  const pct = left != null && cap ? left / cap : 1
  const loc = [ev.venue, ev.city].filter(Boolean).join(', ')

  return (
    <Link to={`/landing/${tpl(ev.category)}?event=${encodeURIComponent(ev.slug)}`} className="group block">
      <div
        className="relative aspect-[3/2] overflow-hidden rounded-2xl"
        style={{ backgroundImage: `linear-gradient(135deg,${g[0]},${g[1]})` }}
      >
        <img
          src={`https://picsum.photos/seed/${encodeURIComponent(ev.slug)}/560/374`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={hideOnError}
        />
        {left === 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            Waitlist
          </span>
        ) : pct <= 0.15 ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            Selling fast
          </span>
        ) : null}
        <button
          type="button"
          aria-label="Save event"
          className={saved ? SAVE_ON : SAVE_OFF}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleSave()
          }}
        >
          <Icon name="hgi-favourite" size={16} />
        </button>
      </div>
      <div className="pt-3">
        <p
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: ev.accent || '#1ba770' }}
        >
          {ev.category || 'Event'}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15.5px] font-bold leading-snug tracking-tight text-ink transition group-hover:text-brand">
          {ev.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted">
          <Icon name="hgi-calendar-03" size={14} />
          <span className="truncate">{ev.dateText || ''}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
          <Icon name="hgi-location-01" size={14} />
          <span className="truncate">{loc}</span>
        </p>
        <p className="mt-1 flex items-center gap-1 text-[12.5px] text-muted">
          <span className="truncate">by {ev.organizer || 'Eventa'}</span>
          <span>·</span>
          <i className="hgi-stroke hgi-star text-[13px] text-amber-400" />
          <span className="font-semibold text-ink">{rating(ev.slug)}</span>
        </p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[12px] text-muted">
            <Avatars slug={ev.slug} />
            <span>{num(going(ev))} going</span>
          </span>
          <span className="text-[13px] text-muted">
            {free ? (
              <span className="font-semibold text-brand">Free</span>
            ) : (
              <>
                From <span className="font-bold text-ink">{ev.priceFrom}</span>
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function DiscoverPage() {
  const { dark, toggle } = useTheme()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(ALL)
  const [saved, setSaved] = useState<Set<string>>(new Set())

  const catsRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const cats = useMemo(
    () => [ALL, ...Array.from(new Set(PORTAL_EVENTS.map((e) => e.category))).sort()],
    [],
  )

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return PORTAL_EVENTS.filter((ev) => {
      if (cat !== ALL && ev.category !== cat) return false
      if (!query) return true
      return [ev.title, ev.category, ev.city, ev.venue].join(' ').toLowerCase().indexOf(query) !== -1
    })
  }, [q, cat])

  function updateArrows() {
    const el = catsRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft < max - 2)
  }

  useEffect(() => {
    updateArrows()
    const el = catsRef.current
    const onScroll = () => updateArrows()
    el?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    // re-measure after the icon font loads (glyph widths shift layout)
    const t = window.setTimeout(updateArrows, 350)
    return () => {
      el?.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.clearTimeout(t)
    }
  }, [])

  function scrollCats(dir: number) {
    const el = catsRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  function toggleSave(slug: string) {
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <div className="h-full bg-surface font-sans text-ink antialiased">
      {/* ============ Top bar ============ */}
      <header className="sticky top-0 z-30 border-b border-hair bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 lg:px-6">
          <Link to="/portal/discover" className="flex shrink-0 items-center gap-2.5">
            <span className="brand-logo text-brand h-[17px] w-[31px]" />
            <span className="hidden text-[15px] font-extrabold tracking-tight sm:inline">Eventa</span>
          </Link>
          {/* search (in top nav) */}
          <div className="relative min-w-0 flex-1">
            <i className="hgi-stroke hgi-search-01 pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
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
            <button type="button" onClick={toggle} className="btn-icon bg-surface" title="Toggle theme">
              <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={18} />
            </button>
            <Link to="/portal/login" className="btn btn-primary btn-sm">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-7 lg:px-6">
        {/* hero */}
        <div className="mb-6">
          <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[34px]">
            What's on in <span className="text-brand">Bangkok</span>
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            Find your next conference, concert, workshop or festival — all in one place.
          </p>
        </div>

        {/* category filter (Meetup-style: icon over label, active = underline) */}
        <div className="relative mb-6">
          <div ref={catsRef} className="no-scrollbar flex gap-7 overflow-x-auto scroll-smooth px-0.5 sm:gap-9">
            {cats.map((c) => {
              const on = c === cat
              const col = CAT_COLOR[c] || '#1ba770'
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className="group flex shrink-0 flex-col items-center gap-1.5 pt-0.5 outline-none"
                >
                  <i
                    className={cn('hgi-stroke text-[27px] leading-none transition group-hover:scale-110', catIcon(c))}
                    style={{ color: col }}
                  />
                  <span
                    className={cn(
                      'whitespace-nowrap border-b-2 pb-2.5 text-[12.5px] transition',
                      on
                        ? 'border-ink font-semibold text-ink'
                        : 'border-transparent text-muted group-hover:text-ink',
                    )}
                  >
                    {c}
                  </span>
                </button>
              )
            })}
          </div>
          {/* left control */}
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 left-0 items-center pr-8',
              canLeft ? 'flex' : 'hidden',
            )}
            style={{ background: 'linear-gradient(90deg, rgb(var(--surface)) 55%, transparent)' }}
          >
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => scrollCats(-1)}
              className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-ink text-canvas shadow-md transition hover:opacity-90"
            >
              <Icon name="hgi-arrow-left-01" size={18} />
            </button>
          </div>
          {/* right control */}
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 right-0 items-center justify-end pl-8',
              canRight ? 'flex' : 'hidden',
            )}
            style={{ background: 'linear-gradient(270deg, rgb(var(--surface)) 55%, transparent)' }}
          >
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => scrollCats(1)}
              className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-ink text-canvas shadow-md transition hover:opacity-90"
            >
              <Icon name="hgi-arrow-right-01" size={18} />
            </button>
          </div>
        </div>

        {/* results */}
        <p className="mb-3 text-[12px] font-medium text-muted">
          {list.length} {list.length === 1 ? 'event' : 'events'}
        </p>

        {list.length > 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((ev) => (
              <EventCard
                key={ev.slug}
                ev={ev}
                saved={saved.has(ev.slug)}
                onToggleSave={() => toggleSave(ev.slug)}
              />
            ))}
          </div>
        )}

        {/* empty state */}
        {list.length === 0 && (
          <div className="py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-line text-muted">
              <Icon name="hgi-search-remove" size={26} />
            </span>
            <p className="mt-3 text-[15px] font-semibold">No events found</p>
            <p className="mt-1 text-[13px] text-muted">Try a different search or category.</p>
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-muted/70">
          Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
        </p>
      </main>
    </div>
  )
}
