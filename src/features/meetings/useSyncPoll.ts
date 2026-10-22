import { useEffect, useRef } from 'react'
import { useRevalidator } from 'react-router'
import { pendingKeyOf } from './meetings.mapper'
import type { MeetingCard } from './meetings.types'
import { NO_POLLS, budgetFor, mayPoll, spend } from './syncPoll'
import { SYNC_POLL_MS } from '@/lib/constants/meetings.constants'

/**
 * Re-read the meetings while an invite is on its way (US-MTG-04 AC1), within
 * the budget `./syncPoll` sets out.
 *
 * Nothing pauses for the open panel: the meeting being edited is held in the
 * page's state, so a fresh read cannot reset a form somebody is typing in.
 */
export function useSyncPoll(cards: readonly MeetingCard[]): void {
  const { revalidate } = useRevalidator()
  const key = pendingKeyOf(cards)
  // A ref, not state: counting a read must not itself cause a render.
  const budget = useRef(NO_POLLS)

  useEffect(() => {
    budget.current = budgetFor(budget.current, key)
    if (!mayPoll(budget.current)) return

    const timer = window.setInterval(() => {
      if (!mayPoll(budget.current)) {
        window.clearInterval(timer)
        return
      }
      budget.current = spend(budget.current)
      void revalidate()
    }, SYNC_POLL_MS)
    return () => window.clearInterval(timer)
  }, [key, revalidate])
}
