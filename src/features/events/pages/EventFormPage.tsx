import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { cn } from '@/lib/cn'
import {
  HL_ICONS,
  INITIAL_HIGHLIGHTS,
  INITIAL_TICKETS,
  LETTERS,
  STEPS,
  type FormTicket,
  type Highlight,
} from '../data/eventForm'

/* ---------- Create-event wizard — admin/event-form.html ----------
   A five-step flow (Basics · Date & location · Seating · Tickets · Review)
   with a clickable step rail, live progress, a reserved-seating seat-map
   preview, ticket/highlight repeaters, toggles and a live summary panel. */

type LocMode = 'inperson' | 'online'
type Seating = 'ga' | 'reserved'
type LandingTpl = 'aurora' | 'noir' | 'minimal'

const DESC_INITIAL =
  'Join 1,500+ founders, engineers and investors for two days of talks, workshops and networking at BITEC.'
const DESC_MAX = 250

/* Scoped CSS ported verbatim from the source page's inline <style> blocks. */
const SCOPED_CSS = `
.efhouse{background:radial-gradient(120% 90% at 50% -10%, #17201c 0%, #0c110f 60%)}
.efseat{height:16px;width:16px;flex:none;border-radius:5px 5px 2px 2px;background:rgba(255,255,255,.16)}
.efseat-sel{background:#1ba770;box-shadow:0 0 0 2px rgba(27,167,112,.3)}
.efseat-booked{background:rgba(255,255,255,.05)}
.efrowlab{color:rgba(255,255,255,.5);font-size:10px;font-weight:600;width:14px;text-align:center;flex:none}
#desc-editor-wrap{ border:1px solid rgb(var(--hair)); border-radius:10px; background:rgb(var(--surface)); transition:box-shadow .15s ease; }
#desc-editor-wrap:focus-within{ box-shadow:0 0 0 4px rgb(27 167 112 / .15); }
#desc-editor{ min-height:118px; padding:12px; line-height:1.6; color:rgb(var(--ink)); font-size:13px; outline:none; }
#desc-editor:empty:before{ content:attr(data-placeholder); color:rgb(var(--muted)); }
`

/* ---------- Reserved-seating live preview ---------- */
function SeatPreview({ rows, cols }: { rows: number; cols: number }) {
  const r = Math.max(1, Math.min(26, rows || 0))
  const c = Math.max(1, Math.min(40, cols || 0))
  const selRow = Math.floor((r - 1) / 2)
  const isSel = (rr: number, cc: number) => rr === selRow && cc >= 3 && cc <= Math.min(5, c)
  const isBooked = (rr: number, cc: number) =>
    (rr === 0 && (cc === 2 || cc === c - 1)) ||
    (rr === r - 1 && cc === 4) ||
    (rr === selRow - 1 && cc === c - 2)

  const rowEls = []
  for (let rr = 0; rr < r; rr++) {
    const seats = []
    for (let cc = 1; cc <= c; cc++) {
      const cls = isBooked(rr, cc) ? 'efseat efseat-booked' : isSel(rr, cc) ? 'efseat efseat-sel' : 'efseat'
      seats.push(<span key={`s${cc}`} className={cls} />)
      if (c > 8 && cc === Math.ceil(c / 2))
        seats.push(<span key={`g${cc}`} className="inline-block w-2 shrink-0" />)
    }
    rowEls.push(
      <div key={rr} className="flex items-center gap-1">
        <span className="efrowlab">{LETTERS[rr]}</span>
        {seats}
        <span className="efrowlab">{LETTERS[rr]}</span>
      </div>,
    )
  }
  return <div className="flex flex-col items-center gap-1.5 overflow-x-auto">{rowEls}</div>
}

/* ---------- Description editor (Quill unavailable — styled contentEditable + counter) ---------- */
function DescriptionEditor() {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(DESC_INITIAL.length)

  useEffect(() => {
    if (ref.current) ref.current.textContent = DESC_INITIAL
  }, [])

  const onInput = () => {
    const el = ref.current
    if (!el) return
    let text = el.textContent ?? ''
    if (text.length > DESC_MAX) {
      text = text.slice(0, DESC_MAX)
      el.textContent = text
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    setCount(text.length)
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="label mb-0">Description</label>
        <span
          className={cn(
            'text-[11px] font-medium tnum',
            count >= DESC_MAX ? 'text-red-500' : 'text-muted',
          )}
        >
          {count}/{DESC_MAX}
        </span>
      </div>
      <div id="desc-editor-wrap">
        <div
          id="desc-editor"
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          data-placeholder="Tell attendees what this event is about…"
        />
      </div>
    </div>
  )
}

export default function EventFormPage() {
  const ctx = useOutletContext<AdminOutletContext | null>()
  const navigate = useNavigate()

  const [cur, setCur] = useState(0)
  const [loc, setLoc] = useState<LocMode>('inperson')
  const [seating, setSeating] = useState<Seating>('ga')
  const [rows, setRows] = useState('7')
  const [cols, setCols] = useState('16')
  const [title, setTitle] = useState('Tech Summit 2026')
  const [venue, setVenue] = useState('BITEC')
  const [capacity, setCapacity] = useState('1500')
  const [tickets, setTickets] = useState<FormTicket[]>(() => INITIAL_TICKETS.map((t) => ({ ...t })))
  const [highlights, setHighlights] = useState<Highlight[]>(() =>
    INITIAL_HIGHLIGHTS.map((h) => ({ ...h })),
  )
  const [requireApproval, setRequireApproval] = useState(false)
  const [waitlist, setWaitlist] = useState(true)
  const [landingTpl, setLandingTpl] = useState<LandingTpl>('aurora')

  const online = loc === 'online'
  const pct = Math.round(((cur + 1) / STEPS.length) * 100)
  const last = cur === STEPS.length - 1
  const rowsNum = Number(rows) || 0
  const colsNum = Number(cols) || 0
  const seatTotal = rowsNum * colsNum

  const goTo = (i: number) => {
    setCur(Math.max(0, Math.min(STEPS.length - 1, i)))
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const summarySeating = online
    ? 'Online'
    : seating === 'reserved'
      ? `Reserved · ${rowsNum}×${colsNum}`
      : 'General admission'

  const addTicket = () => setTickets((prev) => [...prev, { name: '', price: '', quantity: '' }])
  const removeTicket = (i: number) =>
    setTickets((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev))
  const setTicketField = (i: number, field: keyof FormTicket, value: string) =>
    setTickets((prev) => prev.map((t, j) => (j === i ? { ...t, [field]: value } : t)))

  const addHighlight = () =>
    setHighlights((prev) => [...prev, { icon: 'hgi-sparkles', label: '' }])
  const removeHighlight = (i: number) => setHighlights((prev) => prev.filter((_, j) => j !== i))
  const setHighlightField = (i: number, field: keyof Highlight, value: string) =>
    setHighlights((prev) => prev.map((h, j) => (j === i ? { ...h, [field]: value } : h)))

  const previewLanding = () => {
    const p = new URLSearchParams()
    const t = title.trim()
    const v = venue.trim()
    if (t) p.set('title', t)
    if (v) p.set('venue', v)
    if (online) p.set('online', '1')
    const hls = highlights
      .map((h) => (h.label.trim() ? `${h.icon}:${h.label.trim()}` : null))
      .filter((x): x is string => Boolean(x))
    if (hls.length) p.set('hl', hls.join('|'))
    const qs = p.toString()
    window.open(`/landing/${landingTpl}${qs ? '?' + qs : ''}`, '_blank', 'noopener')
  }

  return (
    <>
      <style>{SCOPED_CSS}</style>

      {/* top bar */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => ctx?.openDrawer()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
          title="Open menu"
        >
          <i className="hgi-stroke hgi-menu-01 text-[18px]" />
        </button>
        <Link to="/admin/events" className="btn-icon shrink-0" title="Back to events">
          <i className="hgi-stroke hgi-arrow-left-01 text-[18px]" />
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <Link to="/admin/events" className="btn btn-soft">
            <i className="hgi-stroke hgi-note-03 text-[16px]" />
            <span className="hidden sm:inline">Save as draft</span>
            <span className="sm:hidden">Draft</span>
          </Link>
          <button
            type="button"
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-muted transition hover:text-ink"
            title="Notifications"
          >
            <i className="hgi-stroke hgi-notification-03 text-[18px]" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface" />
          </button>
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-emerald-400 text-[12px] font-semibold text-white">
              HN
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-[13px] font-semibold text-ink">Harper Nelson</p>
              <p className="text-[11px] text-muted">Event Manager</p>
            </div>
          </div>
        </div>
      </div>

      {/* wizard layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_270px]">
        {/* ============ STEP SIDEBAR ============ */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <nav className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
            <Link to="/admin/events" className="transition hover:text-ink">
              Events
            </Link>
            <i className="hgi-stroke hgi-arrow-right-01 text-[13px]" />
            <span className="text-ink">Create event</span>
          </nav>
          <h1 className="mt-2 text-[22px] font-bold tracking-tight">Create event</h1>
          <p className="mt-3 text-[13px] font-semibold text-ink tnum">{pct}% completed</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="card mt-4 space-y-1 p-2.5">
            {STEPS.map((s, i) => {
              const done = i < cur
              const active = i === cur
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                    active ? 'bg-brand-soft' : 'hover:bg-line',
                  )}
                >
                  {done ? (
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white">
                      <i className="hgi-stroke hgi-tick-02 text-[13px]" />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                        active ? 'border-2 border-brand text-brand' : 'border border-hair text-muted',
                      )}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-[13px] font-semibold',
                      active || done ? 'text-ink' : 'text-muted',
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ============ STEP CONTENT ============ */}
        <div className="min-w-0">
          {/* ===== STEP 0 · DETAILS ===== */}
          <section className={cn('space-y-3', cur !== 0 && 'hidden')}>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight">Basics</h2>
              <p className="mt-1 text-[13px] text-muted">Tell attendees what your event is about.</p>
            </div>

            {/* Basic info */}
            <section className="card p-4">
              <h3 className="text-[14px] font-bold tracking-tight">Basic info</h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="label">Event title</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Tech Summit 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <DescriptionEditor />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Category</label>
                    <select className="select" defaultValue="Conference">
                      <option>Conference</option>
                      <option>Workshop</option>
                      <option>Concert &amp; Festival</option>
                      <option>Meetup</option>
                      <option>Sports &amp; Wellness</option>
                      <option>Networking</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Tags</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="tech, ai, networking"
                      defaultValue="tech, ai, startup"
                    />
                    <p className="hint">Comma-separated, used for search &amp; recommendations.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Cover image */}
            <section className="card p-4">
              <h3 className="text-[14px] font-bold tracking-tight">Cover image</h3>
              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-hair p-8 text-center transition-colors hover:border-brand">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
                  <i className="hgi-stroke hgi-image-upload-01 text-[20px]" />
                </span>
                <p className="text-[13px] font-semibold text-ink">
                  Drag &amp; drop or <span className="text-brand">browse</span>
                </p>
                <p className="text-[11px] text-muted">Recommended 1600×900px · PNG or JPG · up to 5MB</p>
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </section>

            {/* Highlights */}
            <section className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold tracking-tight">Highlights</h3>
                <span className="text-[11px] text-muted">Shown on the landing page</span>
              </div>
              <p className="mt-1 text-[12px] text-muted">
                Short selling points for your event — pick an icon and write a label for each.
              </p>
              <div className="mt-3 space-y-2">
                {highlights.map((h, i) => (
                  <div key={i} className="grid grid-cols-[124px_minmax(0,1fr)_auto] items-center gap-2">
                    <div className="relative">
                      <i
                        className={cn(
                          'hgi-stroke text-[16px] pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-brand',
                          h.icon,
                        )}
                      />
                      <select
                        className="select h-10 w-full pl-8 text-[12.5px]"
                        value={h.icon}
                        onChange={(e) => setHighlightField(i, 'icon', e.target.value)}
                      >
                        {HL_ICONS.map((ic) => (
                          <option key={ic.slug} value={ic.slug}>
                            {ic.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      className="input"
                      type="text"
                      value={h.label}
                      placeholder="e.g. 20+ speakers"
                      onChange={(e) => setHighlightField(i, 'label', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      title="Remove highlight"
                      onClick={() => removeHighlight(i)}
                    >
                      <i className="hgi-stroke hgi-delete-02 text-[16px]" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-soft btn-sm mt-3" onClick={addHighlight}>
                <i className="hgi-stroke hgi-add-01 text-[14px]" />
                Add highlight
              </button>
            </section>
          </section>

          {/* ===== STEP 1 · DATE & LOCATION ===== */}
          <section className={cn('space-y-3', cur !== 1 && 'hidden')}>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight">Date &amp; location</h2>
              <p className="mt-1 text-[13px] text-muted">When and where your event happens.</p>
            </div>

            {/* Date & time */}
            <section className="card p-4">
              <h3 className="text-[14px] font-bold tracking-tight">Date &amp; time</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Start date</label>
                  <input className="input" type="date" defaultValue="2026-08-18" />
                </div>
                <div>
                  <label className="label">Start time</label>
                  <input className="input" type="time" defaultValue="09:00" />
                </div>
                <div>
                  <label className="label">End date</label>
                  <input className="input" type="date" defaultValue="2026-08-19" />
                </div>
                <div>
                  <label className="label">End time</label>
                  <input className="input" type="time" defaultValue="18:00" />
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Timezone</label>
                <select className="select" defaultValue="GMT+7 Bangkok">
                  <option>GMT+7 Bangkok</option>
                  <option>GMT+8 Singapore</option>
                  <option>GMT+9 Tokyo</option>
                  <option>GMT+1 Berlin</option>
                  <option>GMT+0 London</option>
                </select>
              </div>
            </section>

            {/* Location */}
            <section className="card p-4">
              <h3 className="text-[14px] font-bold tracking-tight">Location</h3>
              <div className="segmented mt-3 inline-flex">
                <button
                  type="button"
                  className={cn('flex items-center gap-1', loc === 'inperson' && 'active')}
                  onClick={() => setLoc('inperson')}
                >
                  <i className="hgi-stroke hgi-location-01 text-[13px]" />
                  In-person
                </button>
                <button
                  type="button"
                  className={cn('flex items-center gap-1', loc === 'online' && 'active')}
                  onClick={() => setLoc('online')}
                >
                  <i className="hgi-stroke hgi-global text-[13px]" />
                  Online
                </button>
              </div>
              <div className={cn('mt-3 space-y-3', online && 'hidden')}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  In-person details
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Venue name</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="e.g. BITEC"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Address</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Street, district, city"
                      defaultValue="88 Bangna-Trad Rd, Bang Na, Bangkok"
                    />
                  </div>
                </div>
              </div>
              <div className={cn('mt-3 space-y-3', !online && 'hidden')}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Online details
                </p>
                <div>
                  <label className="label">Meeting link</label>
                  <input
                    className="input"
                    type="url"
                    placeholder="https://meet.eventa.io/tech-summit-2026"
                  />
                  <p className="hint">Sent to attendees by email once they register.</p>
                </div>
              </div>
            </section>
          </section>

          {/* ===== STEP 2 · SEATING ===== */}
          <section className={cn('space-y-3', cur !== 2 && 'hidden')}>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight">Seating</h2>
              <p className="mt-1 text-[13px] text-muted">
                Choose how attendees get a spot — and preview the seat map they'll see.
              </p>
            </div>

            <section className="card p-4">
              <h3 className="text-[14px] font-bold tracking-tight">Admission</h3>
              <p className="mt-1 text-[12px] text-muted">How attendees get a spot at your event.</p>
              <div className={cn(online && 'hidden')}>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        key: 'ga' as const,
                        icon: 'hgi-user-group',
                        title: 'General admission',
                        desc: 'No assigned seats — open or standing. Free or paid.',
                      },
                      {
                        key: 'reserved' as const,
                        icon: 'hgi-seat-selector',
                        title: 'Reserved seating',
                        desc: 'Attendees pick their seat from a seat map at checkout.',
                      },
                    ] satisfies { key: Seating; icon: string; title: string; desc: string }[]
                  ).map((opt) => {
                    const on = seating === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSeating(opt.key)}
                        className={cn(
                          'flex items-start gap-3 rounded-xl bg-surface p-3.5 text-left transition hover:border-brand/40',
                          on ? 'border border-brand ring-1 ring-brand' : 'border border-hair',
                        )}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                          <i className={cn('hgi-stroke text-[18px]', opt.icon)} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[13.5px] font-bold text-ink">{opt.title}</span>
                            <span
                              className={cn(
                                'grid h-5 w-5 shrink-0 place-items-center rounded-full',
                                on ? 'border border-brand bg-brand text-white' : 'border border-hair text-transparent',
                              )}
                            >
                              <i className="hgi-stroke hgi-tick-02 text-[12px]" />
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[12px] text-muted">{opt.desc}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div
                  className={cn(
                    'mt-3 rounded-xl border border-hair bg-canvas p-3.5',
                    seating !== 'reserved' && 'hidden',
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Seat map</p>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:items-end">
                    <div>
                      <label className="label">Rows</label>
                      <input
                        className="input tnum"
                        type="number"
                        min={1}
                        max={26}
                        value={rows}
                        onChange={(e) => setRows(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Seats / row</label>
                      <input
                        className="input tnum"
                        type="number"
                        min={1}
                        max={40}
                        value={cols}
                        onChange={(e) => setCols(e.target.value)}
                      />
                    </div>
                    <div className="rounded-lg bg-brand-soft px-3 py-2 text-center">
                      <span className="block text-[11px] text-muted">Total seats</span>
                      <span className="text-[16px] font-bold text-brand tnum">
                        {seatTotal.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                </div>
                {/* live seat-map preview */}
                <div className={cn('mt-3', seating !== 'reserved' && 'hidden')}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Preview — what attendees see
                  </p>
                  <div className="efhouse mt-2 overflow-hidden rounded-2xl p-5">
                    <div className="mb-4 flex flex-col items-center">
                      <svg
                        viewBox="0 0 400 28"
                        className="w-full max-w-sm"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M8 24 Q200 2 392 24"
                          fill="none"
                          stroke="rgba(27,167,112,.7)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
                        Stage
                      </span>
                    </div>
                    <SeatPreview rows={rowsNum} cols={colsNum} />
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[11px] text-white/55">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="efseat efseat-sel !h-3.5 !w-3.5" />
                        Selected
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="efseat !h-3.5 !w-3.5" />
                        Available
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="efseat efseat-booked !h-3.5 !w-3.5" />
                        Booked
                      </span>
                    </div>
                  </div>
                  <p className="hint mt-2">The same green seat picker runs on the attendee ticket page.</p>
                </div>
              </div>
              <p
                className={cn(
                  'mt-3 inline-flex items-center gap-1.5 text-[12px] text-muted',
                  !online && 'hidden',
                )}
              >
                <i className="hgi-stroke hgi-video-01 text-[14px]" />
                Online event — no seating. A join link is emailed after registration.
              </p>
            </section>
          </section>

          {/* ===== STEP 3 · TICKETS ===== */}
          <section className={cn('space-y-3', cur !== 3 && 'hidden')}>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight">Tickets &amp; registration</h2>
              <p className="mt-1 text-[13px] text-muted">
                Add your ticket types, then set capacity and when registration is open.
              </p>
            </div>

            {/* Tickets */}
            <section className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold tracking-tight">Ticket types</h3>
                <span className="text-[11px] text-muted">Add one or more</span>
              </div>
              <div className="mt-3 hidden gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted sm:grid sm:grid-cols-12">
                <div className="sm:col-span-5">Ticket name</div>
                <div className="sm:col-span-3">Price (฿)</div>
                <div className="sm:col-span-3">Quantity</div>
                <div className="sm:col-span-1" />
              </div>
              <div className="mt-2 space-y-2">
                {tickets.map((t, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-12 sm:items-center">
                    <input
                      className="input sm:col-span-5"
                      type="text"
                      placeholder="Ticket name"
                      value={t.name}
                      onChange={(e) => setTicketField(i, 'name', e.target.value)}
                    />
                    <input
                      className="input tnum sm:col-span-3"
                      type="number"
                      placeholder="Price"
                      value={t.price}
                      onChange={(e) => setTicketField(i, 'price', e.target.value)}
                    />
                    <input
                      className="input tnum sm:col-span-3"
                      type="number"
                      placeholder="Quantity"
                      value={t.quantity}
                      onChange={(e) => setTicketField(i, 'quantity', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-icon col-span-2 justify-self-end sm:col-span-1 sm:justify-self-center"
                      title="Remove ticket type"
                      onClick={() => removeTicket(i)}
                    >
                      <i className="hgi-stroke hgi-delete-02 text-[16px]" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-soft btn-sm mt-3" onClick={addTicket}>
                <i className="hgi-stroke hgi-add-01 text-[14px]" />
                Add ticket type
              </button>
            </section>

            {/* Capacity & registration */}
            <section className="card p-4">
              <h3 className="text-[14px] font-bold tracking-tight">Capacity &amp; registration</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Capacity</label>
                  <input
                    className="input tnum"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Registration opens</label>
                  <input className="input" type="date" defaultValue="2026-07-14" />
                </div>
                <div>
                  <label className="label">Registration closes</label>
                  <input className="input" type="date" defaultValue="2026-08-17" />
                </div>
              </div>
              <div className="mt-4 space-y-3 border-t border-line pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">Require approval</p>
                    <p className="text-[11px] text-muted">
                      Manually review each registration before it's confirmed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequireApproval((v) => !v)}
                    className={cn(
                      'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5',
                      requireApproval ? 'bg-brand' : 'bg-line',
                    )}
                  >
                    <span
                      className={cn(
                        'h-4 w-4 rounded-full bg-white shadow transition-transform',
                        requireApproval && 'translate-x-4',
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">Enable waitlist</p>
                    <p className="text-[11px] text-muted">
                      Let attendees join a waitlist once capacity is reached.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWaitlist((v) => !v)}
                    className={cn(
                      'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5',
                      waitlist ? 'bg-brand' : 'bg-line',
                    )}
                  >
                    <span
                      className={cn(
                        'h-4 w-4 rounded-full bg-white shadow transition-transform',
                        waitlist && 'translate-x-4',
                      )}
                    />
                  </button>
                </div>
              </div>
            </section>
          </section>

          {/* ===== STEP 4 · REVIEW & PUBLISH ===== */}
          <section className={cn('space-y-3', cur !== 4 && 'hidden')}>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight">Review &amp; publish</h2>
              <p className="mt-1 text-[13px] text-muted">
                Choose a landing-page template and set how your event appears.
              </p>
            </div>

            {/* Landing page */}
            <section className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold tracking-tight">Landing page</h3>
                <Link
                  to="/admin/landing-pages"
                  className="text-[12px] font-semibold text-brand hover:underline"
                >
                  Browse templates
                </Link>
              </div>
              <p className="mt-1 text-[12px] text-muted">
                Choose a website template — its title, date, venue, agenda and tickets fill in
                automatically.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <label className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name="landing-tpl"
                    value="aurora"
                    className="peer sr-only"
                    checked={landingTpl === 'aurora'}
                    onChange={() => setLandingTpl('aurora')}
                  />
                  <i className="hgi-stroke hgi-checkmark-circle-02 text-[18px] absolute right-3 top-3 z-10 text-brand opacity-0 transition peer-checked:opacity-100" />
                  <div className="rounded-xl bg-canvas p-2 transition hover:bg-line peer-checked:bg-brand-soft peer-checked:ring-2 peer-checked:ring-brand/40">
                    <div className="h-14 overflow-hidden rounded-lg bg-white">
                      <div className="h-5 bg-gradient-to-r from-brand to-emerald-400" />
                      <div className="space-y-1 p-1.5">
                        <div className="h-1.5 w-10 rounded bg-neutral-800" />
                        <div className="h-1 w-8 rounded bg-neutral-300" />
                      </div>
                    </div>
                    <p className="mt-2 text-[12.5px] font-semibold text-ink">Classic</p>
                    <p className="text-[10.5px] text-muted">All-purpose</p>
                  </div>
                </label>
                <label className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name="landing-tpl"
                    value="noir"
                    className="peer sr-only"
                    checked={landingTpl === 'noir'}
                    onChange={() => setLandingTpl('noir')}
                  />
                  <i className="hgi-stroke hgi-checkmark-circle-02 text-[18px] absolute right-3 top-3 z-10 text-brand opacity-0 transition peer-checked:opacity-100" />
                  <div className="rounded-xl bg-canvas p-2 transition hover:bg-line peer-checked:bg-brand-soft peer-checked:ring-2 peer-checked:ring-brand/40">
                    <div className="grid h-14 grid-cols-5 gap-1 rounded-lg bg-white p-1.5">
                      <div className="col-span-3 space-y-1">
                        <div className="h-1.5 w-full rounded bg-neutral-800" />
                        <div className="h-1 w-3/4 rounded bg-neutral-300" />
                        <div className="mt-0.5 h-2 w-6 rounded bg-brand" />
                      </div>
                      <div className="col-span-2 rounded bg-brand-soft" />
                    </div>
                    <p className="mt-2 text-[12.5px] font-semibold text-ink">Spotlight</p>
                    <p className="text-[10.5px] text-muted">Ticket-focused</p>
                  </div>
                </label>
                <label className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name="landing-tpl"
                    value="minimal"
                    className="peer sr-only"
                    checked={landingTpl === 'minimal'}
                    onChange={() => setLandingTpl('minimal')}
                  />
                  <i className="hgi-stroke hgi-checkmark-circle-02 text-[18px] absolute right-3 top-3 z-10 text-brand opacity-0 transition peer-checked:opacity-100" />
                  <div className="rounded-xl bg-canvas p-2 transition hover:bg-line peer-checked:bg-brand-soft peer-checked:ring-2 peer-checked:ring-brand/40">
                    <div className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg bg-white">
                      <div className="h-1 w-4 rounded-full bg-brand" />
                      <div className="h-1.5 w-14 rounded bg-neutral-800" />
                      <div className="h-px w-16 bg-neutral-200" />
                      <div className="h-2 w-8 rounded bg-brand" />
                    </div>
                    <p className="mt-2 text-[12.5px] font-semibold text-ink">Minimal</p>
                    <p className="text-[10.5px] text-muted">Understated</p>
                  </div>
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <button type="button" className="btn btn-soft btn-sm" onClick={previewLanding}>
                  <i className="hgi-stroke hgi-play text-[14px]" />
                  Preview landing page
                </button>
                <span className="text-[11px] text-muted">
                  Opens in a new tab with the details you've entered.
                </span>
              </div>
            </section>

            {/* Publish settings */}
            <section className="card p-4">
              <h3 className="text-[14px] font-bold tracking-tight">Publish settings</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Status</label>
                  <select className="select" defaultValue="Draft">
                    <option>Draft</option>
                    <option>Published</option>
                    <option>Archived</option>
                  </select>
                </div>
                <div>
                  <label className="label">Visibility</label>
                  <select className="select" defaultValue="Public">
                    <option>Public</option>
                    <option>Private</option>
                    <option>Unlisted</option>
                  </select>
                </div>
              </div>
              <p className="hint mt-2">
                Public events are listed on the Eventa discovery page. You can edit details anytime
                before it goes live.
              </p>
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Publish checklist
                </p>
                <ul className="mt-2.5 space-y-2">
                  <li className="flex items-center gap-2 text-[13px] text-ink">
                    <i className="hgi-stroke hgi-checkmark-circle-02 text-[15px] text-brand" />
                    Title &amp; description added
                  </li>
                  <li className="flex items-center gap-2 text-[13px] text-ink">
                    <i className="hgi-stroke hgi-checkmark-circle-02 text-[15px] text-brand" />
                    Date &amp; time set
                  </li>
                  <li className="flex items-center gap-2 text-[13px] text-ink">
                    <i className="hgi-stroke hgi-checkmark-circle-02 text-[15px] text-brand" />
                    Location added
                  </li>
                  <li className="flex items-center gap-2 text-[13px] text-ink">
                    <i className="hgi-stroke hgi-checkmark-circle-02 text-[15px] text-brand" />
                    At least one ticket type
                  </li>
                  <li className="flex items-center gap-2 text-[13px] text-muted">
                    <i className="hgi-stroke hgi-alert-circle text-[15px] text-amber-500 dark:text-amber-300" />
                    Cover image not uploaded
                  </li>
                </ul>
              </div>
            </section>
          </section>

          {/* ===== nav ===== */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => cur > 0 && goTo(cur - 1)}
              className={cn('btn btn-soft', cur === 0 && 'pointer-events-none opacity-40')}
            >
              <i className="hgi-stroke hgi-arrow-left-01 text-[15px]" />
              Back
            </button>
            <button
              type="button"
              onClick={() => (last ? navigate('/admin/events') : goTo(cur + 1))}
              className="btn btn-primary min-w-[132px] justify-center"
            >
              {last ? (
                <>
                  <i className="hgi-stroke hgi-checkmark-circle-02 text-[16px]" />
                  Publish event
                </>
              ) : (
                <>
                  Next
                  <i className="hgi-stroke hgi-arrow-right-01 text-[15px]" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ============ TIPS / SUMMARY ============ */}
        <aside className="hidden xl:block">
          <div className="sticky top-4 space-y-3">
            <div className="rounded-2xl bg-neutral-900 p-4 text-white">
              <p className="flex items-center gap-2 text-[13px] font-bold">💡 Tips</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/75">{STEPS[cur].tip}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Summary</p>
              <div className="mt-2.5 space-y-2 text-[12.5px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">Event</span>
                  <span className="max-w-[150px] truncate font-semibold text-ink">
                    {title.trim() || 'Untitled event'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">Ticket types</span>
                  <span className="font-semibold text-ink tnum">{tickets.length}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">Capacity</span>
                  <span className="font-semibold text-ink tnum">
                    {(Number(capacity) || 0).toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">Seating</span>
                  <span className="font-semibold text-ink">{summarySeating}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted/70">
        Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
      </p>
    </>
  )
}
