import type { SurveyQuestionType } from '@/features/engagement/surveys.types'

/** The 0–10 scale a recommendation question is answered on. */
const MIN_NPS_SCORE = 0
const MAX_NPS_SCORE = 10

export const NPS_SCALE: readonly number[] = Array.from(
  { length: MAX_NPS_SCORE - MIN_NPS_SCORE + 1 },
  (_, index) => MIN_NPS_SCORE + index,
)

/** One answer as `POST /me/surveys/:eventId` takes it: one field, by type. */
export type AnswerBody =
  | { questionId: string; rating: number }
  | { questionId: string; score: number }
  | { questionId: string; choice: string }
  | { questionId: string; answerText: string }

/**
 * The one field each kind of question is answered in. The API refuses a value
 * in any other — a score sent as a rating would land in the average, not the
 * NPS.
 */
const TO_BODY: Record<
  SurveyQuestionType,
  (questionId: string, value: string) => AnswerBody
> = {
  rating: (questionId, value) => ({ questionId, rating: Number(value) }),
  nps: (questionId, value) => ({ questionId, score: Number(value) }),
  choice: (questionId, value) => ({ questionId, choice: value }),
  text: (questionId, value) => ({ questionId, answerText: value }),
}

/**
 * A question left blank is left out rather than sent empty: "they said
 * nothing" and "they wrote an empty string" are different. Nothing else is
 * decided here — which answers are required is the API's to say.
 */
export function toAnswerBody(
  questionId: string,
  type: SurveyQuestionType,
  raw: string,
): AnswerBody | null {
  const value = raw.trim()
  return value ? TO_BODY[type](questionId, value) : null
}
