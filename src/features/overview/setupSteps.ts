/**
 * Turning the API's setup facts into what the checklist draws (US-DASH-01).
 *
 * The API answers one question per step — done, not done, or withheld. This
 * decides what that looks like: which step is ticked, and which single step is
 * the one to do next.
 */

export type StepState = 'done' | 'current' | 'todo' | 'unknown'

/**
 * The state of each step, in the order given.
 *
 * `null` means the server would not say — either the caller may not be told, or
 * the read failed. It is never treated as "not done": a tick would claim
 * something the server never said, and a highlight would tell somebody to go
 * and do a thing that may already be finished. It renders as neither.
 *
 * Exactly one step is `current`: the first that is *known* not to be done.
 * Order is presentation, not truth — a workspace can add a ticket type before
 * filling in its tax details, and both are reported as they actually are.
 */
export function stepStatesOf(facts: readonly (boolean | null)[]): StepState[] {
  let nextTaken = false
  return facts.map((fact) => {
    if (fact === null) return 'unknown'
    if (fact) return 'done'
    if (nextTaken) return 'todo'
    nextTaken = true
    return 'current'
  })
}
