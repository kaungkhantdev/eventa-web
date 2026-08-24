import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { VenueMap } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { LandingEvent } from '@/features/landing/types'

/* Aurora — a calm, card-stacked landing template. Ported from landing/aurora.html.
   The event is passed in, already mapped from the API, and each card renders
   only when it has content — an empty heading is worse than no section. */

/* Page-scoped CSS from the source <style> block: the 1080px content column,
   brand focus rings, the FAQ chevron, and the gentle staggered load-in. */
const AURORA_STYLE = `
.wrap { max-width: 1080px; margin-inline: auto; }
a:focus-visible, button:focus-visible, summary:focus-visible {
  outline: 2px solid #1ba770; outline-offset: 3px; border-radius: 10px;
}
.on-brand:focus-visible { outline-color: #fff; }
.faq[open] .faq-chev { transform: rotate(180deg); }
summary::-webkit-details-marker { display: none; }
summary { list-style: none; }
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
  @keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  .reveal { animation: rise .55s cubic-bezier(.22,.61,.36,1) both; }
  .reveal.d1 { animation-delay: .05s; }
  .reveal.d2 { animation-delay: .10s; }
  .reveal.d3 { animation-delay: .16s; }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; scroll-behavior: auto !important; } }
`

export default function AuroraPage({ event }: { event: LandingEvent }) {
  const [params] = useSearchParams()
  const ev = event

  const reg = ev.registerUrl || '#'
  const isOnline = ev.online === true || params.get('online') === '1'
  const whereText = isOnline ? 'Online event' : [ev.venue, ev.city].filter(Boolean).join(', ')
  // No cover, no photograph. The kit filled the hero from picsum; a stock
  // image of somebody else's crowd on a real organizer's page is a claim
  // about their event. The gradient beneath shows through instead.
  const heroCover = ev.image

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

  const agenda = ev.agenda || []
  // The address decides the pin; see mapLink.ts on why the venue name does
  // not join the query.
  const venue = { venueName: ev.venue, address: ev.address, city: ev.city }
  const whenLine = [ev.dateText, whereText].filter(Boolean).join('  ·  ')
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <style>{AURORA_STYLE}</style>

      {/* 1 · Sticky top nav */}
      <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70">
        <div className="wrap flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-2.5" aria-label="Back to top">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white">
              <i className="hgi-stroke hgi-fire text-[17px]" />
            </span>
            <span className="truncate text-[15px] font-bold tracking-tight text-ink">
              {ev.title || 'Event'}
            </span>
          </a>
          <a
            href={reg}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
          >
            Register <i className="hgi-stroke hgi-arrow-right-01 text-[15px]" />
          </a>
        </div>
      </header>

      <main id="top" className="wrap space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        {/* 2 · Hero */}
        <section className="reveal overflow-hidden rounded-2xl bg-surface" aria-labelledby="hero-title">
          <div className="relative min-h-[240px] bg-gradient-to-br from-brand to-emerald-500 sm:min-h-[300px]">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />
            <div className="relative flex min-h-[240px] flex-col justify-end px-6 py-7 sm:min-h-[300px] sm:px-9 sm:py-9">
              {ev.category && (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
                  {ev.category}
                </span>
              )}
              <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/85">
                {ev.kicker}
              </p>
              <h1
                id="hero-title"
                className="mt-2 max-w-[22ch] text-[30px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[42px]"
              >
                {ev.title}
              </h1>
            </div>
          </div>
          <div className="px-6 py-6 sm:px-9 sm:py-7">
            <p className="max-w-[62ch] text-[15px] leading-relaxed text-muted">{ev.tagline}</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5">
              {heroFacts.map((f) => (
                <span
                  key={f.icon}
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-ink"
                >
                  <i className={cn('hgi-stroke', f.icon, 'text-[16px] text-brand')} />
                  {f.v}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={reg}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
              >
                Register now <i className="hgi-stroke hgi-arrow-right-01 text-[15px]" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-4 py-2.5 text-[13px] font-semibold text-brand transition hover:brightness-95"
              >
                <i className="hgi-stroke hgi-calendar-03 text-[15px]" /> Add to calendar
              </a>
            </div>
          </div>
        </section>

        {/* 3 · Highlights */}
        {highlights.length > 0 && (
          <section className="reveal d1" aria-labelledby="lbl-highlights">
            <h2 id="lbl-highlights" className="mb-3 text-[18px] font-bold tracking-tight text-ink">
              Highlights
            </h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {highlights.map((h, i) => (
                <div key={i} className="rounded-2xl bg-surface p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                    <i className={cn('hgi-stroke', h.icon || 'hgi-star', 'text-[20px]')} />
                  </span>
                  <div className="mt-3 text-[14px] font-semibold text-ink">{h.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4 · About */}
        {ev.about && (
          <section className="reveal rounded-2xl bg-surface p-6 sm:p-8" aria-labelledby="lbl-about">
            <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:gap-10">
              <div>
                <h2 id="lbl-about" className="text-[18px] font-bold tracking-tight text-ink">
                  About the event
                </h2>
                <p className="mt-3 max-w-[58ch] text-[14px] leading-relaxed text-muted">{ev.about}</p>
              </div>
              <div>
                <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Details
                </h3>
                <dl className="rounded-xl bg-canvas px-4">
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
          </section>
        )}

        {/* 5 · Agenda */}
        {agenda.length > 0 && (
          <section className="reveal rounded-2xl bg-surface p-6 sm:p-8" aria-labelledby="agenda-title">
            <h2 id="agenda-title" className="text-[18px] font-bold tracking-tight text-ink">
              {ev.agendaTitle}
            </h2>
            <ol className="mt-5">
              {agenda.map((a, i) => {
                const last = i === agenda.length - 1
                return (
                  <li key={i} className="flex gap-4">
                    <div className="w-16 shrink-0 pt-0.5 text-right text-[13px] font-semibold tnum text-brand">
                      {a.time}
                    </div>
                    <div className={cn('relative flex-1 border-l border-line pl-5', last ? 'pb-0' : 'pb-6')}>
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-brand-soft" />
                      <div className="text-[15px] font-semibold text-ink">{a.title}</div>
                      <div className="mt-0.5 text-[13px] text-muted">{a.desc}</div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {/* 6 · Speakers */}
        {ev.speakers.length > 0 && (
          <section className="reveal rounded-2xl bg-surface p-6 sm:p-8" aria-labelledby="speakers-title">
            <h2 id="speakers-title" className="text-[18px] font-bold tracking-tight text-ink">
              {ev.speakersTitle}
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(ev.speakers || []).map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-canvas p-4">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-[14px] font-semibold text-brand"
                    aria-hidden="true"
                  >
                    {s.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-ink">{s.name}</div>
                    <div className="truncate text-[12px] text-muted">{s.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7 · Tickets */}
        {ev.tickets.length > 0 && (
          <section className="reveal" aria-labelledby="tickets-title">
            <h2 id="tickets-title" className="mb-4 text-[18px] font-bold tracking-tight text-ink">
              {ev.ticketsTitle}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
              {(ev.tickets || []).map((t, i) => {
                const feat = !!t.featured
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex flex-col gap-4 rounded-2xl p-6',
                      feat ? 'bg-brand text-white md:-translate-y-2' : 'bg-surface',
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
                        'text-[28px] font-extrabold tracking-tight tnum',
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
                        className="on-brand mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-brand transition hover:bg-white/90"
                      >
                        Register
                      </a>
                    ) : (
                      <a
                        href={reg}
                        className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-4 py-2.5 text-[13px] font-semibold text-brand transition hover:brightness-95"
                      >
                        Register
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 8 · FAQ */}
        {ev.faqs.length > 0 && (
          <section className="reveal rounded-2xl bg-surface p-6 sm:p-8" aria-labelledby="lbl-faq">
            <h2 id="lbl-faq" className="text-[18px] font-bold tracking-tight text-ink">
              Frequently asked
            </h2>
            <div className="mt-3">
              {(ev.faqs || []).map((f, i) => (
                <details
                  key={i}
                  open={i === 0}
                  className="faq border-t border-line py-1 first:border-t-0"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 py-3 text-[14px] font-semibold text-ink">
                    <span>{f.q}</span>
                    <i className="hgi-stroke hgi-arrow-down-01 text-[17px] faq-chev shrink-0 text-muted transition-transform duration-200" />
                  </summary>
                  <div className="pb-3 pr-8 text-[13px] leading-relaxed text-muted">{f.a}</div>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 9 · Footer */}
      <footer className="wrap space-y-6 px-4 pb-10 sm:px-6">
        {/* final CTA band */}
        <div className="overflow-hidden rounded-2xl bg-brand px-6 py-8 text-white sm:px-10 sm:py-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/75">Join us</p>
          <h2 className="mt-2 max-w-[20ch] text-[24px] font-extrabold leading-tight tracking-tight sm:text-[30px]">
            Save your place at <span>{ev.title}</span>.
          </h2>
          <p className="mt-2 text-[14px] text-white/85">{whenLine}</p>
          <a
            href={reg}
            className="on-brand mt-6 inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-[13px] font-semibold text-brand transition hover:bg-white/90"
          >
            Register now <i className="hgi-stroke hgi-arrow-right-01 text-[15px]" />
          </a>
        </div>

        {/* meta */}
        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-muted">
            Organised by <strong className="font-semibold text-ink">{ev.organizer}</strong>
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
      </footer>
    </div>
  )
}
