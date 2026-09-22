import { attendeeAction, attendeeData, queryOf, type LoaderArgs } from '@/app/loaders'
import { api } from '@/lib/api'
import type { SurveyQuestionType } from '@/features/engagement/surveys.types'
import { toAnswerBody, type AnswerBody } from './survey.mapper'

/**
 * The survey an attendee is asked after an event (US-MSG-08).
 *
 * Signed in, because the API only offers a survey to somebody with a confirmed
 * registration and only accepts one answer from each of them. An anonymous
 * form would let anyone holding the link move an event's rating.
 */

export interface SurveyQuestionView {
  id: string
  type: SurveyQuestionType
  prompt: string
  options: string[]
}

interface MySurveyWire {
  surveyId: string | null
  title: string | null
  answered: boolean
  questions: SurveyQuestionView[]
}

export interface PortalSurveyData {
  eventId: string
  /** Null when there is no live survey, or this person did not attend. */
  title: string | null
  questions: SurveyQuestionView[]
  answered: boolean
}

const surveyApi = {
  mine: (eventId: string) => api.get<MySurveyWire>(`/me/surveys/${eventId}`),
  submit: (eventId: string, answers: AnswerBody[]) =>
    api.post(`/me/surveys/${eventId}`, { answers }),
}

async function loadSurvey({ request }: LoaderArgs): Promise<PortalSurveyData> {
  const eventId = queryOf(request).get('event') ?? ''
  if (!eventId) {
    return { eventId, title: null, questions: [], answered: false }
  }
  const mine = await surveyApi.mine(eventId)
  return {
    eventId,
    title: mine.title,
    questions: mine.questions,
    answered: mine.answered,
  }
}

/**
 * The answers go up as they were given. Which of them are required, and
 * whether a choice was one of the options, is the API's to say — a second copy
 * of those rules here would be one that could drift.
 */
async function submitSurvey({ request }: LoaderArgs): Promise<null> {
  const form = await request.formData()
  const eventId = String(form.get('eventId') ?? '')

  const types = form.getAll('questionType').map(String)
  const values = form.getAll('answer').map(String)
  const answers = form
    .getAll('questionId')
    .map(String)
    .map((questionId, index) =>
      toAnswerBody(
        questionId,
        types[index] as SurveyQuestionType,
        values[index] ?? '',
      ),
    )
    .filter((answer): answer is AnswerBody => answer !== null)

  await surveyApi.submit(eventId, answers)
  return null
}

export const portalSurveyRoute = {
  loader: attendeeData(loadSurvey),
  action: attendeeAction(submitSurvey),
}
