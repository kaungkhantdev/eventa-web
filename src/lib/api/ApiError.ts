import type { FailureEnvelope, FieldError } from './envelope'

/** What the API says went wrong, in a form a page can act on. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: FieldError[]
  readonly correlationId: string | null

  constructor(status: number, body: Partial<FailureEnvelope>) {
    super(body.message ?? DEFAULT_MESSAGE[status] ?? 'Something went wrong.')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code ?? codeFor(status)
    this.fieldErrors = body.errors ?? []
    this.correlationId = body.correlationId ?? null
  }

  /** The caller is not signed in, or their session has expired. */
  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** Signed in, but this action is not theirs to take. */
  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  /**
   * The request was well-formed but the world disagreed — a stale version, a
   * sold-out tier, a decision someone else already made. These are the ones
   * worth showing verbatim: the API writes them for the person reading.
   */
  get isConflict(): boolean {
    return this.status === 409
  }

  /** A rejected field (400) or a refused rule (422). */
  get isValidation(): boolean {
    return this.status === 400 || this.status === 422
  }

  /** Field errors keyed by field name, for form rendering. */
  byField(): Record<string, string> {
    return Object.fromEntries(this.fieldErrors.map((e) => [e.field, e.message]))
  }
}

/** The network never reached the API — offline, DNS, CORS, server down. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("We couldn't reach the server. Check your connection and try again.")
    this.name = 'NetworkError'
    this.cause = cause
  }
}

const DEFAULT_MESSAGE: Record<number, string> = {
  401: 'Please sign in again.',
  403: "You don't have access to that.",
  404: "That isn't available.",
  500: 'Something went wrong on our side. Please try again.',
}

function codeFor(status: number): string {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 400 || status === 422) return 'VALIDATION_ERROR'
  return 'UNKNOWN'
}
