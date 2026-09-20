import type { BadgeTone } from '@/components/ui'
import { bangkokDate } from '@/lib/format'
import type { SurveyStatus, SurveyWire } from './surveys.types'

/**
 * A survey, as the organizer's list shows it (US-MSG-09).
 *
 * `responses` is null, everywhere, deliberately. Nothing in the product can
 * collect an answer yet — the portal's survey page saves nothing — so a "0"
 * would read as a measurement that came back empty rather than as a question
 * nobody has been asked. Those are different facts, and this is the second one.
 */

export interface SurveyCard {
  id: string
  title: string
  /** "2 questions · Created Jul 9, 2026" */
  meta: string
  status: { label: string; tone: BadgeTone }
  /** Whether it is taking answers right now — only a live survey is. */
  collecting: boolean
  /** Null until responses exist at all. Never 0. */
  responses: number | null
  questions: SurveyWire['questions']
}

const STATUS: Record<SurveyStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'gray' },
  live: { label: 'Live', tone: 'green' },
  closed: { label: 'Closed', tone: 'amber' },
}

export function toSurveyCard(wire: SurveyWire): SurveyCard {
  const count = wire.questions.length
  return {
    id: wire.id,
    title: wire.title,
    meta: `${count} ${count === 1 ? 'question' : 'questions'} · Created ${bangkokDate(wire.createdAt)}`,
    status: STATUS[wire.status],
    collecting: wire.status === 'live',
    responses: null,
    questions: wire.questions,
  }
}

/**
 * The single move a survey offers from where it is.
 *
 * One button rather than a menu of three, because from any given state only
 * one of them is legal — the API refuses the rest, and offering a control that
 * will be refused is a control that lies.
 */
export function nextStatus(status: SurveyStatus): {
  status: SurveyStatus
  label: string
} {
  if (status === 'draft') return { status: 'live', label: 'Make live' }
  if (status === 'live') return { status: 'closed', label: 'Close' }
  return { status: 'live', label: 'Reopen' }
}

export interface SurveySummary {
  total: number
  live: number
  draft: number
  closed: number
}

/** What an event's card says about its surveys. */
export function summarise(surveys: SurveyWire[]): SurveySummary {
  return {
    total: surveys.length,
    live: surveys.filter((s) => s.status === 'live').length,
    draft: surveys.filter((s) => s.status === 'draft').length,
    closed: surveys.filter((s) => s.status === 'closed').length,
  }
}

export interface RatingBar {
  stars: number
  count: number
  /** Share of the ratings given, for the bar's width. */
  percent: number
}

export interface FeedbackSummary {
  responses: number
  /** "4.3", or null when nobody has rated anything. Never "0.0". */
  average: string | null
  bars: RatingBar[]
}

export interface SummaryWire {
  responses: number
  average: number | null
  distribution: Record<string, number>
}

/**
 * The rating breakdown, five stars down to one (US-MSG-08).
 *
 * Percentages are of the ratings GIVEN, not of the responses: a survey whose
 * rating question somebody skipped would otherwise draw bars that never reach
 * 100% and look like a rendering fault.
 */
export function toFeedbackSummary(wire: SummaryWire): FeedbackSummary {
  const counts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: wire.distribution[String(stars)] ?? 0,
  }))
  const rated = counts.reduce((sum, row) => sum + row.count, 0)

  return {
    responses: wire.responses,
    average: wire.average === null ? null : wire.average.toFixed(1),
    bars: counts.map((row) => ({
      ...row,
      percent: rated === 0 ? 0 : Math.round((row.count / rated) * 100),
    })),
  }
}
