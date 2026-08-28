import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Icon,
  VenueMap,
  RichText,
} from '@/components/ui'
import type { LandingEvent } from '@/features/landing/types'

/* Port of landing/minimal.html — a centered, editorial single-column event page.
   Renders the event it is given, already mapped from the API, with the same
   copy and Tailwind class strings as the static template. Sections it has no
   content for are left out rather than headed. */

const PAGE_STYLE = `
  html { scroll-behavior: smooth; }
  body { overflow-x: hidden; }
  a:focus-visible, button:focus-visible, summary:focus-visible {
    outline: 2px solid #1ba770;
    outline-offset: 3px;
    border-radius: 6px;
  }
  details.faq > summary { list-style: none; cursor: pointer; }
  details.faq > summary::-webkit-details-marker { display: none; }
  details.faq[open] .faq-chev { transform: rotate(180deg); }
  .faq-chev { transition: transform .22s ease; }
  section[id] { scroll-margin-top: 72px; }
  @media (prefers-reduced-motion: no-preference) {
    .reveal { animation: rise .7s cubic-bezier(.22,.61,.36,1) both; }
    .reveal.d1 { animation-delay: .06s; }
    .reveal.d2 { animation-delay: .13s; }
    .reveal.d3 { animation-delay: .20s; }
    .reveal.d4 { animation-delay: .27s; }
    @keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
  }
`

export default function MinimalPage({ event }: { event: LandingEvent }) {
  const [params] = useSearchParams()
  const [coverError, setCoverError] = useState(false)

  const ev = event
  const highlights = ev.highlights

  const reg = ev.registerUrl || '#'
  const title = ev.title || 'Event'
  const isOnline = ev.online === true || params.get('online') === '1'
  const venueCity = isOnline ? 'Online event' : [ev.venue, ev.city].filter(Boolean).join(', ')
  // No cover, no photograph. The kit filled the hero from picsum; a stock
  // image of somebody else's crowd on a real organizer's page is a claim
  // about their event. The gradient beneath shows through instead.
  const heroCover = ev.image

  useEffect(() => {
    document.title = `${title} — Register`
  }, [title])

  const heroFacts = [
    { icon: 'hgi-calendar-03', v: ev.dateText },
    { icon: 'hgi-clock-01', v: ev.timeText },
    { icon: isOnline ? 'hgi-video-01' : 'hgi-location-01', v: venueCity },
  ].filter((f) => f.v)

  const priceVal = ev.priceFrom || ''
  const lowered = priceVal.toLowerCase()
  const priceDisplay =
    !priceVal || lowered === 'free' || priceVal === '—' ? priceVal : `From ${priceVal}`

  const aboutRows = [
    { icon: 'hgi-calendar-03', k: 'Date', v: ev.dateText },
    { icon: 'hgi-clock-01', k: 'Time', v: ev.timeText },
    isOnline
      ? { icon: 'hgi-video-01', k: 'Format', v: 'Online event' }
      : { icon: 'hgi-location-01', k: 'Venue', v: ev.venue },
    isOnline
      ? { icon: 'hgi-link-01', k: 'Access', v: ev.onlineNote || 'Join link sent after you register' }
      : { icon: 'hgi-location-01', k: 'Address', v: ev.address },
    { icon: 'hgi-ticket-01', k: 'Category', v: ev.category },
    { icon: 'hgi-wallet-01', k: 'Price', v: priceDisplay },
  ].filter((r) => r.v)

  // The address decides the pin; see mapLink.ts on why the venue name does
  // not join the query.
  const venue = { venueName: ev.venue, address: ev.address, city: ev.city }

  const when = [ev.dateText, venueCity].filter(Boolean).join('  ·  ')
  const year = ev.dateText.match(/\b(20\d{2})\b/)?.[1] || String(new Date().getFullYear())
  const emailHref = ev.contactEmail ? `mailto:${ev.contactEmail}` : '#'
  const emailText = ev.contactEmail || 'email'
  const instagram = ev.socials.instagram || '#'
  const website = ev.socials.website || '#'

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <style>{PAGE_STYLE}</style>

      {/* ============ 1 · STICKY NAV ============ */}
      <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur">
        <nav
          className="mx-auto flex h-14 max-w-[720px] items-center justify-between gap-4 px-6"
          aria-label="Primary"
        >
          <a
            href="#top"
            className="flex min-w-0 items-center gap-2.5 text-[15px] font-bold tracking-tight text-ink"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
            <span className="truncate">{title}</span>
          </a>
          <a
            href={reg}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
          >
            Register <Icon name="hgi-arrow-right-01" size={15} />
          </a>
        </nav>
      </header>

      <main id="top">
        {/* ============ 2 · HERO ============ */}
        <section className="mx-auto max-w-[720px] px-6 pt-16 pb-14 text-center sm:pt-24">
          <p className="reveal text-[12px] font-semibold uppercase tracking-[0.18em] text-brand">
            {ev.kicker}
          </p>
          <h1 className="reveal d1 mx-auto mt-5 max-w-[16ch] text-[2rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[2.6rem]">
            {title}
          </h1>
          {ev.tagline && (
            <p className="reveal d2 mx-auto mt-5 max-w-[52ch] text-[15px] leading-relaxed text-muted">
              {ev.tagline}
            </p>
          )}

          <ul className="reveal d3 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[13px] text-muted">
            {heroFacts.map((f) => (
              <li key={f.icon} className="inline-flex items-center gap-2 tnum">
                <span className="text-brand">
                  <Icon name={f.icon} size={15} />
                </span>
                <span>{f.v}</span>
              </li>
            ))}
          </ul>

          <div className="reveal d4 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={reg}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-dark sm:w-auto"
            >
              Register now <Icon name="hgi-arrow-right-01" size={15} />
            </a>
            <a
              href="#"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-5 py-2.5 text-[13px] font-semibold text-brand transition hover:brightness-95 sm:w-auto"
            >
              <Icon name="hgi-calendar-check-in-01" size={15} /> Add to calendar
            </a>
          </div>

          <div className="reveal d4 relative mt-12 aspect-[16/8] overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-emerald-500">
            {heroCover && !coverError && (
              <img
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                src={heroCover}
                onError={() => setCoverError(true)}
              />
            )}
          </div>
        </section>

        {/* ============ 3 · HIGHLIGHTS ============ */}
        {highlights.length > 0 && (
          <section className="mx-auto max-w-[720px] border-t border-line px-6 py-14">
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              {highlights.map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-3 text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon name={h.icon || 'hgi-star'} size={21} />
                  </span>
                  <span className="text-[13px] font-semibold leading-snug text-ink">{h.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ 4 · ABOUT ============ */}
        {ev.about && (
          <section id="about" className="mx-auto max-w-[720px] border-t border-line px-6 py-14">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">About</h2>
            <RichText html={ev.about} className="mt-4 text-[15px] leading-[1.75]" />
            <dl className="mt-8 divide-y divide-line rounded-2xl bg-surface px-5">
              {aboutRows.map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-4 py-3.5">
                  <dt className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-muted">
                    <span className="text-brand">
                      <Icon name={r.icon} size={15} />
                    </span>
                    {r.k}
                  </dt>
                  <dd className="text-right text-[13.5px] font-medium text-ink">{r.v}</dd>
                </div>
              ))}
            </dl>
            {!isOnline && <VenueMap venue={venue} className="mt-3" />}
          </section>
        )}

        {/* ============ 5 · AGENDA ============ */}
        {ev.agenda.length > 0 && (
          <section id="agenda" className="mx-auto max-w-[720px] border-t border-line px-6 py-14">
            <h2 className="text-[18px] font-bold tracking-tight text-ink">{ev.agendaTitle}</h2>
            <ol className="mt-7">
              {ev.agenda.map((a, i) => {
                const last = i === ev.agenda.length - 1
                return (
                  <li key={i} className="grid grid-cols-[62px_1fr] gap-4">
                    <div className="pt-0.5 text-right text-[13px] font-semibold tnum text-brand">
                      {a.time}
                    </div>
                    <div className={`relative border-l border-line pl-5 ${last ? 'pb-1' : 'pb-7'}`}>
                      <span className="absolute -left-[4px] top-1.5 h-2 w-2 rounded-full bg-brand ring-4 ring-canvas" />
                      <h3 className="text-[14.5px] font-semibold leading-snug text-ink">{a.title}</h3>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{a.desc}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {/* ============ 6 · SPEAKERS ============ */}
        {ev.speakers.length > 0 && (
          <section id="speakers" className="mx-auto max-w-[720px] border-t border-line px-6 py-14">
            <h2 className="text-[18px] font-bold tracking-tight text-ink">{ev.speakersTitle}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ev.speakers.map((s, i) => (
                <div key={i} className="rounded-2xl bg-surface p-4 text-center">
                  <span
                    className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-[15px] font-bold text-brand"
                    aria-hidden="true"
                  >
                    {s.initials}
                  </span>
                  <div className="mt-3 text-[13.5px] font-semibold leading-snug text-ink">{s.name}</div>
                  <div className="mt-0.5 text-[12px] text-muted">{s.role}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ 7 · TICKETS ============ */}
        {ev.tickets.length > 0 && (
          <section id="tickets" className="mx-auto max-w-[720px] border-t border-line px-6 py-14">
            <h2 className="text-[18px] font-bold tracking-tight text-ink">{ev.ticketsTitle}</h2>
            <div className="mt-6 grid items-start gap-3 sm:grid-cols-3">
              {ev.tickets.map((t, i) => {
                const feat = !!t.featured
                return (
                  <div
                    key={i}
                    className={`flex h-full flex-col rounded-2xl p-5 ${feat ? 'bg-brand-soft' : 'bg-surface'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-ink">
                        {t.name}
                      </h3>
                      {t.note && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${
                            feat ? 'bg-brand text-white' : 'bg-brand-soft text-brand'
                          }`}
                        >
                          {t.note}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-[24px] font-extrabold tracking-tight tnum text-ink">
                      {t.price}
                    </div>
                    <ul className="mt-4 flex-1 space-y-2.5">
                      {t.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-[13px] text-muted">
                          <span className="mt-0.5 text-brand">
                            <Icon name="check" size={15} />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={reg}
                      className={
                        feat
                          ? 'mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-dark'
                          : 'mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-4 py-2.5 text-[13px] font-semibold text-brand transition hover:brightness-95'
                      }
                    >
                      Register <Icon name="arrow-right" size={15} />
                    </a>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ============ 8 · FAQ ============ */}
        {ev.faqs.length > 0 && (
          <section id="faq" className="mx-auto max-w-[720px] border-t border-line px-6 py-14">
            <h2 className="text-[18px] font-bold tracking-tight text-ink">Frequently asked</h2>
            <div className="mt-5 border-t border-line">
              {ev.faqs.map((f, i) => (
                <details key={i} className="faq border-b border-line" open={i === 0}>
                  <summary className="flex items-center justify-between gap-4 py-4 text-[14.5px] font-semibold text-ink">
                    <span>{f.q}</span>
                    <span className="faq-chev shrink-0 text-brand">
                      <Icon name="chevron-down" size={18} />
                    </span>
                  </summary>
                  <p className="pb-4 pr-8 text-[14px] leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ============ 9 · FOOTER ============ */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-[720px] px-6 py-16 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">Join us</p>
          <h2 className="mx-auto mt-3 max-w-[18ch] text-[24px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[30px]">
            Save your place
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-[14px] leading-relaxed text-muted">{when}</p>
          <a
            href={reg}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
          >
            Register now <Icon name="hgi-arrow-right-01" size={15} />
          </a>
        </div>

        <div className="mx-auto flex max-w-[720px] flex-col items-center justify-between gap-4 border-t border-line px-6 py-6 text-[13px] text-muted sm:flex-row">
          <p>
            Organised by <span className="font-semibold text-ink">{ev.organizer}</span>
            <span className="mx-1.5 text-line">·</span>
            <a
              href={emailHref}
              className="text-brand transition hover:text-brand-dark hover:underline"
            >
              {emailText}
            </a>
          </p>
          <div className="flex items-center gap-2">
            <a
              href={instagram}
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted transition hover:text-brand"
            >
              <Icon name="hgi-instagram" size={17} />
            </a>
            <a
              href={website}
              aria-label="Website"
              className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted transition hover:text-brand"
            >
              <Icon name="hgi-global" size={17} />
            </a>
          </div>
        </div>

        <p className="mx-auto max-w-[720px] px-6 pb-10 text-[12px] text-muted">
          © <span>{year}</span> <span>{ev.organizer}</span> · Built with Eventa.
        </p>
      </footer>
    </div>
  )
}
