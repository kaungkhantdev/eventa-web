import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { VenueMap } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { LandingEvent } from '@/features/landing/types'

/* Atlas — full-bleed poster landing template. Ported from landing/atlas.html.
   The static kit filled every slot imperatively from landing-data.js; the event
   is now passed in, already mapped from the API, and every section renders only
   when it has something in it — a real event has no agenda or speakers far more
   often than the kit's demo one did. The sticky bar starts transparent over the
   hero and turns solid once you scroll ~0.72 viewports down. */

/* Page-scoped CSS from the source <style> block (focus rings, FAQ chevron, the
   reveal keyframe and the transparent→solid sticky bar). */
const ATLAS_STYLE = `
a:focus-visible, button:focus-visible, summary:focus-visible { outline: 2px solid #1ba770; outline-offset: 3px; border-radius: 12px; }
.on-brand:focus-visible { outline-color: #fff; }
.faq[open] .faq-chev { transform: rotate(180deg); }
summary::-webkit-details-marker { display: none; }
summary { list-style: none; }
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
  @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .reveal { animation: rise .55s cubic-bezier(.22,.61,.36,1) both; }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; scroll-behavior: auto !important; } }
#bar { background: transparent; transition: background .3s ease, border-color .3s ease; border-bottom: 1px solid transparent; }
#bar.bar-solid { background: rgb(var(--canvas) / .88); backdrop-filter: blur(12px); border-bottom-color: rgb(var(--line)); }
#bar-title { color: #fff; }
#bar.bar-solid #bar-title { color: rgb(var(--ink)); }
#bar-logo { background: rgba(255,255,255,.16); color: #fff; box-shadow: inset 0 0 0 1px rgba(255,255,255,.28); }
#bar.bar-solid #bar-logo { background: #1ba770; color: #fff; box-shadow: none; }
.bar-reg { background: #fff; color: #1ba770; }
.bar-reg:hover { background: rgba(255,255,255,.9); }
#bar.bar-solid .bar-reg { background: #1ba770; color: #fff; }
#bar.bar-solid .bar-reg:hover { background: #178a60; }
`

export default function AtlasPage({ event }: { event: LandingEvent }) {
  const [params] = useSearchParams()
  const ev = event

  const reg = ev.registerUrl || '#'
  const isOnline = ev.online === true || params.get('online') === '1'
  const whereText = isOnline ? 'Online event' : [ev.venue, ev.city].filter(Boolean).join(', ')
  // No cover, no photograph. The kit filled the hero from picsum; a stock
  // image of somebody else's crowd on a real organizer's page is a claim
  // about their event. The gradient beneath shows through instead.
  const heroCover = ev.image

  // Sticky bar solidifies once the hero is mostly scrolled past.
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setSolid(window.scrollY > window.innerHeight * 0.72)
          ticking = false
        })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reflect the resolved event in the document title, like the source script.
  useEffect(() => {
    if (ev.title) document.title = ev.title + ' — ' + (ev.category || 'Event')
  }, [ev.title, ev.category])

  const heroFacts = [
    { icon: 'hgi-calendar-03', v: ev.dateText },
    { icon: 'hgi-clock-01', v: ev.timeText },
    { icon: isOnline ? 'hgi-video-01' : 'hgi-location-01', v: whereText },
    { icon: 'hgi-user-multiple', v: ev.attendeesText },
  ].filter((f) => f.v)

  const highlights = ev.highlights

  const priceVal = ev.priceFrom || ''
  const lowered = priceVal.toLowerCase()
  const priceDisplay =
    !priceVal || lowered === 'free' || priceVal === '—' ? priceVal : 'From ' + priceVal

  const aboutRows = [
    { icon: 'hgi-calendar-03', label: 'Date', value: ev.dateText },
    { icon: 'hgi-clock-01', label: 'Time', value: ev.timeText },
    isOnline
      ? { icon: 'hgi-video-01', label: 'Format', value: 'Online event' }
      : { icon: 'hgi-location-01', label: 'Venue', value: ev.venue },
    isOnline
      ? {
          icon: 'hgi-link-01',
          label: 'Access',
          value: ev.onlineNote || 'Join link sent after you register',
        }
      : { icon: 'hgi-location-01', label: 'Address', value: ev.address },
    { icon: 'hgi-building-06', label: 'Category', value: ev.category },
    { icon: 'hgi-wallet-01', label: 'Price', value: priceDisplay },
  ].filter((r) => r.value)
  // The address decides the pin; see mapLink.ts on why the venue name does
  // not join the query.
  const venue = { venueName: ev.venue, address: ev.address, city: ev.city }

  const whenLine = [ev.dateText, whereText].filter(Boolean).join('  ·  ')
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <style>{ATLAS_STYLE}</style>

      {/* Sticky bar */}
      <header id="bar" className={cn('fixed inset-x-0 top-0 z-50', solid && 'bar-solid')}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-2.5" aria-label="Back to top">
            <span
              id="bar-logo"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg backdrop-blur"
            >
              <i className="hgi-stroke hgi-fire text-[17px]" />
            </span>
            <span id="bar-title" className="truncate text-[15px] font-bold tracking-tight">
              {ev.title || 'Event'}
            </span>
          </a>
          <a
            href={reg}
            className="bar-reg shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition"
          >
            Get tickets
          </a>
        </div>
      </header>

      {/* 1 · Full-bleed poster hero */}
      <section id="top" className="relative flex min-h-[92vh] items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand to-emerald-600" />
        {heroCover && (
          <img
            src={heroCover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-28 sm:px-6 sm:pb-20">
          {ev.category && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm">
              {ev.category}
            </span>
          )}
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.2em] text-white/85">
            {ev.kicker}
          </p>
          <h1 className="mt-3 max-w-[16ch] text-[44px] font-extrabold leading-[0.95] tracking-tight text-white sm:text-[68px] lg:text-[84px]">
            {ev.title}
          </h1>
          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
            {heroFacts.map((f) => (
              <span
                key={f.icon}
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-white"
              >
                <i className={cn('hgi-stroke', f.icon, 'text-[17px] text-white/80')} />
                {f.v}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={reg}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-bold text-brand shadow-lg transition hover:bg-white/90"
            >
              Get tickets <i className="hgi-stroke hgi-arrow-right-01 text-[16px]" />
            </a>
            {/* Only offered when there is a line-up to jump to — an anchor to a
                section this event does not have goes nowhere. */}
            {ev.speakers.length > 0 && (
              <a
                href="#s-speakers"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3.5 text-[14px] font-semibold text-white ring-1 ring-inset ring-white/30 backdrop-blur transition hover:bg-white/20"
              >
                See the line-up
              </a>
            )}
          </div>
        </div>
        <a
          href="#s-intro"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-white/70 transition hover:text-white sm:block"
          aria-label="Scroll down"
        >
          <i className="hgi-stroke hgi-arrow-down-01 text-[26px]" />
        </a>
      </section>

      {/* 2 · Lead line */}
      <section id="s-intro" className="border-b border-line bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <p className="text-[19px] font-medium leading-relaxed text-ink sm:text-[24px]">
            {ev.tagline}
          </p>
        </div>
      </section>

      {/* 3 · Highlights (green band) */}
      {highlights.length > 0 && (
        <section id="s-highlights" className="scroll-mt-20 bg-brand">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/70">
              On the night
            </p>
            <h2 className="mt-1 text-[26px] font-extrabold tracking-tight text-white sm:text-[32px]">
              What to expect
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {highlights.map((h, i) => (
                <div key={i} className="rounded-2xl bg-surface p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <i className={cn('hgi-stroke', h.icon || 'hgi-star', 'text-[22px]')} />
                  </span>
                  <div className="mt-3 text-[14px] font-semibold text-ink">{h.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4 · About */}
      {ev.about && (
        <section id="s-about" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:gap-12">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand">The show</p>
                <h2 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-[32px]">
                  About the night
                </h2>
                <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-muted">{ev.about}</p>
              </div>
              <div>
                <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Details
                </h3>
                <dl className="rounded-2xl bg-surface px-4">
                  {aboutRows.map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center gap-3 border-t border-line py-3 first:border-t-0"
                    >
                      <i className={cn('hgi-stroke', r.icon, 'text-[16px] text-brand')} />
                      <dt className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
                        {r.label}
                      </dt>
                      <dd className="ml-auto text-right text-[13px] font-semibold text-ink">
                        {r.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {!isOnline && <VenueMap venue={venue} className="mt-3" />}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5 · Set times / Agenda */}
      {ev.agenda.length > 0 && (
        <section id="s-agenda" className="scroll-mt-20 bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand">Running order</p>
            <h2 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-[32px]">
              {ev.agendaTitle}
            </h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {(ev.agenda || []).map((a, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3.5 rounded-2xl bg-canvas p-4 ring-1 ring-line transition hover:ring-brand/40"
                >
                  <span className="grid shrink-0 place-items-center rounded-xl bg-brand px-3 py-2 text-center text-[13px] font-extrabold leading-tight tnum text-white">
                    {a.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold tracking-tight text-ink">{a.title}</div>
                    <div className="mt-0.5 text-[13px] font-medium text-muted">{a.desc}</div>
                  </div>
                  <i className="hgi-stroke hgi-music-note-01 text-[18px] shrink-0 text-brand/30" />
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* 6 · Line-up / Speakers */}
      {ev.speakers.length > 0 && (
        <section id="s-speakers" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand">
              Who&#39;s playing
            </p>
            <h2 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-[32px]">
              {ev.speakersTitle}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(ev.speakers || []).map((s, i) => {
                const lead = i === 0
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-4 rounded-2xl p-5',
                      lead ? 'bg-brand text-white' : 'bg-surface',
                    )}
                  >
                    <div
                      className={cn(
                        'grid h-16 w-16 shrink-0 place-items-center rounded-full text-[17px] font-bold',
                        lead ? 'bg-white/15 text-white ring-2 ring-white/30' : 'bg-brand-soft text-brand',
                      )}
                      aria-hidden="true"
                    >
                      {s.initials}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={cn(
                          'truncate text-[17px] font-bold tracking-tight',
                          lead ? 'text-white' : 'text-ink',
                        )}
                      >
                        {s.name}
                      </div>
                      <div
                        className={cn(
                          'mt-0.5 truncate text-[12px] font-semibold uppercase tracking-wide',
                          lead ? 'text-white/85' : 'text-brand',
                        )}
                      >
                        {s.role}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7 · Tickets */}
      {ev.tickets.length > 0 && (
        <section id="s-tickets" className="scroll-mt-20 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand">
              Get in the door
            </p>
            <h2 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-[32px]">
              {ev.ticketsTitle}
            </h2>
            {ev.seatsLeft ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                <i className="hgi-stroke hgi-fire text-[15px]" /> Going fast — only {ev.seatsLeft} left
              </p>
            ) : null}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
              {(ev.tickets || []).map((t, i) => {
                const feat = !!t.featured
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex flex-col gap-4 rounded-2xl p-6',
                      feat ? 'bg-brand text-white shadow-lg md:-translate-y-2' : 'bg-canvas ring-1 ring-line',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          'text-[12px] font-semibold uppercase tracking-[0.08em]',
                          feat ? 'text-white/80' : 'text-ink',
                        )}
                      >
                        {t.name}
                      </span>
                      {t.note ? (
                        feat ? (
                          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                            {t.note}
                          </span>
                        ) : (
                          <span className="badge badge-green">{t.note}</span>
                        )
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        'text-[30px] font-extrabold tracking-tight tnum',
                        feat ? 'text-white' : 'text-ink',
                      )}
                    >
                      {t.price}
                    </div>
                    <ul className="flex flex-col gap-2.5">
                      {(t.features || []).map((f, j) => (
                        <li
                          key={j}
                          className={cn(
                            'flex items-start gap-2 text-[13px]',
                            feat ? 'text-white/90' : 'text-muted',
                          )}
                        >
                          <i
                            className={cn(
                              'hgi-stroke hgi-tick-02 text-[15px] mt-0.5',
                              feat ? 'text-white' : 'text-brand',
                            )}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {feat ? (
                      <a
                        href={reg}
                        className="on-brand mt-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-brand transition hover:bg-white/90"
                      >
                        Get tickets
                      </a>
                    ) : (
                      <a
                        href={reg}
                        className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-soft px-4 py-2.5 text-[13px] font-semibold text-brand transition hover:brightness-95"
                      >
                        Get tickets
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* 8 · FAQ */}
      {ev.faqs.length > 0 && (
        <section id="s-faq" className="scroll-mt-20">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand">Before you go</p>
            <h2 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-[32px]">
              Know before the show
            </h2>
            <div className="mt-4">
              {(ev.faqs || []).map((f, i) => (
                <details
                  key={i}
                  open={i === 0}
                  className="faq border-t border-line py-1 first:border-t-0"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 py-3 text-[15px] font-semibold text-ink">
                    <span>{f.q}</span>
                    <i className="hgi-stroke hgi-arrow-down-01 text-[17px] faq-chev shrink-0 text-muted transition-transform duration-200" />
                  </summary>
                  <div className="pb-3 pr-8 text-[13px] leading-relaxed text-muted">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9 · Final CTA (green band) */}
      <section className="bg-brand text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/75">
            Don&#39;t miss the show
          </p>
          <h2 className="mx-auto mt-2 max-w-[18ch] text-[30px] font-extrabold leading-tight tracking-tight sm:text-[42px]">
            Grab your ticket to <span>{ev.title}</span>.
          </h2>
          <p className="mt-3 text-[15px] text-white/85">{whenLine}</p>
          <a
            href={reg}
            className="on-brand mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-bold text-brand shadow-lg transition hover:bg-white/90"
          >
            Get tickets <i className="hgi-stroke hgi-arrow-right-01 text-[16px]" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-muted">
              Presented by <strong className="font-semibold text-ink">{ev.organizer}</strong>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={ev.contactEmail ? 'mailto:' + ev.contactEmail : '#'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-[13px] font-medium text-ink transition hover:text-brand"
              >
                <i className="hgi-stroke hgi-mail-01 text-[16px] text-brand" />
                <span>{ev.contactEmail || 'email'}</span>
              </a>
              <a
                href={ev.socials?.instagram || '#'}
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-muted transition hover:text-brand"
              >
                <i className="hgi-stroke hgi-instagram text-[18px]" />
              </a>
              <a
                href={ev.socials?.website || '#'}
                aria-label="Website"
                className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-muted transition hover:text-brand"
              >
                <i className="hgi-stroke hgi-global text-[18px]" />
              </a>
            </div>
          </div>
          <p className="text-[12px] text-muted">
            © <span>{year}</span> <span>{ev.organizer}</span> · Built with Eventa.
          </p>
        </div>
      </footer>
    </div>
  )
}
