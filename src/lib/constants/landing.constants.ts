/** The landing module's named constants. */

/** A seat; its ticket's swatch overrides the neutral fill (the palette is `!important`). */
export const SEAT = 'shrink-0 rounded-[3px] bg-muted/30'

export const UNTITLED = 'Your event'

export const HIGHLIGHT_SEPARATOR = '|'

export const DEFAULT_HIGHLIGHT_ICON = 'hgi-sparkles'

/* Page-scoped CSS from the source <style> block (focus rings, FAQ chevron, the
   reveal keyframe and the transparent→solid sticky bar). */
export const ATLAS_STYLE = `
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

/* Page-scoped CSS from the source <style> block: the 1080px content column,
   brand focus rings, the FAQ chevron, and the gentle staggered load-in. */
export const AURORA_STYLE = `
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

export const MINIMAL_PAGE_PAGE_STYLE = `
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

export const NOIR_PAGE_PAGE_STYLE = `
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

/** Fields the API holds nothing for. Named so the omission is deliberate. */
export const NOT_HELD = {
  /** No headline separate from the name. */
  kicker: '',
  /** The API counts no attendees and publishes no remaining-seat figure. */
  attendeesText: '',
  seatsLeft: 0,
  /** Not on the public payload; the organizer's address is not published. */
  contactEmail: '',
  socials: {},
  /** Read by no template, but part of the shape. */
  accent: '',
  seating: '',
  capacity: 0,
} as const

export const TICKETS_TITLE = 'Tickets'
