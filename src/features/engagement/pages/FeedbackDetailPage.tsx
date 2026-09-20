import { useState } from 'react'
import { Link, useFetcher, useLoaderData } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import {
  Badge,
  Button,
  Card,
  HeaderUser,
  Icon,
  Input,
  Label,
  Modal,
  PageFooter,
  PageHeader,
  Panel,
  PanelEmptyPreview,
  Select,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { bangkokDate, MASKED } from '@/lib/format'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters } from '@/lib/useFilters'
import { nextStatus, type SurveyCard } from '../surveys.mapper'
import type { SurveyQuestionType } from '../surveys.types'
import type { FeedbackDetailData } from '../surveys.routes'

/**
 * One event's feedback (US-MSG-08/09). Ported from
 * `eventa-ui-kit/admin/feedback-detail.html`.
 *
 * The surveys half is real: write one, edit it, make it live, close it, reopen
 * it, duplicate it, delete it.
 *
 * So is the reading half: the rating breakdown and the individual responses
 * are what attendees actually sent from the portal. Clicking a bar filters the
 * list to that score (US-MSG-10).
 *
 * The average reads "—" rather than "0.0" before anybody rates anything.
 * Nought out of five is a verdict about how attendees felt; this is the
 * absence of one.
 */
export default function FeedbackDetailPage() {
  const data = useLoaderData() as FeedbackDetailData
  const editor = useDisclosure()
  const { set } = useFilters()
  const [editing, setEditing] = useState<SurveyCard | null>(null)

  const open = (survey: SurveyCard | null) => {
    setEditing(survey)
    editor.onOpen()
  }

  if (!data.event) {
    return (
      <>
        <PageHeader title="Feedback" actions={<HeaderUser />} />
        <Card className="p-4">
          <PanelEmptyPreview
            preview="events"
            description="This link does not point at an event in your workspace. It may have been deleted."
            action={{ label: 'Back to feedback', to: '/admin/feedback', icon: 'hgi-arrow-left-01' }}
          >
            Event not found.
          </PanelEmptyPreview>
        </Card>
        <PageFooter />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={data.event.name}
        subtitle="Surveys for this event."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={() => open(null)}>
              <Icon name="hgi-add-01" />
              <span className="hidden sm:inline">New survey</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      <Link
        to="/admin/feedback"
        className="mb-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
      >
        <Icon name="hgi-arrow-left-01" size={13} />
        All events
      </Link>

      <Card className="p-4">
        <h2 className="text-[15px] font-bold tracking-tight">Surveys</h2>
        <p className="mt-0.5 text-[12px] text-muted">
          A draft asks nobody anything. Only a live survey collects.
        </p>

        {data.surveys.length ? (
          <div className="mt-2 divide-y divide-line">
            {data.surveys.map((survey) => (
              <SurveyRow key={survey.id} survey={survey} onEdit={() => open(survey)} />
            ))}
          </div>
        ) : (
          <PanelEmptyPreview
            preview="meetings"
            description="Write the questions you want attendees to answer about this event, then make the survey live."
            action={{ label: 'New survey', icon: 'hgi-add-01', onClick: () => open(null) }}
          >
            No surveys yet.
          </PanelEmptyPreview>
        )}
      </Card>

      <Card className="mt-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-bold tracking-tight">Overall satisfaction</h2>
          <p className="text-[12px] text-muted">
            <span className="text-[20px] font-extrabold tracking-tight text-ink tnum">
              {data.summary.average ?? MASKED}
            </span>{' '}
            from{' '}
            <span className="font-semibold text-ink tnum">
              {data.summary.responses}
            </span>{' '}
            {data.summary.responses === 1 ? 'response' : 'responses'}
          </p>
        </div>

        {data.summary.responses === 0 ? (
          <PanelEmptyPreview
            preview="bars"
            description="Once attendees answer a live survey, their scores break down here."
          >
            Nobody has answered yet.
          </PanelEmptyPreview>
        ) : (
          <div className="mt-3 space-y-2">
            {data.summary.bars.map((bar) => (
              <button
                key={bar.stars}
                type="button"
                onClick={() =>
                  set({
                    rating: data.rating === String(bar.stars) ? null : String(bar.stars),
                  })
                }
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-line/50',
                  data.rating === String(bar.stars) && 'bg-brand-soft/60',
                )}
                aria-pressed={data.rating === String(bar.stars)}
              >
                <span className="w-8 shrink-0 text-[12px] font-semibold text-muted tnum">
                  {bar.stars}★
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-amber-400"
                    style={{ width: `${bar.percent}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-[12px] text-muted tnum">
                  {bar.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold tracking-tight">Responses</h2>
          {data.rating && (
            <button
              type="button"
              onClick={() => set({ rating: null })}
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              Showing {data.rating}★ only — show all
            </button>
          )}
        </div>

        {data.responses.length ? (
          <div className="mt-2 divide-y divide-line">
            {data.responses.map((response) => (
              <div key={response.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-semibold text-ink">
                    {response.personName}
                  </p>
                  {response.rating !== null && (
                    <span className="text-[12px] font-semibold text-amber-500 tnum">
                      {response.rating}★
                    </span>
                  )}
                  <span className="text-[11px] text-muted">
                    {response.surveyTitle} · {bangkokDate(response.submittedAt)}
                  </span>
                </div>
                {response.comment && (
                  <p className="mt-1 text-[13px] text-muted">{response.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <PanelEmptyPreview
            preview="alerts"
            description={
              data.rating
                ? `Nobody gave this event ${data.rating} stars.`
                : 'What attendees write appears here, newest first.'
            }
            action={
              data.rating
                ? { label: 'Show all', icon: 'hgi-refresh', onClick: () => set({ rating: null }) }
                : undefined
            }
          >
            {data.rating ? 'No responses at that score.' : 'No responses yet.'}
          </PanelEmptyPreview>
        )}
      </Card>

      <PageFooter />

      <SurveyEditor
        open={editor.open}
        onClose={editor.onClose}
        eventId={data.event.id}
        survey={editing}
      />
    </>
  )
}

function SurveyRow({
  survey,
  onEdit,
}: {
  survey: SurveyCard
  onEdit: () => void
}) {
  const act = useFetcher<ActionResult>()
  const [confirming, setConfirming] = useState(false)
  const busy = act.state !== 'idle'
  const move = nextStatus(
    survey.status.label.toLowerCase() as 'draft' | 'live' | 'closed',
  )

  const submit = (fields: Record<string, string>) =>
    act.submit({ surveyId: survey.id, ...fields }, { method: 'post' })

  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      {/* `basis-full` below `sm` so the buttons wrap to their own line rather
          than squeezing the title down to an ellipsis — four controls need more
          room than a phone has beside a name. */}
      <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-ink">{survey.title}</p>
          <Badge tone={survey.status.tone}>{survey.status.label}</Badge>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted">{survey.meta}</p>
        {act.data?.ok === false && (
          <p role="alert" className="mt-1 text-[12px] text-red-500">
            {act.data.error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="soft" size="sm" disabled={busy} onClick={onEdit}>
          <Icon name="hgi-edit-02" size={14} />
          Edit
        </Button>
        <Button
          variant="soft"
          size="sm"
          disabled={busy}
          onClick={() => submit({ intent: 'status', status: move.status })}
        >
          {move.label}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => submit({ intent: 'duplicate' })}
        >
          <Icon name="hgi-copy-01" size={14} />
          <span className="sr-only">Duplicate</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          <Icon name="hgi-delete-02" size={14} />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Delete “${survey.title}”?`}
        footer={
          <>
            <Button variant="soft" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirming(false)
                submit({ intent: 'delete' })
              }}
            >
              Delete it
            </Button>
          </>
        }
      >
        Its questions go with it. This cannot be undone.
      </Modal>
    </div>
  )
}

interface DraftQuestion {
  type: SurveyQuestionType
  prompt: string
  options: string
}

const BLANK: DraftQuestion = { type: 'rating', prompt: '', options: '' }

const TYPES: { value: SurveyQuestionType; label: string }[] = [
  { value: 'rating', label: 'Rating' },
  { value: 'text', label: 'Free text' },
  { value: 'choice', label: 'Multiple choice' },
]

/**
 * The survey editor.
 *
 * It validates nothing. Whether a survey is answerable — a title, at least one
 * question, no blank prompts, at least two options on a choice — is a rule the
 * API owns and states in a sentence written for the reader, and a second copy
 * here would be one that could drift out of agreement with it.
 */
function SurveyEditor({
  open,
  onClose,
  eventId,
  survey,
}: {
  open: boolean
  onClose: () => void
  eventId: string
  survey: SurveyCard | null
}) {
  const save = useFetcher<ActionResult>()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<DraftQuestion[]>([BLANK])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  // Reset when the panel is opened on a different survey. Derived from props
  // during render rather than in an effect, so the fields are never briefly
  // showing the last survey's contents.
  const key = survey?.id ?? 'new'
  if (open && loadedFor !== key) {
    setLoadedFor(key)
    setTitle(survey?.title ?? '')
    setQuestions(
      survey?.questions.length
        ? survey.questions.map((question) => ({
            type: question.type,
            prompt: question.prompt,
            options: question.options.join(', '),
          }))
        : [BLANK],
    )
  }
  if (!open && loadedFor !== null) setLoadedFor(null)

  const saving = save.state !== 'idle'

  const setQuestion = (index: number, patch: Partial<DraftQuestion>) =>
    setQuestions((current) =>
      current.map((question, i) => (i === index ? { ...question, ...patch } : question)),
    )

  const submit = () => {
    const form = new FormData()
    form.set('intent', survey ? 'update' : 'create')
    if (survey) form.set('surveyId', survey.id)
    else form.set('eventId', eventId)
    form.set('title', title)
    for (const question of questions) {
      form.append('questionType', question.type)
      form.append('questionPrompt', question.prompt)
      form.append('questionOptions', question.options)
    }
    save.submit(form, { method: 'post' })
  }

  // The panel stays open until the API accepts it, so a refusal lands beside
  // the field it is about rather than behind a closed panel.
  if (save.state === 'idle' && save.data?.ok === true && open) onClose()

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={survey ? 'Edit survey' : 'New survey'}
      subtitle={survey ? undefined : 'It starts as a draft and asks nobody anything until you make it live.'}
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" disabled={saving} onClick={submit}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {save.data?.ok === false && (
          <p role="alert" className="text-[13px] text-red-500">
            {save.data.error}
          </p>
        )}

        <div>
          <Label>Survey title</Label>
          <Input
            type="text"
            maxLength={150}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Post-event feedback"
          />
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={index} className="rounded-xl border border-hair p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-muted">
                  Question {index + 1}
                </p>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions((current) => current.filter((_, i) => i !== index))
                    }
                    className="text-[12px] font-semibold text-muted hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-2">
                <Input
                  type="text"
                  maxLength={300}
                  value={question.prompt}
                  onChange={(event) => setQuestion(index, { prompt: event.target.value })}
                  placeholder="What do you want to ask?"
                />
                <Select
                  value={question.type}
                  onChange={(event) =>
                    setQuestion(index, {
                      type: event.target.value as SurveyQuestionType,
                    })
                  }
                  aria-label={`Question ${index + 1} type`}
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                {question.type === 'choice' && (
                  <Input
                    type="text"
                    value={question.options}
                    onChange={(event) => setQuestion(index, { options: event.target.value })}
                    placeholder="Options, separated by commas"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="soft"
          className="w-full"
          onClick={() => setQuestions((current) => [...current, { ...BLANK }])}
        >
          <Icon name="hgi-add-01" size={15} />
          Add question
        </Button>
      </div>
    </Panel>
  )
}
