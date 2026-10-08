import { ApiError } from './ApiError'

const FALLBACK = 'Something went wrong. Please try again.'

/**
 * The one sentence to put in front of the person when a request fails.
 *
 * Field errors win over the envelope's summary: the API's top-level message for
 * a rejected DTO is "Validation failed.", which tells nobody anything, while
 * the field messages say exactly what to change. For every other failure the
 * API's own message is used verbatim — a 409 in this product is written for the
 * person reading it ("cancel and refund it instead"), and paraphrasing it would
 * lose the instruction.
 */
export function messageOf(cause: unknown): string {
  if (cause instanceof ApiError && cause.fieldErrors.length > 0) {
    return cause.fieldErrors.map((e) => e.message).join(' ')
  }
  if (cause instanceof Error && cause.message) return cause.message
  return FALLBACK
}
