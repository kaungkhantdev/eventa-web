import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { eventOptions, type EventOption } from '@/features/events/eventOptions'
import { api } from '@/lib/api'
import {
  summarise,
  toFeedbackSummary,
  toSurveyCard,
  type FeedbackSummary,
  type SurveyCard,
  type SurveySummary,
  type SummaryWire,
} from './surveys.mapper'
import type { SurveyQuestionType, SurveyStatus, SurveyWire } from './surveys.types'

/** Feedback surveys (US-MSG-09). Authoring only — see `surveys.types`. */

interface QuestionInput {
  type: SurveyQuestionType
  prompt: string
  options: string[]
}

const surveysApi = {
  list: (eventId?: string) =>
    api.get<SurveyWire[]>('/surveys', { query: eventId ? { eventId } : {} }),
  create: (body: { eventId: string; title: string; questions: QuestionInput[] }) =>
    api.post<SurveyWire>('/surveys', body),
  update: (id: string, body: { title: string; questions: QuestionInput[] }) =>
    api.patch<SurveyWire>(`/surveys/${id}`, body),
  setStatus: (id: string, status: SurveyStatus) =>
    api.patch<SurveyWire>(`/surveys/${id}/status`, { status }),
  duplicate: (id: string) => api.post<SurveyWire>(`/surveys/${id}/duplicate`),
  remove: (id: string) => api.delete(`/surveys/${id}`),
  summary: (eventId?: string) =>
    api.get<SummaryWire>('/surveys/summary', {
      query: eventId ? { eventId } : {},
    }),
  counts: () =>
    api.get<{ eventId: string; responses: number }[]>('/surveys/counts'),
  responses: (eventId: string, rating?: string) =>
    api.get<ResponseWire[]>('/surveys/responses', {
      query: rating ? { eventId, rating } : { eventId },
    }),
}

interface ResponseWire {
  id: string
  surveyTitle: string
  personName: string
  rating: number | null
  comment: string | null
  submittedAt: string
}

export interface FeedbackEventCard {
  id: string
  name: string
  date: string
  surveys: SurveySummary
  /** How many people have answered. Zero is a real count here. */
  responses: number
}

export interface FeedbackData {
  events: FeedbackEventCard[]
  totals: SurveySummary
  summary: FeedbackSummary
}

async function loadFeedback(): Promise<FeedbackData> {
  const [surveys, events, summary, counts] = await Promise.all([
    surveysApi.list(),
    eventOptions(),
    surveysApi.summary(),
    surveysApi.counts(),
  ])
  const responsesByEvent = new Map(
    counts.map((row) => [row.eventId, row.responses]),
  )

  return {
    summary: toFeedbackSummary(summary),
    // Every event gets a card, including those with no surveys — "nobody has
    // asked about this one" is the thing an organizer most needs to see.
    events: events.map((event) => ({
      id: event.id,
      name: event.name,
      date: event.date ?? '',
      surveys: summarise(surveys.filter((s) => s.eventId === event.id)),
      responses: responsesByEvent.get(event.id) ?? 0,
    })),
    totals: summarise(surveys),
  }
}

export interface ResponseRow {
  id: string
  surveyTitle: string
  personName: string
  rating: number | null
  comment: string | null
  submittedAt: string
}

export interface FeedbackDetailData {
  event: EventOption | null
  surveys: SurveyCard[]
  summary: FeedbackSummary
  responses: ResponseRow[]
  /** The star filter in the address bar, when one is set. */
  rating: string | null
}

async function loadFeedbackDetail({
  request,
}: LoaderArgs): Promise<FeedbackDetailData> {
  const params = queryOf(request)
  const eventId = params.get('event') ?? ''
  const rating = params.get('rating')

  const [surveys, events, summary, responses] = await Promise.all([
    eventId ? surveysApi.list(eventId) : Promise.resolve([]),
    eventOptions(),
    eventId
      ? surveysApi.summary(eventId)
      : Promise.resolve({
          responses: 0,
          average: null,
          distribution: {},
          asked: 0,
          completionRate: null,
        }),
    eventId ? surveysApi.responses(eventId, rating ?? undefined) : Promise.resolve([]),
  ])

  return {
    event: events.find((event) => event.id === eventId) ?? null,
    surveys: surveys.map(toSurveyCard),
    summary: toFeedbackSummary(summary),
    responses,
    rating,
  }
}

/**
 * Every write answers with the survey as it now stands, but nothing is returned
 * to the page: the loader revalidates, so the list comes back from the API
 * rather than from a local copy that could disagree with it.
 */
async function runSurveysAction({ request }: LoaderArgs): Promise<null> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')
  const id = String(form.get('surveyId') ?? '')

  if (intent === 'status') {
    await surveysApi.setStatus(id, String(form.get('status')) as SurveyStatus)
    return null
  }
  if (intent === 'duplicate') {
    await surveysApi.duplicate(id)
    return null
  }
  if (intent === 'delete') {
    await surveysApi.remove(id)
    return null
  }

  const body = {
    title: String(form.get('title') ?? '').trim(),
    questions: questionsOf(form),
  }
  if (intent === 'create') {
    await surveysApi.create({ eventId: String(form.get('eventId')), ...body })
    return null
  }
  await surveysApi.update(id, body)
  return null
}

/**
 * The editor submits questions as three parallel lists, which is what a form
 * can carry. Options arrive as one comma-separated field per question — the
 * API is what decides whether that makes a valid choice.
 */
function questionsOf(form: FormData): QuestionInput[] {
  const types = form.getAll('questionType').map(String)
  const prompts = form.getAll('questionPrompt').map(String)
  const options = form.getAll('questionOptions').map(String)

  return types.map((type, index) => ({
    type: type as SurveyQuestionType,
    prompt: (prompts[index] ?? '').trim(),
    options:
      type === 'choice'
        ? (options[index] ?? '')
            .split(',')
            .map((option) => option.trim())
            .filter(Boolean)
        : [],
  }))
}

export const feedbackRoute = { loader: pageData(loadFeedback) }
export const feedbackDetailRoute = {
  loader: pageData(loadFeedbackDetail),
  action: pageAction(runSurveysAction),
}
