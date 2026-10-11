/**
 * What `/surveys` returns (US-MSG-09).
 *
 * Authoring only. Responses are US-MSG-08/10 and arrive from the attendee
 * portal, whose survey page still asks its own fixed questions and saves
 * nothing — so nothing here carries a response
 * count, rather than carrying a zero that could mean either "none yet" or "we
 * have no way of knowing".
 */

/** `draft` collects nothing. `closed` can be reopened. */
export type SurveyStatus = 'draft' | 'live' | 'closed'

/** `nps` is a 0–10 "how likely are you to recommend…"; like a rating, no options. */
export type SurveyQuestionType = 'rating' | 'text' | 'choice' | 'nps'

export interface SurveyQuestionWire {
  id: string
  type: SurveyQuestionType
  prompt: string
  /** Only a `choice` question has these, and it needs at least two. */
  options: string[]
}

export interface SurveyWire {
  id: string
  eventId: string
  title: string
  status: SurveyStatus
  questions: SurveyQuestionWire[]
  createdAt: string
  /**
   * The optimistic lock, sent back on save.
   *
   * Authoring replaces the whole question set, so a save built on a stale read
   * did not overwrite a title — it deleted the other editor's question. The API
   * refuses a save carrying a version somebody has moved past, with a 409 whose
   * message says to reload.
   */
  version: number
}
