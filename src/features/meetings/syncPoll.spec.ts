import { describe, expect, it } from 'vitest'
import { NO_POLLS, SYNC_POLL_LIMIT, SYNC_POLL_MS, budgetFor, mayPoll, spend } from './syncPoll'

/*
 * US-MTG-04 AC1: the list re-reads itself while an invite is on its way, so
 * a card turns synced without a reload — but a worker that never answers
 * must not cost a request every three seconds for as long as the tab is open.
 */
describe('the pending-invite poll', () => {
  it('reads every three seconds, at most ten times per pending set', () => {
    expect(SYNC_POLL_MS).toBe(3000)
    expect(SYNC_POLL_LIMIT).toBe(10)
  })

  it('polls while something is pending and the budget lasts', () => {
    expect(mayPoll(budgetFor(NO_POLLS, 'm-1'))).toBe(true)
  })

  it('never polls when nothing is pending', () => {
    expect(mayPoll(budgetFor(NO_POLLS, ''))).toBe(false)
  })

  it('stops after ten reads of the same pending set', () => {
    let budget = budgetFor(NO_POLLS, 'm-1')
    let reads = 0
    while (mayPoll(budget)) {
      budget = spend(budget)
      reads += 1
      // Each revalidation brings new data with the same set still pending.
      budget = budgetFor(budget, 'm-1')
    }

    expect(reads).toBe(10)
  })

  it('starts counting again when the pending set changes', () => {
    let budget = budgetFor(NO_POLLS, 'm-1')
    for (let i = 0; i < SYNC_POLL_LIMIT; i += 1) budget = spend(budget)
    expect(mayPoll(budget)).toBe(false)

    const another = budgetFor(budget, 'm-1,m-2')

    expect(another).toEqual({ key: 'm-1,m-2', count: 0 })
    expect(mayPoll(another)).toBe(true)
  })

  it('keeps the count while the same set is still pending', () => {
    const budget = spend(spend(budgetFor(NO_POLLS, 'm-1')))

    expect(budgetFor(budget, 'm-1')).toBe(budget)
  })
})
