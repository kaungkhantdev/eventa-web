import { useEffect, useRef, useState } from 'react'
import { Link, useFetcher, useLoaderData, useOutletContext } from 'react-router'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import type { ActionResult } from '@/app/loaders'
import { NotificationBell, SignedInChip, Toggle, VenueMap } from '@/components/ui'
import { cn } from '@/lib/cn'
import { mapLinkFor } from '@/lib/mapLink'
import { publishGaps, type EventFormValues, type TicketDraft } from '../eventForm.mapper'
import type { EventFormData } from '../eventForm.routes'
import { EVENT_TYPES } from '../events.routes'
import { LANDING_TEMPLATES } from '../landingTemplates'
import { eventDetailPath } from '../events.presentation'
import type { EventType } from '../types'
import {
  HL_ICONS,
  LETTERS,
  STEPS,
  WAITLIST_HINT,
  finalLabel,
  headerSaveLabel,
  landingPreviewHref,
  summaryCapacity,
  type Highlight,
} from '../eventForm.presentation'
import { CoverImageField } from '../components/CoverImageField'

/* ---------- Create-event wizard — admin/event-form.html ----------
   A five-step flow (Basics · Date & location · Seating · Tickets · Review)
   with a clickable step rail, live progress, a reserved-seating seat-map
   preview, ticket/highlight repeaters, toggles and a live summary panel. */

type LocMode = 'inperson' | 'online'
type Seating = 'ga' | 'reserved'
type LandingTpl = (typeof LANDING_TEMPLATES)[number]['id']

/**
 * The cap the counter shows, in CHARACTERS THE ORGANIZER TYPED — not markup.
 * The API allows 10,000 characters of sanitised HTML, so this leaves roughly
 * double the typed length as headroom for tags. Counting the markup instead
 * would make the number jump when someone bolded a word.
 */
const DESC_MAX = 5000

/** The API's publish requirements, in its own words — see events.service.ts. */
const PUBLISH_REQUIREMENTS = [
  'a title',
  'a description',
  'a venue or an online link',
  'at least one ticket type',
] as const

/** How each reads once it is satisfied. */
const REQUIREMENT_MET: Record<(typeof PUBLISH_REQUIREMENTS)[number], string> = {
  'a title': 'Title added',
  'a description': 'Description added',
  'a venue or an online link': 'Location added',
  'at least one ticket type': 'At least one ticket type',
}

/** A stored status → the word the console uses. */
function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

/* Scoped CSS ported verbatim from the source page's inline <style> blocks. */
const SCOPED_CSS = `
.efhouse{background:radial-gradient(120% 90% at 50% -10%, #17201c 0%, #0c110f 60%)}
.efseat{height:16px;width:16px;flex:none;border-radius:5px 5px 2px 2px;background:rgba(255,255,255,.16)}
.efseat-sel{background:#1ba770;box-shadow:0 0 0 2px rgba(27,167,112,.3)}
.efseat-booked{background:rgba(255,255,255,.05)}
.efrowlab{color:rgba(255,255,255,.5);font-size:10px;font-weight:600;width:14px;text-align:center;flex:none}
#desc-editor-wrap{ border:1px solid rgb(var(--hair)); border-radius:10px; background:rgb(var(--surface)); transition:box-shadow .15s ease; }
#desc-editor-wrap:focus-within{ box-shadow:0 0 0 4px rgb(27 167 112 / .15); }
#desc-editor-wrap .ql-toolbar.ql-snow{ border:0; border-bottom:1px solid rgb(var(--line)); border-radius:10px 10px 0 0; padding:7px 8px; }
#desc-editor-wrap .ql-container.ql-snow{ border:0; border-radius:0 0 10px 10px; font-family:inherit; font-size:13px; }
#desc-editor-wrap .ql-editor{ min-height:118px; padding:12px; line-height:1.6; color:rgb(var(--ink)); }
#desc-editor-wrap .ql-editor.ql-blank::before{ left:12px; right:12px; color:rgb(var(--muted)); font-style:normal; }
#desc-editor-wrap .ql-snow .ql-stroke{ stroke:rgb(var(--muted)); }
#desc-editor-wrap .ql-snow .ql-fill{ fill:rgb(var(--muted)); }
#desc-editor-wrap .ql-snow .ql-picker{ color:rgb(var(--ink)); }
#desc-editor-wrap .ql-snow.ql-toolbar button:hover .ql-stroke,
#desc-editor-wrap .ql-snow.ql-toolbar button.ql-active .ql-stroke,
#desc-editor-wrap .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke{ stroke:#1ba770; }
#desc-editor-wrap .ql-snow.ql-toolbar button:hover .ql-fill,
#desc-editor-wrap .ql-snow.ql-toolbar button.ql-active .ql-fill{ fill:#1ba770; }
#desc-editor-wrap .ql-snow.ql-toolbar button:hover,
#desc-editor-wrap .ql-snow.ql-toolbar button.ql-active,
#desc-editor-wrap .ql-snow .ql-picker-label:hover,
#desc-editor-wrap .ql-snow .ql-picker-item:hover,
#desc-editor-wrap .ql-snow .ql-picker-item.ql-selected{ color:#1ba770; }
#desc-editor-wrap .ql-snow .ql-picker-options{ background:rgb(var(--surface)); border-color:rgb(var(--hair))!important; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.14); }
#desc-editor-wrap .ql-snow .ql-tooltip{ background:rgb(var(--surface)); border-color:rgb(var(--hair)); color:rgb(var(--ink)); box-shadow:0 8px 24px rgba(0,0,0,.16); border-radius:8px; }
#desc-editor-wrap .ql-snow .ql-tooltip input[type=text]{ background:rgb(var(--canvas)); border-color:rgb(var(--hair)); color:rgb(var(--ink)); border-radius:6px; }
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

/** An emptied editor still holds one empty paragraph; that is not a description. */
function isBlank(quill: Quill): boolean {
  return quill.getLength() <= 1
}

/* ---------- Description rich-text editor (Quill 2 · snow) ----------
   The static kit's toolbar, but its formatting is now KEPT: the editor stores
   markup and the API sanitises it on write. The cap is DESC_MAX typed
   characters, well above the kit's 250.
   Quill is instantiated imperatively so it works under React 19 without a
   wrapper lib; a ref guard makes it survive StrictMode's double-mount. */
function DescriptionEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (text: string) => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(value.length)
  // Only what it opened with — retyping into a live editor would fight the user.
  const [initialText] = useState(value)
  // Quill is imperative and mounts once; the callback is read through a ref so
  // the effect below never has to re-run and re-create the editor.
  const latest = useRef(onChange)
  useEffect(() => {
    latest.current = onChange
  })

  useEffect(() => {
    const host = hostRef.current
    if (!host || host.dataset.quillReady) return
    host.dataset.quillReady = '1'

    const quill = new Quill(host, {
      theme: 'snow',
      placeholder: 'Tell attendees what this event is about…',
      modules: {
        toolbar: [
          [{ header: [false, 1, 2, 3] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          ['link', 'image', 'video'],
          ['clean'],
        ],
      },
    })

    // `dangerouslyPasteHTML` by name only: this is the description the API just
    // returned, and the API sanitises on write — see `rich-text.ts` there.
    if (initialText) quill.clipboard.dangerouslyPasteHTML(initialText, 'silent')
    const sync = () => {
      const len = Math.max(0, quill.getLength() - 1)
      setCount(len)
      // The MARKUP, not the text. `root.innerHTML` rather than
      // `getSemanticHTML()` because Quill renders indentation as a
      // `ql-indent-*` class, which the API's allowlist keeps, while the
      // semantic form emits an inline style, which it strips.
      latest.current(isBlank(quill) ? '' : quill.root.innerHTML)
    }
    sync()
    quill.on('text-change', () => {
      if (quill.getLength() - 1 > DESC_MAX)
        quill.deleteText(DESC_MAX, quill.getLength(), 'silent')
      sync()
    })
  }, [initialText])

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
        <div ref={hostRef} />
      </div>
    </div>
  )
}

export default function EventFormPage() {
  const ctx = useOutletContext<AdminOutletContext | null>()

  const { values: initial, template } = useLoaderData() as EventFormData
  const fetcher = useFetcher<ActionResult>()
  const saving = fetcher.state !== 'idle'

  const [cur, setCur] = useState(0)
  const [loc, setLoc] = useState<LocMode>(initial.isOnline ? 'online' : 'inperson')
  const [seating, setSeating] = useState<Seating>(initial.seatingMode)
  const [rows, setRows] = useState(initial.seatRows || '7')
  const [cols, setCols] = useState(initial.seatsPerRow || '16')
  const [title, setTitle] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [type, setType] = useState<EventType>(initial.type)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [startTime, setStartTime] = useState(initial.startTime)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [endTime, setEndTime] = useState(initial.endTime)
  const [venue, setVenue] = useState(initial.venueName)
  const [address, setAddress] = useState(initial.venueAddress)
  const [onlineNote, setOnlineNote] = useState(initial.onlineNote)
  const [capacity, setCapacity] = useState(initial.capacity)
  const [waitlist, setWaitlist] = useState(initial.waitlistEnabled)
  const [highlights, setHighlights] = useState<Highlight[]>(() =>
    initial.highlights.map((h) => ({ icon: h.icon ?? 'hgi-sparkles', label: h.text })),
  )
  const [coverImage, setCoverImage] = useState(initial.coverImage)
  // Recomputed as they type, so it always points at what is actually in the
  // boxes rather than at whatever was there when the page loaded.
  const mapLink = mapLinkFor({ venueName: venue, address, city: initial.city })
  const [landingTpl, setLandingTpl] = useState<LandingTpl>(template)
  const [visibility, setVisibility] = useState('public')

  // Rows start as whatever the API has stored; a row with no id has not been
  // saved yet, which is also what the publish gate checks.
  const [tickets, setTickets] = useState<TicketDraft[]>(() => initial.tickets.map((t) => ({ ...t })))

  // When a save lands, the loader revalidates and the rows come back carrying
  // ids. Re-seeding on that — and only on that, not on every revalidation —
  // is what lets the publish gate go green without discarding a row being typed.
  const savedIds = initial.tickets.map((t) => t.id).join(',')
  const [seenIds, setSeenIds] = useState(savedIds)
  if (savedIds !== seenIds) {
    setSeenIds(savedIds)
    setTickets(initial.tickets.map((t) => ({ ...t })))
  }

  const online = loc === 'online'

  /** Everything the action needs, gathered from the fields on screen. */
  const collect = (): EventFormValues => ({
    ...initial,
    name: title,
    description,
    type,
    startDate,
    startTime,
    endDate,
    endTime,
    venueName: online ? '' : venue,
    venueAddress: online ? '' : address,
    isOnline: online,
    onlineNote: online ? onlineNote : '',
    seatingMode: seating,
    capacity,
    // Reserved seating has no waitlist, whatever the switch was left at.
    waitlistEnabled: waitlist && seating === 'ga',
    seatRows: rows,
    seatsPerRow: cols,
    coverImage,
    highlights: highlights.map((h) => ({ text: h.label, icon: h.icon })),
    tickets,
  })

  const submit = (fields: Record<string, string> = {}) =>
    fetcher.submit({ values: JSON.stringify(collect()), ...fields }, { method: 'post' })

  /** What the API still needs before it will publish this one. */
  const gaps = publishGaps(collect())
  const isDraft = initial.status === null || initial.status === 'draft'
  const pct = Math.round(((cur + 1) / STEPS.length) * 100)
  const last = cur === STEPS.length - 1
  // An event that already exists is being edited, whatever the wizard is
  // called. Saying "Create event" over someone's published conference is the
  // kind of small lie that makes people doubt whether Save did anything.
  const heading = initial.id ? 'Edit event' : 'Create event'
  const rowsNum = Number(rows) || 0
  const colsNum = Number(cols) || 0
  const seatTotal = rowsNum * colsNum

  /**
   * `POST /events` needs a name, a type and a start — and the start is asked
   * for on step 2. So the draft is created on the way out of that step, not the
   * first one; before then there is nothing the API would accept.
   */
  const canCreate = Boolean(title.trim() && startDate)

  /**
   * Save whatever step is open.
   *
   * The first save creates the event and puts its id in the URL, so the work
   * survives a refresh; each later step sends the call that step owns.
   */
  /**
   * Write whatever step is open. `extra` carries the caller's intent about
   * feedback: a Next saves silently, the header's button announces it.
   */
  const saveStep = (extra: Record<string, string> = {}) => {
    if (!initial.id) {
      if (canCreate) submit({ intent: 'create', ...extra })
      return
    }
    if (cur === 2) submit({ intent: 'seating', ...extra })
    else if (cur === 3) submit({ intent: 'tickets', ...extra })
    else submit({ intent: 'save', ...extra })
  }

  /**
   * The header's save. It has always written the open step — but it was called
   * "Save as draft" on an event that is already published, which reads as an
   * offer to UNPUBLISH, and it confirmed nothing. So editing one field on step
   * one meant clicking Next through every remaining step to reach a button that
   * looked like it would save. Same write; it now says what it does and says
   * when it is done.
   */
  const saveHere = () => saveStep({ notify: 'on' })

  const publish = () =>
    submit({ intent: 'publish', visibility, template: landingTpl, confirmPastStart: 'on' })

  /**
   * The last step's save on an event that is already live. Same write as every
   * other step's Next — `finish` only tells the action this was the end of the
   * wizard, so it can announce the save and hand the organizer back to the
   * event instead of leaving them on a form with nothing left to do.
   */
  const saveAndFinish = () => submit({ intent: 'save', notify: 'on', finish: 'on' })

  const goTo = (i: number) => {
    setCur(Math.max(0, Math.min(STEPS.length - 1, i)))
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const summarySeating = online
    ? 'Online'
    : seating === 'reserved'
      ? `Reserved · ${rowsNum}×${colsNum}`
      : 'General admission'

  const addTicket = () =>
    setTickets((prev) => [...prev, { id: null, name: '', price: '', quantity: '', isFree: false }])

  /** A saved tier is removed on the server; an unsaved row just goes. */
  const removeTicket = (index: number) => {
    const row = tickets[index]
    if (row?.id) {
      fetcher.submit(
        { intent: 'remove-ticket', ticketId: row.id, values: JSON.stringify(collect()) },
        { method: 'post' },
      )
      return
    }
    setTickets((prev) => prev.filter((_, j) => j !== index))
  }

  const setTicketField = (index: number, field: 'name' | 'price' | 'quantity', value: string) =>
    setTickets((prev) => prev.map((t, j) => (j === index ? { ...t, [field]: value } : t)))

  const addHighlight = () =>
    setHighlights((prev) => [...prev, { icon: 'hgi-sparkles', label: '' }])
  const removeHighlight = (i: number) => setHighlights((prev) => prev.filter((_, j) => j !== i))
  const setHighlightField = (i: number, field: keyof Highlight, value: string) =>
    setHighlights((prev) => prev.map((h, j) => (j === i ? { ...h, [field]: value } : h)))

  /**
   * Recomputed as they type, so the draft branch previews what is in the boxes
   * now rather than what was there when the page loaded.
   */
  const previewHref = landingPreviewHref(
    landingTpl,
    initial.id
      ? { slug: initial.slug, status: initial.status ?? '', visibility: initial.visibility }
      : null,
    { title, venue, online, highlights },
  )
  /**
   * A live event previews its real published page, so what is on screen but not
   * yet saved will not appear there — said plainly rather than left to surprise
   * somebody who just typed a new title.
   */
  const previewsSaved = previewHref.includes('event=')
  const previewTitle = previewsSaved
    ? 'Opens the live public page — unsaved changes are not shown'
    : 'Opens a preview of this draft in a new tab'

  /* A new tab, not a navigation: the wizard holds the open step's edits in
     component state, so leaving the page would discard them. */
  const previewLanding = () => window.open(previewHref, '_blank', 'noopener')

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
          {/* In the header rather than only on the last step: the landing page
              is what every step feeds, so "what will this look like?" is asked
              while writing the description, not just at the end. */}
          <button
            type="button"
            onClick={previewLanding}
            className="btn btn-soft"
            title={previewTitle}
          >
            <i className="hgi-stroke hgi-arrow-up-right-01 text-[16px]" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          {/* Only once the event exists: on a new one there is no workspace to
              open yet. Editing is usually a detour from the event's own page,
              and without this the way back was the browser's back button. */}
          {initial.id && (
            <Link
              to={eventDetailPath(initial.id)}
              className="btn btn-soft"
              title="Open this event's workspace"
            >
              <i className="hgi-stroke hgi-eye text-[16px]" />
              <span className="hidden sm:inline">View event</span>
            </Link>
          )}
          <button
            type="button"
            onClick={saveHere}
            disabled={saving || (!initial.id && !canCreate)}
            title={
              initial.id || canCreate
                ? undefined
                : 'A title and a start date are needed before this can be saved'
            }
            className="btn btn-soft disabled:opacity-60"
          >
            <i className="hgi-stroke hgi-note-03 text-[16px]" />
            <span className="hidden sm:inline">{headerSaveLabel(initial.id !== null, saving)}</span>
            <span className="sm:hidden">Draft</span>
          </button>
          <NotificationBell />
          <SignedInChip />
        </div>
      </div>

      {/* The API's own sentence when it refuses — a 400 on create, a 409 on a
          stale version, a 422 listing what publishing still needs. */}
      {fetcher.data?.error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
        >
          {fetcher.data.error}
        </p>
      )}

      {/* wizard layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_270px]">
        {/* ============ STEP SIDEBAR ============ */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <nav className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
            <Link to="/admin/events" className="transition hover:text-ink">
              Events
            </Link>
            <i className="hgi-stroke hgi-arrow-right-01 text-[13px]" />
            <span className="text-ink">{heading}</span>
          </nav>
          <h1 className="mt-2 text-[22px] font-bold tracking-tight">{heading}</h1>
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
                <DescriptionEditor value={initial.description} onChange={setDescription} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="event-type">
                      Type
                    </label>
                    <select
                      id="event-type"
                      className="select"
                      value={type}
                      onChange={(e) => setType(e.target.value as EventType)}
                    >
                      {EVENT_TYPES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Cover image */}
            <section className="card p-4">
              <h3 className="text-[14px] font-bold tracking-tight">Cover image</h3>
              <CoverImageField value={coverImage} onChange={setCoverImage} />
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
                  <input
                    className="input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Start time</label>
                  <input
                    className="input"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">End date</label>
                  <input
                    className="input"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">End time</label>
                  <input
                    className="input"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Timezone</label>
                {/* Every event in this product runs on Bangkok time — the times
                    above are that wall clock, and offering others would imply a
                    choice the API does not store. */}
                <input className="input" type="text" value="GMT+7 Bangkok" readOnly disabled />
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
                    <div className="flex items-baseline justify-between gap-2">
                      <label className="label">Address</label>
                      {/* Built from what is typed, never stored: a saved link
                          and an edited address drift apart, and the stale copy
                          is the one that strands somebody outside the wrong
                          building. Offered as a check BEFORE publishing — if
                          it lands somewhere odd here, it will for attendees. */}
                      {mapLink && (
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                        >
                          <i className="hgi-stroke hgi-location-01 text-[13px]" />
                          Check on map
                        </a>
                      )}
                    </div>
                    <input
                      className="input"
                      type="text"
                      placeholder="Street, district, city"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
                {/* The same map the attendee will see, while there is still
                    time to correct the address that produced it. */}
                <VenueMap
                  venue={{ venueName: venue, address, city: initial.city }}
                  title="Venue location preview"
                />
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
                    placeholder="https://meet.eventa.io/your-event"
                    value={onlineNote}
                    onChange={(e) => setOnlineNote(e.target.value)}
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
                  <p className="hint">
                    Total headcount. Each ticket tier carries its own sales window.
                  </p>
                </div>
              </div>
              {/* The kit's "Enable waitlist" row, verbatim; its "Require
                  approval" sibling stays out until something honours it. */}
              <div className="mt-4 space-y-3 border-t border-line pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">Enable waitlist</p>
                    <p className="text-[11px] text-muted">{WAITLIST_HINT[seating]}</p>
                  </div>
                  <Toggle
                    on={waitlist && seating === 'ga'}
                    onChange={setWaitlist}
                    label="Enable waitlist"
                    disabled={seating !== 'ga'}
                    transition="transition-transform"
                  />
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
                  {/* Read-only: the button below is what changes it, and the
                      lifecycle has no "Archived" — an event is cancelled. */}
                  <p className="mt-1 text-[13px] font-semibold text-ink">
                    {initial.status ? statusLabel(initial.status) : 'Not created yet'}
                  </p>
                </div>
                <div>
                  <label className="label" htmlFor="visibility">
                    Visibility
                  </label>
                  {/* Only settable at publish time — that is the one body the
                      API takes it in. */}
                  <select
                    id="visibility"
                    className="select"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    disabled={!isDraft}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
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
                {/* The same four rules the API applies, so the checklist and
                    the Publish button agree with the server before it is asked. */}
                <ul className="mt-2.5 space-y-2">
                  {PUBLISH_REQUIREMENTS.map((requirement) => {
                    const missing = gaps.includes(requirement)
                    return (
                      <li
                        key={requirement}
                        className={cn(
                          'flex items-center gap-2 text-[13px]',
                          missing ? 'text-muted' : 'text-ink',
                        )}
                      >
                        <i
                          className={cn(
                            'text-[15px]',
                            missing
                              ? 'hgi-stroke hgi-alert-circle text-amber-500 dark:text-amber-300'
                              : 'hgi-stroke hgi-checkmark-circle-02 text-brand',
                          )}
                        />
                        {missing ? `Still needs ${requirement}` : REQUIREMENT_MET[requirement]}
                      </li>
                    )
                  })}
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
              disabled={
                saving || (last ? isDraft && gaps.length > 0 : cur === 1 && !canCreate)
              }
              title={last && isDraft && gaps.length ? `Still needs ${gaps.join(', ')}` : undefined}
              onClick={() => {
                // Each Next saves the step it is leaving, so nothing is held in
                // the browser waiting for a final submit that may never come.
                //
                // On the last step a draft is published; an event that is
                // already live is simply saved. It used to offer "Publish
                // event" here and disable it, which told an organizer editing a
                // published event that their only option was one they could not
                // take — and left the step with nothing to press.
                if (last) {
                  if (isDraft) publish()
                  else saveAndFinish()
                } else {
                  saveStep()
                  goTo(cur + 1)
                }
              }}
              className="btn btn-primary min-w-[132px] justify-center disabled:opacity-60"
            >
              {last ? (
                <>
                  <i className="hgi-stroke hgi-checkmark-circle-02 text-[16px]" />
                  {finalLabel(isDraft, saving)}
                </>
              ) : (
                <>
                  {saving ? 'Saving…' : 'Next'}
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
                    {/* An unset capacity is not a capacity of nought. `0` reads
                        as "nobody may come", which is the opposite of "as many
                        as the tickets allow". */}
                    {summaryCapacity(capacity)}
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
