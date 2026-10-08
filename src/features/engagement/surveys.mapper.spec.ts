import { describe, expect, it } from 'vitest'
import {
  formatNps,
  nextStatus,
  summarise,
  toFeedbackSummary,
  toNpsView,
  toSurveyCard,
  type NpsWire,
} from './surveys.mapper'
import type { SurveyWire } from './surveys.types'

const wire = (over: Partial<SurveyWire> = {}): SurveyWire => ({
  id: '1',
  eventId: 'e-1',
  title: 'Post-event feedback',
  status: 'draft',
  questions: [
    { id: 'q1', type: 'rating', prompt: 'How was it?', options: [] },
    { id: 'q2', type: 'choice', prompt: 'Best bit?', options: ['A', 'B'] },
  ],
  createdAt: '2026-07-09T03:00:00.000Z',
  ...over,
})

describe('a survey card', () => {
  it('counts what it asks', () => {
    expect(toSurveyCard(wire()).meta).toBe('2 questions · Created Jul 9, 2026')
  })

  it('says one question, not 1 questions', () => {
    const one = wire({ questions: [wire().questions[0]] })
    expect(toSurveyCard(one).meta).toContain('1 question ·')
  })

  it('shows a draft as collecting nothing', () => {
    // The distinction an organizer needs: this is written but not asking.
    const card = toSurveyCard(wire({ status: 'draft' }))
    expect(card.status.label).toBe('Draft')
    expect(card.collecting).toBe(false)
  })

  it('shows a live survey as the only one that is collecting', () => {
    expect(toSurveyCard(wire({ status: 'live' })).collecting).toBe(true)
    expect(toSurveyCard(wire({ status: 'closed' })).collecting).toBe(false)
  })

  it('reports no responses rather than nought of them', () => {
    // Nothing can collect a response yet. A "0 responses" would read as a
    // measurement; this is the absence of one.
    expect(toSurveyCard(wire()).responses).toBeNull()
  })
})

describe('the one move a survey offers', () => {
  it('opens a draft for answering', () => {
    expect(nextStatus('draft')).toEqual({ status: 'live', label: 'Make live' })
  })

  it('closes a live one', () => {
    expect(nextStatus('live')).toEqual({ status: 'closed', label: 'Close' })
  })

  it('reopens a closed one', () => {
    expect(nextStatus('closed')).toEqual({ status: 'live', label: 'Reopen' })
  })
})

describe('an event’s surveys, summarised', () => {
  it('counts them by what they are doing', () => {
    const summary = summarise([
      wire({ status: 'live' }),
      wire({ status: 'live' }),
      wire({ status: 'draft' }),
      wire({ status: 'closed' }),
    ])
    expect(summary).toEqual({ total: 4, live: 2, draft: 1, closed: 1 })
  })

  it('counts nothing as nothing', () => {
    expect(summarise([])).toEqual({ total: 0, live: 0, draft: 0, closed: 0 })
  })
})

/** Nobody has answered a recommendation question. */
const NO_NPS: NpsWire = {
  score: null,
  answers: 0,
  promoters: 0,
  passives: 0,
  detractors: 0,
}

describe('the rating breakdown (US-MSG-08)', () => {
  const wire = {
    responses: 4,
    average: 4.25,
    distribution: { 5: 2, 4: 1, 3: 1 },
    asked: 20,
    completionRate: 20,
    nps: NO_NPS,
  }

  it('runs five stars down to one', () => {
    expect(toFeedbackSummary(wire).bars.map((b) => b.stars)).toEqual([5, 4, 3, 2, 1])
  })

  it('shares the bars out of the ratings GIVEN', () => {
    // Four ratings: two fives is half of them.
    const bars = toFeedbackSummary(wire).bars
    expect(bars[0]).toMatchObject({ stars: 5, count: 2, percent: 50 })
    expect(bars.find((b) => b.stars === 1)).toMatchObject({ count: 0, percent: 0 })
  })

  it('rounds the average to one place', () => {
    expect(toFeedbackSummary(wire).average).toBe('4.3')
  })

  it('counts the star ratings the average is taken over', () => {
    expect(toFeedbackSummary(wire).ratings).toBe(4)
  })

  it('keeps the people who answered apart from the stars they gave', () => {
    // A survey asking only the recommendation question: ten people answered,
    // nobody gave a star. "Nobody has answered" would be false.
    const npsOnly = toFeedbackSummary({ ...wire, responses: 10, average: null, distribution: {} })
    expect(npsOnly.responses).toBe(10)
    expect(npsOnly.ratings).toBe(0)

    // Two star questions: two people, four ratings.
    const twoStars = toFeedbackSummary({ ...wire, responses: 2, average: 4, distribution: { 4: 4 } })
    expect(twoStars.responses).toBe(2)
    expect(twoStars.ratings).toBe(4)
  })

  it('has no average, and no bars, before anybody rates anything', () => {
    // Not "0.0" — nought out of five is a verdict, and this is its absence.
    const summary = toFeedbackSummary({
      responses: 0,
      average: null,
      distribution: {},
      asked: 0,
      completionRate: null,
      nps: NO_NPS,
    })
    expect(summary.average).toBeNull()
    expect(summary.bars.every((bar) => bar.percent === 0)).toBe(true)
  })
})

describe('the completion rate (US-MSG-08)', () => {
  const wire = { responses: 9, average: 4.1, distribution: { 4: 9 }, nps: NO_NPS }

  it('reads the completion rate as a whole percentage', () => {
    // Already out of a hundred from the API — not a ratio to multiply.
    const summary = toFeedbackSummary({ ...wire, asked: 20, completionRate: 45 })
    expect(summary.completion).toBe('45%')
  })

  it('has no completion rate when nobody was asked — not 0%', () => {
    // The thank-you was off, or never went. Nobody ignoring it is not the fact.
    const summary = toFeedbackSummary({ ...wire, asked: 0, completionRate: null })
    expect(summary.completion).toBeNull()
  })

  it('shows a measured zero as 0%', () => {
    // Everybody asked, nobody answered: a real result, and worth seeing.
    const summary = toFeedbackSummary({ ...wire, asked: 10, completionRate: 0 })
    expect(summary.completion).toBe('0%')
  })
})

describe('the NPS (US-MSG-08)', () => {
  it('signs a positive score, as the kit does', () => {
    expect(formatNps(25)).toBe('+25')
  })

  it('shows a balanced room as a plain 0', () => {
    // Not "+0", and not the dash: nought is a real score.
    expect(formatNps(0)).toBe('0')
  })

  it('shows a negative score with its minus', () => {
    expect(formatNps(-40)).toBe('-40')
  })

  it('has no score when nobody answered', () => {
    expect(formatNps(null)).toBeNull()
  })

  it('splits the answers into promoters, passives and detractors, in that order', () => {
    const view = toNpsView({
      score: 25,
      answers: 4,
      promoters: 2,
      passives: 1,
      detractors: 1,
    })
    expect(view.score).toBe('+25')
    expect(view.answers).toBe(4)
    expect(view.split).toEqual([
      { key: 'promoters', label: 'Promoters', range: '9–10', count: 2, percent: 50 },
      { key: 'passives', label: 'Passives', range: '7–8', count: 1, percent: 25 },
      { key: 'detractors', label: 'Detractors', range: '0–6', count: 1, percent: 25 },
    ])
  })

  it('draws empty bars, not broken ones, before anybody answers', () => {
    const view = toNpsView(NO_NPS)
    expect(view.score).toBeNull()
    expect(view.split.map((group) => group.percent)).toEqual([0, 0, 0])
  })

  it('arrives with the rest of the feedback summary', () => {
    const summary = toFeedbackSummary({
      responses: 4,
      average: 5,
      distribution: { 5: 4 },
      asked: 0,
      completionRate: null,
      nps: { score: -50, answers: 2, promoters: 0, passives: 1, detractors: 1 },
    })
    expect(summary.nps.score).toBe('-50')
    expect(summary.nps.answers).toBe(2)
  })
})
