import { describe, expect, it } from 'vitest'
import {
  nextStatus,
  summarise,
  toFeedbackSummary,
  toSurveyCard,
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

describe('the rating breakdown (US-MSG-08)', () => {
  const wire = { responses: 4, average: 4.25, distribution: { 5: 2, 4: 1, 3: 1 } }

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

  it('has no average, and no bars, before anybody rates anything', () => {
    // Not "0.0" — nought out of five is a verdict, and this is its absence.
    const summary = toFeedbackSummary({ responses: 0, average: null, distribution: {} })
    expect(summary.average).toBeNull()
    expect(summary.bars.every((bar) => bar.percent === 0)).toBe(true)
  })
})
