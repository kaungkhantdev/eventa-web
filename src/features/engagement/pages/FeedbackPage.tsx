import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button, HeaderUser, Icon, PageFooter, PageHeader, Panel } from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { num } from '@/lib/format'
import { FEEDBACK_EVENTS, portfolio, type QuestionType } from '../data/feedback'
import { Stars } from '../components/Stars'
import { StatusBadge } from '../components/StatusBadge'

/* ---------- Feedback & Surveys — admin/feedback.html ----------
   Portfolio KPI tiles over all events, a searchable grid of event cards each
   linking to its feedback detail, and a "New survey" slide-over with a small
   add/remove question builder. */

type NewQRow = {
  id: number
  text: string
  placeholder: string
  type: QuestionType
  options: QuestionType[]
}

const ALL_TYPES: QuestionType[] = ['Rating', 'Text', 'Multiple choice']

const INITIAL_QUESTIONS: NewQRow[] = [
  {
    id: 1,
    text: '',
    placeholder: 'How would you rate the event overall?',
    type: 'Rating',
    options: ['Rating', 'Text', 'Multiple choice'],
  },
  {
    id: 2,
    text: '',
    placeholder: 'What did you enjoy most?',
    type: 'Text',
    options: ['Text', 'Rating', 'Multiple choice'],
  },
]

export default function FeedbackPage() {
  const panel = useDisclosure()
  const [query, setQuery] = useState('')

  // Portfolio KPIs (response-weighted NPS + completion, ported from the script).
  const { responses, avg, nps, completion } = useMemo(() => {
    const p = portfolio()
    const withVals = FEEDBACK_EVENTS.filter((e) => e.responses && e.nps != null)
    const wResp = withVals.reduce((s, e) => s + e.responses, 0) || 1
    return {
      responses: p.responses,
      avg: p.avg,
      nps: Math.round(withVals.reduce((s, e) => s + (e.nps as number) * e.responses, 0) / wResp),
      completion: Math.round(
        withVals.reduce((s, e) => s + (e.completion as number) * e.responses, 0) / wResp,
      ),
    }
  }, [])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FEEDBACK_EVENTS.filter((e) => !q || e.name.toLowerCase().indexOf(q) !== -1)
  }, [query])

  // New-survey question builder state.
  const [questions, setQuestions] = useState<NewQRow[]>(INITIAL_QUESTIONS)
  const [nextId, setNextId] = useState(INITIAL_QUESTIONS.length + 1)

  const addQuestion = () => {
    setQuestions((rows) => [
      ...rows,
      { id: nextId, text: '', placeholder: 'New question…', type: 'Rating', options: ALL_TYPES },
    ])
    setNextId((n) => n + 1)
  }
  const removeQuestion = (id: number) =>
    setQuestions((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows))

  return (
    <>
      <PageHeader
        title="Feedback & Surveys"
        subtitle="Attendee feedback, organized by event."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={panel.onOpen}>
              <Icon name="hgi-add-01" size={16} />
              <span className="hidden sm:inline">New survey</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* portfolio stat cards (all events) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-message-01" size={16} />
            Responses
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">{num(responses)}</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <Icon name="hgi-arrow-up-right-01" size={13} />
              9,4 %
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-star" size={16} className="text-amber-400" />
            Avg rating
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">{avg.toFixed(1)}</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <Icon name="hgi-arrow-up-right-01" size={13} />
              0,2
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-analytics-up" size={16} />
            NPS
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">+{nps}</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <Icon name="hgi-arrow-up-right-01" size={13} />5
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Icon name="hgi-checkmark-badge-01" size={16} />
            Completion rate
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">{completion} %</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-red-500">
              <Icon name="hgi-arrow-down-right-01" size={13} />
              1,2 %
            </span>
          </div>
        </div>
      </div>

      {/* feedback by event */}
      <section className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Feedback by event</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Pick an event to see its surveys &amp; responses.
            </p>
          </div>
          <div className="relative w-44 shrink-0 sm:w-56">
            <i
              aria-hidden="true"
              className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
              placeholder="Search events…"
            />
          </div>
        </div>

        {list.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((e) => {
              const meta = `${e.date} · ${e.surveys.length} ${
                e.surveys.length === 1 ? 'survey' : 'surveys'
              }`
              return (
                <Link
                  key={e.slug}
                  to={`/admin/feedback-detail?event=${encodeURIComponent(e.slug)}`}
                  className="card group flex flex-col p-4 transition hover:ring-2 hover:ring-brand/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-ink">{e.name}</p>
                      <p className="mt-0.5 text-[12px] text-muted">{meta}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                  {e.responses && e.avg != null ? (
                    <>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[26px] font-extrabold leading-none tnum">
                              {e.avg.toFixed(1)}
                            </span>
                            <div className="flex">
                              <Stars avg={e.avg} size={14} />
                            </div>
                          </div>
                          <p className="mt-1 text-[11px] text-muted tnum">
                            {num(e.responses)} responses
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold text-brand opacity-0 transition group-hover:opacity-100">
                          View
                          <Icon name="hgi-arrow-right-01" size={14} />
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-line">
                        <div
                          className="h-1.5 rounded-full bg-amber-400"
                          style={{ width: `${((e.avg / 5) * 100).toFixed(0)}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <span className="text-[13px] font-medium text-muted">No responses yet</span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold text-brand opacity-0 transition group-hover:opacity-100">
                        Open
                        <Icon name="hgi-arrow-right-01" size={14} />
                      </span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
              <Icon name="hgi-search-01" size={22} />
            </div>
            <p className="mt-3 text-[14px] font-semibold text-ink">No events match your search</p>
            <p className="mt-1 text-[12px] text-muted">Try a different name.</p>
          </div>
        )}
      </section>

      <PageFooter />

      {/* New survey panel */}
      <Panel
        open={panel.open}
        onClose={panel.onClose}
        title="New survey"
        footer={
          <>
            <button className="btn btn-soft flex-1" onClick={panel.onClose}>
              Cancel
            </button>
            <button className="btn btn-primary flex-1" onClick={panel.onClose}>
              Save survey
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Survey title</label>
            <input type="text" className="input" placeholder="e.g. Post-event Experience" />
          </div>
          <div>
            <label className="label">Event</label>
            <select className="select" defaultValue={FEEDBACK_EVENTS[0].name}>
              {FEEDBACK_EVENTS.map((e) => (
                <option key={e.slug}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="border-t border-hair pt-4">
            <div className="flex items-center justify-between">
              <label className="label !mb-0">Questions</label>
            </div>
            <div className="mt-2 space-y-2">
              {questions.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder={row.placeholder}
                    value={row.text}
                    onChange={(e) =>
                      setQuestions((rows) =>
                        rows.map((r) => (r.id === row.id ? { ...r, text: e.target.value } : r)),
                      )
                    }
                  />
                  <select
                    className="select w-[8.5rem] shrink-0"
                    value={row.type}
                    onChange={(e) =>
                      setQuestions((rows) =>
                        rows.map((r) =>
                          r.id === row.id ? { ...r, type: e.target.value as QuestionType } : r,
                        ),
                      )
                    }
                  >
                    {row.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-icon shrink-0"
                    title="Remove question"
                    onClick={() => removeQuestion(row.id)}
                  >
                    <Icon name="hgi-delete-02" size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-soft btn-sm mt-2" onClick={addQuestion}>
              <Icon name="hgi-add-01" size={14} />
              Add question
            </button>
          </div>
        </div>
      </Panel>
    </>
  )
}
