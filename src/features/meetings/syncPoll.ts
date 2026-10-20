/**
 * How the meetings list waits for an invite to go out (US-MTG-04 AC1).
 *
 * The worker sends the invite a moment after the save, so a new card first
 * reads "not been sent yet" and then turns synced with its Meet link. The page
 * re-reads itself meanwhile — within a budget, so a worker that never answers
 * costs {@link SYNC_POLL_LIMIT} requests per set of pending meetings rather
 * than one every few seconds for as long as the tab stays open.
 */

/** How often the list re-reads itself while an invite is on its way. */
export const SYNC_POLL_MS = 3000

/** Reads per distinct set of pending meetings before the page stops asking. */
export const SYNC_POLL_LIMIT = 10

/** Which pending set is being waited on (`pendingKeyOf`), and reads spent on it. */
export interface PollBudget {
  readonly key: string
  readonly count: number
}

export const NO_POLLS: PollBudget = { key: '', count: 0 }

/**
 * The budget for the pending set now on screen. A different set — a meeting
 * scheduled, one settled — starts the count again; the same set keeps it, so
 * each revalidation's fresh data does not reset it.
 */
export function budgetFor(budget: PollBudget, key: string): PollBudget {
  return budget.key === key ? budget : { key, count: 0 }
}

export function mayPoll(budget: PollBudget): boolean {
  return budget.key !== '' && budget.count < SYNC_POLL_LIMIT
}

export function spend(budget: PollBudget): PollBudget {
  return { key: budget.key, count: budget.count + 1 }
}
