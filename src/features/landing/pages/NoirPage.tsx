import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Icon } from '@/components/ui'
import type { LandingEvent } from '@/features/landing/types'

/* Port of landing/noir.html — a wide "spotlight split" event page: a cover
   banner, a two-column hero with a sticky register card, then whichever of the
   highlights / about / agenda / speakers / tickets / FAQ sections this event
   actually has. The event is passed in, already mapped from the API. */

const PAGE_STYLE = `
  html, body { overflow-x: hidden; }
  summary { list-style: none; }
  summary::-webkit-details-marker { display: none; }
  :focus-visible { outline: 2px solid #1ba770; outline-offset: 2px; border-radius: 6px; }
  @media (prefers-reduced-motion: no-preference) {
    html { scroll-behavior: smooth; }
    @keyframes eventa-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .reveal { animation: eventa-rise .6s cubic-bezier(.22,.61,.36,1) both; }
    .reveal.d1 { animation-delay: .06s; }
    .reveal.d2 { animation-delay: .12s; }
    .reveal.d3 { animation-delay: .18s; }
    .reveal.d4 { animation-delay: .24s; }
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal { animation: none !important; }
  }
`

export default function NoirPage({ event }: { event: LandingEvent }) {
  const [params] = useSearchParams()
  const [coverError, setCoverError] = useState(false)

  const ev = event
  const highlights = ev.highlights

  const reg = ev.registerUrl || '#'
  const isOnline = ev.online === true || params.get('online') === '1'
  const where = isOnline ? 'Online event' : [ev.venue, ev.city].filter(Boolean).join(', ')
  // No cover, no photograph. The kit filled the hero from picsum; a stock
  // image of somebody else's crowd on a real organizer's page is a claim
  // about their event. The gradient beneath shows through instead.
  const heroCover = ev.image

  useEffect(() => {
    if (ev.title) document.title = `${ev.title} · ${ev.category || 'Event'}`
  }, [ev.title, ev.category])

  const heroFacts = [
    { icon: 'hgi-calendar-03', v: ev.dateText },
    { icon: 'hgi-clock-01', v: ev.timeText },
    { icon: isOnline ? 'hgi-video-01' : 'hgi-location-01', v: where },
  ].filter((f) => f.v)

  const priceVal = ev.priceFrom || ''
  const lowered = priceVal.toLowerCase()
  const flatPrice = !priceVal || lowered === 'free' || lowered === 'rsvp' || priceVal === '—'
  const priceLabel = flatPrice ? 'Price' : 'Starting from'
  const priceDetail = flatPrice ? priceVal : `From ${priceVal}`

  const rcFacts = [
    { icon: 'hgi-calendar-03', k: 'Date', v: ev.dateText },
    { icon: 'hgi-clock-01', k: 'Time', v: ev.timeText },
    { icon: isOnline ? 'hgi-video-01' : 'hgi-location-01', k: isOnline ? 'Format' : 'Venue', v: where },
    { icon: 'hgi-user-multiple', k: 'Seats', v: ev.attendeesText },
  ].filter((f) => f.v)

  const aboutRows = [
    { k: 'Date', v: ev.dateText },
    { k: 'Time', v: ev.timeText },
    isOnline ? { k: 'Format', v: 'Online event' } : { k: 'Venue', v: ev.venue },
    isOnline
      ? { k: 'Access', v: ev.onlineNote || 'Join link sent after you register' }
      : { k: 'Address', v: ev.address },
    { k: 'Category', v: ev.category },
    { k: 'Price', v: priceDetail },
  ].filter((r) => r.v)

  const footWhen = [ev.dateText, where].filter(Boolean).join('  ·  ')
  const year = String(new Date().getFullYear())
  const emailHref = ev.contactEmail ? `mailto:${ev.contactEmail}` : '#'
  const emailText = ev.contactEmail || 'email'
  const instagram = ev.socials.instagram || '#'
  const website = ev.socials.website || '#'

  return (
    <div className="bg-canvas text-ink font-sans antialiased">
      <style>{PAGE_STYLE}</style>

      {/* 1 · Sticky nav */}
      <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur-md border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1080px] items-center justify-between gap-4 px-5 sm:px-6">
          <a href="#top" className="inline-flex min-w-0 items-center gap-2.5" aria-label="Back to top">
            <span className="h-2.5 w-2.5 flex-none rounded-full bg-brand" aria-hidden="true" />
            <span className="truncate text-[15px] font-bold text-ink">{ev.title}</span>
          </a>
          <a
            href={reg}
            className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
          >
            Register<Icon name="hgi-arrow-right-01" size={15} />
          </a>
        </div>
      </header>

      <main id="top">
        {/* 2 · Hero (Spotlight split) */}
        <section className="mx-auto max-w-[1080px] px-5 pb-12 pt-10 sm:px-6 lg:pb-16 lg:pt-16">
          <div className="reveal relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-emerald-600 sm:mb-10">
            {heroCover && !coverError && (
              <img
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                src={heroCover}
                onError={() => setCoverError(true)}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          </div>
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
            {/* Left column */}
            <div>
              <p className="reveal inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
                <span className="h-px w-6 bg-brand" aria-hidden="true" />
                <span>{ev.kicker}</span>
              </p>
              <h1 className="reveal d1 mt-4 text-[32px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[40px] lg:text-[44px]">
                {ev.title}
              </h1>
              <p className="reveal d2 mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted sm:text-[16px]">
                {ev.tagline}
              </p>
              <div
                className="reveal d3 mt-8 flex flex-col gap-x-8 gap-y-3.5 sm:flex-row sm:flex-wrap"
                role="list"
              >
                {heroFacts.map((f) => (
                  <div key={f.icon} className="flex items-center gap-2.5" role="listitem">
                    <Icon name={f.icon} size={18} className="text-brand" />
                    <span className="text-[13.5px] font-medium text-ink">{f.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column · sticky register card */}
            <aside className="reveal d2 lg:sticky lg:top-20">
              <div className="rounded-2xl bg-surface p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="badge badge-green">{ev.category || 'Event'}</span>
                  <span className="text-[12px] font-medium text-muted">{ev.attendeesText}</span>
                </div>
                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {priceLabel}
                  </div>
                  <div className="mt-1 text-[34px] font-extrabold leading-none tracking-tight text-ink tnum">
                    {priceVal || '—'}
                  </div>
                </div>
                <a
                  href={reg}
                  className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-brand-dark"
                >
                  Register now<Icon name="hgi-arrow-right-01" size={16} />
                </a>
                <a
                  href="#"
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-4 py-2.5 text-[13px] font-semibold text-brand transition hover:bg-brand hover:text-white"
                >
                  <Icon name="hgi-calendar-check-in-01" size={16} />Add to calendar
                </a>
                <dl className="mt-5 space-y-3.5 border-t border-line pt-5">
                  {rcFacts.map((f) => (
                    <div key={f.k} className="flex items-start gap-3">
                      <Icon name={f.icon} size={17} className="mt-0.5 flex-none text-brand" />
                      <div className="min-w-0">
                        <dt className="text-[11px] uppercase tracking-wide text-muted">{f.k}</dt>
                        <dd className="text-[13px] font-medium text-ink">{f.v}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>
          </div>
        </section>

        {/* 3 · Highlights */}
        {highlights.length > 0 && (
          <section
            className="mx-auto max-w-[1080px] px-5 py-8 sm:px-6 lg:py-10"
            aria-labelledby="lbl-highlights"
          >
            <h2 id="lbl-highlights" className="sr-only">
              Highlights
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {highlights.map((h, i) => (
                <div key={i} className="rounded-2xl bg-surface p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon name={h.icon || 'hgi-star'} size={20} />
                  </div>
                  <div className="mt-4 text-[14px] font-semibold text-ink">{h.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4 · About + facts panel */}
        {ev.about && (
          <section
            className="mx-auto max-w-[1080px] px-5 py-8 sm:px-6 lg:py-10"
            aria-labelledby="lbl-about"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
              <div>
                <h2 id="lbl-about" className="text-[18px] font-bold text-ink">
                  About this event
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{ev.about}</p>
              </div>
              <div className="rounded-2xl bg-surface p-5 sm:p-6">
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
                  Event details
                </div>
                <dl className="divide-y divide-line">
                  {aboutRows.map((r) => (
                    <div key={r.k} className="flex items-baseline justify-between gap-4 py-3">
                      <dt className="flex-none text-[12px] uppercase tracking-wide text-muted">
                        {r.k}
                      </dt>
                      <dd className="text-right text-[13px] font-medium text-ink">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>
        )}

        {/* 5 · Agenda */}
        {ev.agenda.length > 0 && (
          <section
            className="mx-auto max-w-[1080px] px-5 py-8 sm:px-6 lg:py-10"
            aria-labelledby="agenda-title"
          >
            <h2 id="agenda-title" className="mb-5 text-[18px] font-bold text-ink">
              {ev.agendaTitle}
            </h2>
            <div className="rounded-2xl bg-surface p-5 sm:p-6">
              <ol className="divide-y divide-line">
                {ev.agenda.map((a, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[64px_1fr] gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[92px_1fr]"
                  >
                    <div className="pt-0.5 text-[13px] font-semibold text-brand tnum">{a.time}</div>
                    <div>
                      <div className="text-[14.5px] font-semibold text-ink">{a.title}</div>
                      <div className="mt-0.5 text-[13px] text-muted">{a.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* 6 · Speakers */}
        {ev.speakers.length > 0 && (
          <section
            className="mx-auto max-w-[1080px] px-5 py-8 sm:px-6 lg:py-10"
            aria-labelledby="speakers-title"
          >
            <h2 id="speakers-title" className="mb-5 text-[18px] font-bold text-ink">
              {ev.speakersTitle}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {ev.speakers.map((s, i) => (
                <div key={i} className="rounded-2xl bg-surface p-5">
                  <div className="avatar h-12 w-12 text-[15px]" aria-hidden="true">
                    {s.initials}
                  </div>
                  <div className="mt-4 text-[14.5px] font-semibold text-ink">{s.name}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{s.role}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7 · Tickets */}
        {ev.tickets.length > 0 && (
          <section
            className="mx-auto max-w-[1080px] px-5 py-8 sm:px-6 lg:py-10"
            aria-labelledby="tickets-title"
          >
            <h2 id="tickets-title" className="mb-5 text-[18px] font-bold text-ink">
              {ev.ticketsTitle}
            </h2>
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
              {ev.tickets.map((t, i) => {
                const feat = !!t.featured
                return (
                  <div
                    key={i}
                    className={
                      feat
                        ? 'flex flex-col gap-5 rounded-2xl bg-brand p-6 text-white md:-translate-y-1'
                        : 'flex flex-col gap-5 rounded-2xl bg-surface p-6'
                    }
                  >
                    <div className="flex min-h-[24px] items-center justify-between gap-3">
                      <span
                        className={
                          feat
                            ? 'text-[12px] font-semibold uppercase tracking-wide text-white/90'
                            : 'text-[12px] font-semibold uppercase tracking-wide text-ink'
                        }
                      >
                        {t.name}
                      </span>
                      {t.note &&
                        (feat ? (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
                            {t.note}
                          </span>
                        ) : (
                          <span className="badge badge-green">{t.note}</span>
                        ))}
                    </div>
                    <div
                      className={
                        feat
                          ? 'text-[30px] font-extrabold leading-none tracking-tight text-white tnum'
                          : 'text-[30px] font-extrabold leading-none tracking-tight text-ink tnum'
                      }
                    >
                      {t.price}
                    </div>
                    <ul className="flex flex-col gap-2.5">
                      {t.features.map((f, j) => (
                        <li
                          key={j}
                          className={`flex items-start gap-2.5 text-[13.5px] ${
                            feat ? 'text-white/90' : 'text-ink'
                          }`}
                        >
                          <Icon
                            name="hgi-tick-02"
                            size={16}
                            className={`mt-0.5 flex-none ${feat ? 'text-white' : 'text-brand'}`}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      className={
                        feat
                          ? 'mt-auto inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-brand transition hover:bg-white/90'
                          : 'mt-auto inline-flex w-full items-center justify-center rounded-lg bg-brand-soft px-4 py-2.5 text-[13px] font-semibold text-brand transition hover:bg-brand hover:text-white'
                      }
                      href={reg}
                    >
                      Register
                    </a>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 8 · FAQ */}
        {ev.faqs.length > 0 && (
          <section
            className="mx-auto max-w-[1080px] px-5 py-8 sm:px-6 lg:py-10"
            aria-labelledby="lbl-faq"
          >
            <h2 id="lbl-faq" className="mb-5 text-[18px] font-bold text-ink">
              Frequently asked
            </h2>
            <div className="rounded-2xl bg-surface px-2 py-1 sm:px-3">
              <div className="divide-y divide-line">
                {ev.faqs.map((f, i) => (
                  <details key={i} className="group px-3 sm:px-4" open={i === 0}>
                    <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[14.5px] font-semibold text-ink">
                      <span>{f.q}</span>
                      <Icon
                        name="hgi-arrow-down-01"
                        size={18}
                        className="flex-none text-muted transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <div className="pb-4 pr-8 text-[13.5px] leading-relaxed text-muted">{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* 9 · Footer */}
      <footer className="mx-auto max-w-[1080px] px-5 pb-12 pt-4 sm:px-6">
        <div className="rounded-2xl bg-surface p-8 text-center sm:p-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">Join us</p>
          <h2 className="mx-auto mt-3 max-w-[20ch] text-[24px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            Save your place at <span>{ev.title}</span>
          </h2>
          <p className="mt-3 text-[14px] text-muted">{footWhen}</p>
          <a
            href={reg}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-brand-dark"
          >
            Register now<Icon name="hgi-arrow-right-01" size={16} />
          </a>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-[13px] text-muted">
            Organised by <strong className="font-semibold text-ink">{ev.organizer}</strong>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={emailHref}
              className="inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[13px] font-medium text-ink transition hover:text-brand"
            >
              <Icon name="hgi-mail-01" size={16} />
              <span>{emailText}</span>
            </a>
            <a
              href={instagram}
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-ink transition hover:text-brand"
            >
              <Icon name="hgi-instagram" size={18} />
            </a>
            <a
              href={website}
              aria-label="Website"
              className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-ink transition hover:text-brand"
            >
              <Icon name="hgi-global" size={18} />
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-[12px] text-muted">
          © <span>{year}</span> <span>{ev.organizer}</span> · Built with Eventa.
        </div>
      </footer>
    </div>
  )
}
