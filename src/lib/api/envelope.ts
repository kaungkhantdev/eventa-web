/**
 * The shapes eventa-api puts on the wire.
 *
 * Every successful response is wrapped by the API's `ResponseInterceptor`:
 * `{ success, statusCode, message, data, meta?, timestamp }`. A list adds
 * `meta` with the page numbers, plus whatever extra facts that endpoint hangs
 * there (status-tab counts, an empty-state message). Errors bypass the
 * interceptor and are rendered by the exception filter instead, so they carry a
 * `code` and — for a rejected DTO — a `errors` array of field messages.
 *
 * Nothing here is generated. Keeping it hand-written is deliberate while the
 * surface is still moving: a mismatch shows up as a compile error in the one
 * feature that uses the endpoint, rather than a regenerated file the whole app
 * has to be re-checked against.
 */

export interface PageMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SuccessEnvelope<T> {
  success: true
  statusCode: number
  message: string
  data: T
  /** Present on list endpoints; extra keys vary by endpoint. */
  meta?: PageMeta & Record<string, unknown>
  timestamp: string
}

/** One rejected field, as the validation pipe reports it. */
export interface FieldError {
  field: string
  message: string
}

export interface FailureEnvelope {
  success: false
  statusCode: number
  /** `VALIDATION_ERROR`, `CONFLICT`, `NOT_FOUND`, … */
  code?: string
  message: string
  errors?: FieldError[]
  correlationId?: string
  timestamp?: string
}

/** A list response, flattened into the shape a page actually wants. */
export interface Page<T> {
  items: T[]
  meta: PageMeta & Record<string, unknown>
}

/** The page numbers a list endpoint reports when it returns nothing at all. */
export const EMPTY_META: PageMeta & Record<string, unknown> = {
  total: 0,
  page: 1,
  limit: 0,
  totalPages: 0,
}
