import { describe, expect, it } from 'vitest'
import { NPS_SCALE, toAnswerBody } from './survey.mapper'

describe('an answer, as the API takes it (US-MSG-08)', () => {
  it('sends a recommendation as a score', () => {
    expect(toAnswerBody('q1', 'nps', '9')).toEqual({ questionId: 'q1', score: 9 })
  })

  it('keeps a 0 — the harshest answer, not a missing one', () => {
    expect(toAnswerBody('q1', 'nps', '0')).toEqual({ questionId: 'q1', score: 0 })
  })

  it('leaves out a question left blank', () => {
    // "They said nothing" and "they sent an empty string" are different.
    expect(toAnswerBody('q1', 'nps', '')).toBeNull()
    expect(toAnswerBody('q2', 'text', '   ')).toBeNull()
  })

  it('sends a star rating as a rating', () => {
    expect(toAnswerBody('q2', 'rating', '4')).toEqual({ questionId: 'q2', rating: 4 })
  })

  it('sends a choice as the option chosen', () => {
    expect(toAnswerBody('q3', 'choice', 'Panel')).toEqual({
      questionId: 'q3',
      choice: 'Panel',
    })
  })

  it('sends free text trimmed', () => {
    expect(toAnswerBody('q4', 'text', '  Loved it ')).toEqual({
      questionId: 'q4',
      answerText: 'Loved it',
    })
  })
})

describe('the recommendation scale', () => {
  it('runs 0 to 10, eleven points', () => {
    expect(NPS_SCALE).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})
