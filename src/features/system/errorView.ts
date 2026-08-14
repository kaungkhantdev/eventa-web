import { ApiError, NetworkError, messageOf } from '@/lib/api'

/**
 * What to put in front of someone when a page could not load.
 *
 * Pure, and tested, because it decides two things that are easy to get wrong:
 * whether a failure is the person's problem or ours, and how much of the cause
 * they are allowed to see. A refusal is not a crash — being told "you don't
 * have access" and being shown a broken screen are different facts, and only
 * one of them is worth retrying.
 */

/** Which shape of failure this is — the icon and tone follow from it. */
export type ErrorKind = 'forbidden' | 'missing' | 'offline' | 'failed'

export interface ErrorView {
  kind: ErrorKind
  title: string
  /** The API's own sentence, or null when the cause is not safe to show. */
  detail: string | null
  /** Whether trying again could plausibly work. */
  canRetry: boolean
}

const TITLE: Record<ErrorKind, string> = {
  forbidden: 'You don’t have access to this',
  missing: 'Not found',
  offline: 'Can’t reach the server',
  failed: 'Something went wrong',
}

export function errorViewOf(cause: unknown): ErrorView {
  // Its message is ours, not a server's — and "check your connection" is the
  // only actionable thing on that screen. The wrapped cause (a browser
  // `TypeError: Failed to fetch`) stays out of sight.
  if (cause instanceof NetworkError) return view('offline', cause.message, true)

  if (cause instanceof ApiError) {
    // `messageOf` rather than `.message`: for a rejected DTO the envelope's
    // summary is "Validation failed.", and the field messages are the ones
    // that say what to change. Everything else it passes through verbatim —
    // the server's wording is written for the reader ("requires an admin
    // account" is more use than "forbidden").
    const detail = messageOf(cause)
    if (cause.isForbidden) return view('forbidden', detail, false)
    if (cause.isNotFound) return view('missing', detail, false)
    return view('failed', detail, true)
  }

  // Anything else is a bug in this app: a TypeError naming one of our own
  // variables, or a value that was never an Error at all. Its message
  // describes our source rather than their problem, so it is not shown —
  // it belongs in an error reporter, not on the screen.
  return view('failed', null, true)
}

function view(kind: ErrorKind, detail: string | null, canRetry: boolean): ErrorView {
  return { kind, title: TITLE[kind], detail, canRetry }
}
