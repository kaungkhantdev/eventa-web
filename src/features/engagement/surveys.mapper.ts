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
  /** "38%", or null when nobody was asked. Never "0%" for that. */
  completion: string | null
  nps: NpsView
}

/** The API's NPS: promoters (9–10) less detractors (0–6), in whole points. */
export interface NpsWire {
  /** −100 to 100; null when nobody answered a recommendation question. */
  score: number | null
  answers: number
  promoters: number
  passives: number
  detractors: number
}

export interface SummaryWire {
  responses: number
  average: number | null
  distribution: Record<string, number>
  /** People the post-event thank-you reached, once per event. */
  asked: number
  /** Whole percent of those asked who answered; null when nobody was asked. */
  completionRate: number | null
  nps: NpsWire
}

type NpsGroupKey = 'promoters' | 'passives' | 'detractors'

/**
 * The three bands, best first. Labels only: which score falls in which band
 * is the API's rule, and the page never recomputes it.
 */
const NPS_GROUPS: readonly { key: NpsGroupKey; label: string; range: string }[] = [
  { key: 'promoters', label: 'Promoters', range: '9–10' },
  { key: 'passives', label: 'Passives', range: '7–8' },
  { key: 'detractors', label: 'Detractors', range: '0–6' },
]

export interface NpsSplit {
  key: NpsGroupKey
  label: string
  range: string
  count: number
  /** Share of the recommendation answers, for the bar's width. */
  percent: number
}

export interface NpsView {
  /** "+25", "0" or "-40"; null when nobody answered. Never "0" for that. */
  score: string | null
  answers: number
  split: NpsSplit[]
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
      percent: shareOf(row.count, rated),
    })),
    completion: completionOf(wire.completionRate),
    nps: toNpsView(wire.nps),
  }
}

/**
 * Signed, as the kit shows it: "+25". Nought is a real score — as many
 * promoters as detractors — so it reads "0", not "+0" and not the dash.
 */
export function formatNps(score: number | null): string | null {
  if (score === null) return null
  return score > 0 ? `+${score}` : String(score)
}

/** Percentages are of the recommendation answers, so the three bars add up. */
export function toNpsView(wire: NpsWire): NpsView {
  return {
    score: formatNps(wire.score),
    answers: wire.answers,
    split: NPS_GROUPS.map((group) => ({
      ...group,
      count: wire[group.key],
      percent: shareOf(wire[group.key], wire.answers),
    })),
  }
}

const PERCENT = 100

/** A bar's width: 0 rather than NaN when there is nothing to share out. */
function shareOf(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * PERCENT)
}

/**
 * Not `pct()` from `@/lib/format`, which takes a ratio and multiplies: the API
 * sends this already out of a hundred, and `pct(45)` would read "4500%".
 */
function completionOf(rate: number | null): string | null {
  return rate === null ? null : `${rate}%`
}
