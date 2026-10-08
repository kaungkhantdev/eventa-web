import { useEffect, useState } from 'react'
import { Link, useFetcher, useLoaderData } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useTheme } from '@/lib/useTheme'
import { NPS_SCALE } from '../survey.mapper'
import type {
  PortalSurveyData,
  SurveyQuestionView,
} from '../survey.routes'

/**
 * The survey an attendee is asked after an event (US-MSG-08), ported from
 * `portal/survey.html`.
 *
 * The kit's version asked three questions of its own invention. It now asks
 * whatever the ORGANIZER wrote — the shell, the banner, the stars and the
 * thank-you card are the port; the questions come from the API.
 *
 * A "how likely are you to recommend…" question is a 0–10 scale. The kit has
 * no such control, so it borrows the kit's radio-option tile (the choice
 * question's) laid out as eleven numbers. They are real radio buttons sharing
 * one name, so Tab reaches the group and the arrow keys move and choose; the
 * focus ring is drawn on the tile because the input itself is visually hidden.
 *
 * Signed in, and once. The API only offers a survey to somebody with a
 * confirmed registration for that event and refuses a second answer from the
 * same account, because a rating anyone holding the link could move is not
 * worth collecting.
 */

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
}

/** What the ends of the 0–10 scale mean, for whoever cannot see the anchors. */
const NPS_ENDS: Record<number, string> = {
  0: '0 — not at all likely',
  10: '10 — extremely likely',
}

export default function SurveyPage() {
  const data = useLoaderData() as PortalSurveyData
  const { dark, toggle } = useTheme()
  const send = useFetcher<ActionResult>()
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const sent = send.state === 'idle' && send.data?.ok === true
  const title = data.title ?? 'Feedback'

  useEffect(() => {
    document.title = `Eventa · ${title}`
  }, [title])

  const submit = () => {
    const form = new FormData()
    form.set('eventId', data.eventId)
    for (const question of data.questions) {
      form.append('questionId', question.id)
      form.append('questionType', question.type)
      form.append('answer', answers[question.id] ?? '')
    }
    send.submit(form, { method: 'post' })
  }

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <button
        type="button"
        onClick={toggle}
        className="btn-icon fixed right-4 top-4 z-10 bg-surface"
        title="Toggle theme"
      >
        <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={18} />
      </button>

      <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <Link to="/portal/discover" className="mx-auto mb-6 flex w-fit items-center gap-2.5">
          <span className="brand-logo text-brand h-[17px] w-[31px]" />
          <span className="text-[15px] font-extrabold tracking-tight">Eventa</span>
        </Link>

        {sent || data.answered ? (
          <ThankYou already={data.answered && !sent} />
        ) : data.questions.length === 0 ? (
          <Unavailable />
        ) : (
          <div className="card overflow-hidden">
            <div className="relative h-28 bg-gradient-to-br from-brand to-emerald-500">
              {/* No photograph: this page has no event payload to take a cover
                  from, and the slug-seeded stock image it showed belonged to
                  nobody. The gradient carries the banner on its own. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                  You attended
                </p>
                <h1 className="text-[18px] font-bold tracking-tight text-white">{title}</h1>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <h2 className="text-[17px] font-bold tracking-tight">How was it?</h2>
              <p className="mt-1 text-[13px] text-muted">
                Your feedback helps us make future events even better. Takes about a
                minute.
              </p>

              {/* The API's own sentence — it names the question it is about,
                  which is more use than anything this page could invent. */}
              {send.data?.ok === false && (
                <p role="alert" className="mt-4 text-[13px] text-red-500">
                  {send.data.error}
                </p>
              )}

              <div className="mt-6 space-y-7">
                {data.questions.map((question) => (
                  <Question
                    key={question.id}
                    question={question}
                    value={answers[question.id] ?? ''}
                    onChange={(value) =>
                      setAnswers((current) => ({ ...current, [question.id]: value }))
                    }
                  />
                ))}

                <button
                  type="button"
                  className="btn btn-primary w-full"
                  disabled={send.state !== 'idle'}
                  onClick={submit}
                >
                  <Icon name="hgi-sent" size={16} />
                  Submit feedback
                </button>
                <p className="text-center text-[11px] text-muted/80">
                  Your response is anonymous to other attendees.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-muted/70">
          Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
        </p>
      </main>
    </div>
  )
}

function Question({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestionView
  value: string
  onChange: (value: string) => void
}) {
  const promptId = `q-${question.id}-prompt`
  return (
    <div>
      <label id={promptId} className="block text-[13.5px] font-semibold text-ink">
        {question.prompt}
        {question.type !== 'text' && <span className="text-red-500"> *</span>}
      </label>

      {question.type === 'nps' && (
        <NpsScale
          name={`q-${question.id}`}
          labelledBy={promptId}
          value={value}
          onChange={onChange}
        />
      )}

      {question.type === 'rating' && (
        <Stars value={Number(value) || 0} onChange={(n) => onChange(String(n))} />
      )}

      {question.type === 'text' && (
        <textarea
          className="textarea mt-2.5"
          rows={4}
          maxLength={2000}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Anything you'd like to add…"
        />
      )}

      {question.type === 'choice' && (
        <div className="mt-2.5 space-y-2">
          {question.options.map((option) => (
            <label key={option} className="block cursor-pointer">
              <input
                type="radio"
                name={`q-${question.id}`}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                className="peer sr-only"
              />
              <span className="flex items-center gap-2 rounded-lg border border-hair px-3 py-2.5 text-[13px] text-ink transition hover:bg-line/60 peer-checked:border-brand peer-checked:bg-brand-soft/50">
                {option}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function NpsScale({
  name,
  labelledBy,
  value,
  onChange,
}: {
  name: string
  labelledBy: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset aria-labelledby={labelledBy} className="mt-2.5">
      {/* Six across on a phone: eleven in a row would leave targets ~23px wide. */}
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
        {NPS_SCALE.map((point) => (
          <label key={point} className="block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={point}
              checked={value === String(point)}
              onChange={() => onChange(String(point))}
              aria-label={NPS_ENDS[point]}
              className="peer sr-only"
            />
            <span className="flex h-10 items-center justify-center rounded-lg border border-hair text-[13px] font-semibold text-ink tnum transition hover:bg-line/60 peer-checked:border-brand peer-checked:bg-brand-soft/50 peer-checked:text-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15">
              {point}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted" aria-hidden="true">
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
    </fieldset>
  )
}

function Stars({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const [hover, setHover] = useState(0)
  const paint = hover || value

  return (
    <div
      className="mt-2.5 flex flex-wrap items-center gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="star-btn flex p-0.5 transition hover:scale-110"
          aria-label={n === 1 ? '1 star' : `${n} stars`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
        >
          <i
            className={cn(
              'hgi-stroke hgi-star text-[30px] transition-colors',
              n <= paint ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600',
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-[13px] font-semibold text-muted">
        {value > 0 ? `${value} · ${RATING_LABELS[value]}` : ''}
      </span>
    </div>
  )
}

function ThankYou({ already }: { already: boolean }) {
  return (
    <div className="card p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Icon name="hgi-checkmark-badge-01" size={30} />
      </span>
      <h2 className="mt-4 text-[19px] font-bold tracking-tight">
        {already ? 'You’ve already answered' : 'Thank you!'}
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-muted">
        {already
          ? 'Your feedback for this event is already recorded — everyone answers once, so the organizer gets one honest view rather than a repeated one.'
          : 'Your feedback has been recorded — it helps make future events even better.'}
      </p>
      <PortalLinks />
    </div>
  )
}

/**
 * No survey, and deliberately without saying which of the reasons it is.
 *
 * It could be that nothing is live, or that this account has no confirmed
 * registration for the event. Spelling out the second would tell whoever
 * followed the link whether a given person attended, which is not theirs to
 * learn from a page anyone can open.
 */
function Unavailable() {
  return (
    <div className="card p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-line text-muted">
        <Icon name="hgi-note-01" size={28} />
      </span>
      <h2 className="mt-4 text-[19px] font-bold tracking-tight">
        No survey to answer
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-muted">
        There’s no open survey here for your account. If you were sent a link,
        the organizer may have closed it since.
      </p>
      <PortalLinks />
    </div>
  )
}

function PortalLinks() {
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <Link to="/portal/my-events" className="btn btn-soft btn-sm">
        <Icon name="hgi-ticket-02" size={15} />
        Back to my events
      </Link>
      <Link to="/portal/discover" className="btn btn-soft btn-sm">
        <Icon name="hgi-search-01" size={15} />
        Discover events
      </Link>
    </div>
  )
}
