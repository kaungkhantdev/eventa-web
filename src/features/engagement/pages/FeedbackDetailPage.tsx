import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import {
  DataTable,
  Icon,
  NotificationBell,
  Panel,
  SignedInChip,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { num } from '@/lib/format'
import {
  buildResponses,
  FEEDBACK_EVENTS,
  getEvent,
  type FeedbackEvent,
  type QuestionType,
  type Survey,
} from '../data/feedback'
import { Stars } from '../components/Stars'
import { StatusBadge } from '../components/StatusBadge'

/* ---------- Event feedback detail — admin/feedback-detail.html ----------
   Reads ?event=<slug>. Distribution bars and per-survey response counts drill
   into a filterable, paginated response browser (generated to match totals).
   Surveys table supports View (read-only panel), Edit / New (edit panel with a
   question builder), and a row "More" menu (duplicate / open-close / delete).
   The response browser is a snapshot of the original surveys and does not react
   to table mutations — faithful to the source. */

const QTYPE: Record<QuestionType, string> = {
  Rating: 'hgi-star',
  Text: 'hgi-message-01',
  'Multiple choice': 'hgi-checkmark-circle-02',
}

type EditRow = { id: number; q: string; type: QuestionType }

export default function FeedbackDetailPage() {
  const [params] = useSearchParams()
  const ev = getEvent(params.get('event')) ?? FEEDBACK_EVENTS[0]
  // Remount on event change so all local state (surveys, filters, panels) resets.
  return <FeedbackDetailView key={ev.slug} ev={ev} />
}

function FeedbackDetailView({ ev }: { ev: FeedbackEvent }) {
  const ctx = useOutletContext<AdminOutletContext | null>()

  // Mutable copy of the surveys (duplicate / toggle / delete operate on this).
  const [surveys, setSurveys] = useState<Survey[]>(() =>
    ev.surveys.map((s) => ({ ...s, questions: s.questions.map((q) => ({ ...q })) })),
  )
  const [current, setCurrent] = useState(0)

  const view = useDisclosure()
  const edit = useDisclosure()

  // Responses browser — a fixed snapshot of the original event.
  const respAll = useMemo(() => buildResponses(ev), [ev])
  const withResp = useMemo(() => ev.surveys.filter((s) => s.responses), [ev])
  const [respSurvey, setRespSurvey] = useState('')
  const [respRating, setRespRating] = useState('')
  const [respPage, setRespPage] = useState(0)
  const [respSize, setRespSize] = useState(10)
  const respListRef = useRef<HTMLDivElement>(null)

  const respFiltered = useMemo(
    () =>
      respAll.filter(
        (r) =>
          (!respSurvey || r.survey === respSurvey) &&
          (!respRating || r.rating === Number(respRating)),
      ),
    [respAll, respSurvey, respRating],
  )
  const total = respFiltered.length
  const pages = Math.max(1, Math.ceil(total / respSize))
  const page = Math.min(respPage, pages - 1)
  const start = page * respSize
  const slice = respFiltered.slice(start, start + respSize)

  const scrollToResponses = () =>
    respListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const filterByRating = (starVal: number) => {
    setRespRating(String(starVal))
    setRespPage(0)
    scrollToResponses()
  }
  const filterBySurvey = (title: string) => {
    setRespSurvey(title)
    setRespPage(0)
    scrollToResponses()
  }

  // ---- edit panel state ----
  const [editIsNew, setEditIsNew] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editRows, setEditRows] = useState<EditRow[]>([])
  const editId = useRef(0)
  const makeRow = (q: string, type: QuestionType): EditRow => {
    editId.current += 1
    return { id: editId.current, q, type }
  }
  const loadEdit = (s: Survey | null) => {
    setEditIsNew(s == null)
    setEditTitle(s ? s.title : '')
    setEditRows(s ? s.questions.map((q) => makeRow(q.q, q.type)) : [makeRow('', 'Rating')])
  }
  const openView = (i: number) => {
    setCurrent(i)
    view.onOpen()
  }
  const openEditIndex = (i: number) => {
    setCurrent(i)
    loadEdit(surveys[i])
    edit.onOpen()
  }
  const openEditNew = () => {
    loadEdit(null)
    edit.onOpen()
  }
  const openEditFromView = () => {
    view.onClose()
    loadEdit(surveys[current])
    edit.onOpen()
  }

  // ---- row "More" menu (self-positioned fixed dropdown) ----
  const [menu, setMenu] = useState<{ index: number; rect: DOMRect } | null>(null)
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeMenu = () => {
    setMenu(null)
    setMenuPos(null)
  }
  const toggleMenu = (i: number, btn: HTMLElement) => {
    setCurrent(i)
    setMenu((m) => (m && m.index === i ? null : { index: i, rect: btn.getBoundingClientRect() }))
    setMenuPos(null)
  }

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return
    const el = menuRef.current
    const mw = el.offsetWidth
    const mh = el.offsetHeight
    const r = menu.rect
    let left = Math.min(r.right - mw, window.innerWidth - mw - 8)
    left = Math.max(8, left)
    const top = Math.min(r.bottom + 6, window.innerHeight - mh - 8)
    setMenuPos({ left, top })
  }, [menu])

  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('.js-more')) return
      if (menuRef.current && !menuRef.current.contains(t)) closeMenu()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    const onResize = () => closeMenu()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [menu])

  const act = (a: 'duplicate' | 'toggle' | 'delete') => {
    if (!menu) return
    const i = menu.index
    closeMenu()
    setSurveys((prev) => {
      if (a === 'duplicate') {
        const s = prev[i]
        const copy: Survey = {
          ...s,
          title: s.title + ' (copy)',
          responses: 0,
          avg: null,
          status: 'Draft',
          questions: s.questions.map((q) => ({ ...q })),
        }
        const next = prev.slice()
        next.splice(i + 1, 0, copy)
        return next
      }
      if (a === 'toggle') {
        return prev.map((s, idx) =>
          idx === i ? { ...s, status: s.status === 'Closed' ? 'Live' : 'Closed' } : s,
        )
      }
      return prev.filter((_, idx) => idx !== i)
    })
  }

  const subtitle =
    `${surveys.length} ${surveys.length === 1 ? 'survey' : 'surveys'}` +
    (ev.responses ? ` · ${num(ev.responses)} responses collected` : ' · no responses yet')

  const viewSurvey = surveys[current]

  return (
    <>
      {/* header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => ctx?.openDrawer()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
          title="Open menu"
        >
          <Icon name="hgi-menu-01" size={18} />
        </button>
        <Link
          to="/admin/feedback"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
          title="Back to Feedback"
        >
          <Icon name="hgi-arrow-left-01" size={20} />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[22px] font-bold tracking-tight">{ev.name}</h1>
            <StatusBadge status={ev.status} className="shrink-0" />
          </div>
          <p className="mt-0.5 truncate text-[12px] text-muted">{subtitle}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <button type="button" className="btn btn-primary shrink-0" onClick={openEditNew}>
            <Icon name="hgi-add-01" size={16} />
            <span className="hidden sm:inline">New survey</span>
            <span className="sm:hidden">New</span>
          </button>
          <NotificationBell />
          <SignedInChip />
        </div>
      </div>

      {/* event KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-message-01" size={16} />
            Responses
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight tnum">
            {ev.responses ? num(ev.responses) : '—'}
          </p>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-star" size={16} className="text-amber-400" />
            Avg rating
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight tnum">
            {ev.avg != null ? ev.avg.toFixed(1) : '—'}
          </p>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-analytics-up" size={16} />
            NPS
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight tnum">
            {ev.nps != null ? `+${ev.nps}` : '—'}
          </p>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-checkmark-badge-01" size={16} />
            Completion rate
          </div>
          <p className="mt-2 text-[22px] font-bold tracking-tight tnum">
            {ev.completion != null ? `${ev.completion} %` : '—'}
          </p>
        </div>
      </div>

      {/* satisfaction + surveys */}
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <section className="card p-4 xl:col-span-1">
          <h2 className="text-[15px] font-bold tracking-tight">Overall satisfaction</h2>
          <p className="mt-0.5 text-[12px] text-muted">Ratings for this event</p>
          {ev.responses && ev.avg != null ? (
            <div>
              <div className="mt-4 flex items-center gap-4">
                <p className="text-[38px] font-extrabold leading-none tracking-tight tnum">
                  {ev.avg.toFixed(1)}
                </p>
                <div>
                  <div className="flex">
                    <Stars avg={ev.avg} size={16} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted tnum">{num(ev.responses)} responses</p>
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                {[0, 1, 2, 3, 4].map((i) => {
                  const starVal = 5 - i
                  const c = ev.dist[i]
                  const w = ((c / ev.responses) * 100).toFixed(0)
                  return (
                    <button
                      key={starVal}
                      type="button"
                      title={`Show ${starVal}-star responses`}
                      onClick={() => filterByRating(starVal)}
                      className="-mx-1 flex w-full items-center gap-2.5 rounded-md px-1 py-0.5 text-left transition hover:bg-line"
                    >
                      <span className="flex w-9 shrink-0 items-center gap-0.5 text-[11px] font-semibold text-muted">
                        {starVal}{' '}
                        <i
                          className="hgi-stroke hgi-star text-[11px] text-amber-400"
                          aria-hidden="true"
                        />
                      </span>
                      <div className="h-1.5 flex-1 rounded-full bg-line">
                        <div
                          className="h-1.5 rounded-full bg-amber-400"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[11px] text-muted tnum">
                        {num(c)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center py-6 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
                <Icon name="hgi-message-01" size={20} />
              </div>
              <p className="mt-3 text-[13px] font-semibold text-ink">No responses yet</p>
              <p className="mt-1 text-[12px] text-muted">
                Responses appear once the survey goes live.
              </p>
            </div>
          )}
        </section>

        <section className="card p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight">Surveys</h2>
            <span className="text-[12px] text-muted">
              {surveys.length} {surveys.length === 1 ? 'survey' : 'surveys'}
            </span>
          </div>
          <div className="mt-2 overflow-x-auto">
            <DataTable className="min-w-[560px]">
              <thead>
                <tr>
                  <th>Survey</th>
                  <th>Responses</th>
                  <th>Avg rating</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {surveys.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center py-8 text-center">
                        <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
                          <Icon name="hgi-message-01" size={20} />
                        </div>
                        <p className="mt-3 text-[13px] font-semibold text-ink">No surveys yet</p>
                        <p className="mt-1 text-[12px] text-muted">
                          Create a survey to start collecting feedback.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  surveys.map((s, i) => (
                    <tr key={i}>
                      <td className="font-medium text-ink">{s.title}</td>
                      <td>
                        {s.responses ? (
                          <button
                            type="button"
                            onClick={() => filterBySurvey(s.title)}
                            className="tnum font-medium text-ink transition hover:text-brand hover:underline"
                            title="Show responses for this survey"
                          >
                            {num(s.responses)}
                          </button>
                        ) : (
                          <span className="tnum text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {s.avg != null ? (
                          <span className="flex items-center gap-1 tnum">
                            <i
                              className="hgi-stroke hgi-star text-[12px] text-amber-400"
                              aria-hidden="true"
                            />
                            {s.avg.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn-icon"
                            onClick={() => openView(i)}
                            aria-label="View survey"
                            title="View survey"
                          >
                            <Icon name="hgi-eye" size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => openEditIndex(i)}
                            aria-label="Edit survey"
                            title="Edit survey"
                          >
                            <Icon name="hgi-edit-02" size={16} />
                          </button>
                          <button
                            className="btn-icon js-more"
                            onClick={(e) => toggleMenu(i, e.currentTarget)}
                            aria-label="More actions"
                            aria-haspopup="menu"
                            title="More"
                          >
                            <Icon name="hgi-more-vertical" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </DataTable>
          </div>
        </section>
      </div>

      {/* responses */}
      <section className="card mt-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Responses</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {ev.responses
                ? `${num(ev.responses)} total across ${withResp.length} surveys`
                : 'No responses yet'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={respSurvey}
              disabled={!ev.responses}
              onChange={(e) => {
                setRespSurvey(e.target.value)
                setRespPage(0)
              }}
              className="select h-9 w-[9.5rem] pr-8 text-[12.5px]"
            >
              <option value="">All surveys</option>
              {withResp.map((s) => (
                <option key={s.title} value={s.title}>
                  {s.title} ({num(s.responses)})
                </option>
              ))}
            </select>
            <select
              value={respRating}
              disabled={!ev.responses}
              onChange={(e) => {
                setRespRating(e.target.value)
                setRespPage(0)
              }}
              className="select h-9 w-[8rem] pr-8 text-[12.5px]"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r > 1 ? 's' : ''} ({num(ev.dist[5 - r])})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div ref={respListRef} className="mt-3">
          {!ev.responses ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
                <Icon name="hgi-message-01" size={20} />
              </div>
              <p className="mt-3 text-[13px] font-semibold text-ink">No responses yet</p>
              <p className="mt-1 text-[12px] text-muted">Attendee responses will show here.</p>
            </div>
          ) : total === 0 ? (
            <div className="py-8 text-center text-[13px] text-muted">
              No responses match these filters.
            </div>
          ) : (
            slice.map((r, i) => (
              <div
                key={start + i}
                className="flex flex-col gap-2 border-t border-line py-3 first:border-t-0 sm:flex-row sm:items-start sm:gap-3"
              >
                <span className="avatar h-8 w-8 shrink-0 text-[11px]">{r.initials}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink">{r.who}</p>
                      <span className="truncate text-[11px] text-muted">{r.survey}</span>
                    </div>
                    <div className="flex">
                      <Stars avg={r.rating} size={13} />
                    </div>
                  </div>
                  <p className="mt-1 text-[13px] italic text-muted">"{r.text}"</p>
                  <p className="mt-1 text-[11px] text-muted tnum">{r.date}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {ev.responses > 0 && total > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
            <p>
              Showing{' '}
              <span className="font-semibold text-ink">
                {start + 1}–{start + slice.length}
              </span>{' '}
              of <span className="font-semibold text-ink tnum">{num(total)}</span> responses
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 whitespace-nowrap">
                Rows per page
                <select
                  value={respSize}
                  onChange={(e) => {
                    setRespSize(Number(e.target.value))
                    setRespPage(0)
                  }}
                  className="select h-8 w-auto min-w-[3.75rem] py-0 pl-2.5 pr-7 text-[12px] font-medium text-ink"
                >
                  <option>10</option>
                  <option>20</option>
                  <option>30</option>
                  <option>50</option>
                </select>
              </label>
              <div className="flex gap-1">
                <button
                  className="btn btn-soft btn-sm"
                  type="button"
                  aria-label="Previous page"
                  disabled={page === 0}
                  onClick={() => setRespPage((p) => Math.max(0, p - 1))}
                >
                  <Icon name="hgi-arrow-left-01" size={14} />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <button
                  className="btn btn-soft btn-sm"
                  type="button"
                  aria-label="Next page"
                  disabled={page >= pages - 1}
                  onClick={() => setRespPage((p) => p + 1)}
                >
                  <span className="hidden sm:inline">Next</span>
                  <Icon name="hgi-arrow-right-01" size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <p className="mt-6 text-center text-[11px] text-muted/70">
        Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
      </p>

      {/* Row action menu (self-managed fixed dropdown) */}
      {menu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Survey actions"
          className="fixed z-[70] w-44 overflow-hidden rounded-xl bg-surface py-1 shadow-pop ring-1 ring-black/5 dark:ring-white/10"
          style={menuPos ? { left: menuPos.left, top: menuPos.top } : { left: -9999, top: -9999 }}
        >
          <button
            role="menuitem"
            onClick={() => act('duplicate')}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink transition hover:bg-line focus:bg-line focus:outline-none"
          >
            <Icon name="hgi-copy-01" size={15} className="text-muted" />
            Duplicate
          </button>
          <button
            role="menuitem"
            onClick={() => act('toggle')}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink transition hover:bg-line focus:bg-line focus:outline-none"
          >
            <Icon name="hgi-time-quarter-pass" size={15} className="text-muted" />
            {surveys[menu.index]?.status === 'Closed' ? 'Reopen survey' : 'Close survey'}
          </button>
          <div className="my-1 h-px bg-line" />
          <button
            role="menuitem"
            onClick={() => act('delete')}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-red-500 transition hover:bg-red-50 focus:bg-red-50 focus:outline-none dark:hover:bg-red-500/15"
          >
            <Icon name="hgi-delete-02" size={15} />
            Delete survey
          </button>
        </div>
      )}

      {/* Survey view (read-only detail) */}
      <Panel
        open={view.open}
        onClose={view.onClose}
        title={viewSurvey ? viewSurvey.title : 'Survey'}
        subtitle={ev.name}
        footer={
          <>
            <button className="btn btn-soft flex-1" onClick={view.onClose}>
              Close
            </button>
            <button className="btn btn-primary flex-1" onClick={openEditFromView}>
              <Icon name="hgi-edit-02" size={15} />
              Edit survey
            </button>
          </>
        }
      >
        {viewSurvey && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-canvas p-3 text-center">
                <p className="text-[18px] font-bold tnum">
                  {viewSurvey.responses ? num(viewSurvey.responses) : '—'}
                </p>
                <p className="text-[11px] text-muted">Responses</p>
              </div>
              <div className="rounded-xl bg-canvas p-3 text-center">
                <p className="text-[18px] font-bold tnum">
                  {viewSurvey.avg != null ? viewSurvey.avg.toFixed(1) : '—'}
                </p>
                <p className="text-[11px] text-muted">Avg rating</p>
              </div>
              <div className="rounded-xl bg-canvas p-3 text-center">
                <p className="text-[13px] font-semibold">
                  <StatusBadge status={viewSurvey.status} />
                </p>
                <p className="text-[11px] text-muted">Status</p>
              </div>
            </div>
            <div>
              <p className="label">Questions</p>
              <ol className="mt-1 space-y-2">
                {viewSurvey.questions.map((q, n) => (
                  <li
                    key={n}
                    className="flex items-start gap-2.5 rounded-lg bg-canvas p-3"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-soft text-[11px] font-bold text-brand tnum">
                      {n + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{q.q}</p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                        <Icon name={QTYPE[q.type] ?? 'hgi-message-01'} size={12} />
                        {q.type}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Panel>

      {/* Survey create / edit */}
      <Panel
        open={edit.open}
        onClose={edit.onClose}
        title={editIsNew ? 'New survey' : 'Edit survey'}
        footer={
          <>
            <button className="btn btn-soft flex-1" onClick={edit.onClose}>
              Cancel
            </button>
            <button className="btn btn-primary flex-1" onClick={edit.onClose}>
              Save survey
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Survey title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Post-event Experience"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Event</label>
            <input type="text" className="input" disabled value={ev.name} />
          </div>
          <div className="border-t border-hair pt-4">
            <label className="label !mb-0">Questions</label>
            <div className="mt-2 space-y-2">
              {editRows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Question…"
                    value={row.q}
                    onChange={(e) =>
                      setEditRows((rows) =>
                        rows.map((r) => (r.id === row.id ? { ...r, q: e.target.value } : r)),
                      )
                    }
                  />
                  <select
                    className="select w-[8.5rem] shrink-0"
                    value={row.type}
                    onChange={(e) =>
                      setEditRows((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, type: e.target.value as QuestionType } : r,
                        ),
                      )
                    }
                  >
                    <option>Rating</option>
                    <option>Text</option>
                    <option>Multiple choice</option>
                  </select>
                  <button
                    type="button"
                    className="btn-icon shrink-0"
                    title="Remove question"
                    onClick={() =>
                      setEditRows((rows) =>
                        rows.length > 1 ? rows.filter((r) => r.id !== row.id) : rows,
                      )
                    }
                  >
                    <Icon name="hgi-delete-02" size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-soft btn-sm mt-2"
              onClick={() => setEditRows((rows) => [...rows, makeRow('', 'Rating')])}
            >
              <Icon name="hgi-add-01" size={14} />
              Add question
            </button>
          </div>
        </div>
      </Panel>
    </>
  )
}
