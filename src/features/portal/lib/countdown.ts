import { useEffect, useState } from 'react'

/**
 * The clock on a seat hold.
 *
 * Split in two on purpose: `remainingOf` is the rule and is unit-tested;
 * `useCountdown` is the tick that re-renders it. The deadline itself is an
 * absolute instant from the API — UTC on the wire — so there is no timezone
 * arithmetic here, only a subtraction.
 */

const SECOND = 1000
const MINUTE = 60

export interface Remaining {
  /** `m:ss`, or `null` when there is no deadline to count to. */
  label: string | null
  /** True once the deadline has passed — the seats are back on sale. */
  lapsed: boolean
  msLeft: number
}

export function remainingOf(deadline: string | null, now: Date): Remaining {
  // No hold is not an expired hold: this order was never on a clock.
  if (!deadline) return { label: null, lapsed: false, msLeft: 0 }
  const msLeft = Math.max(0, new Date(deadline).getTime() - now.getTime())
  return { label: clockOf(msLeft), lapsed: msLeft === 0, msLeft }
}

function clockOf(msLeft: number): string {
  const total = Math.floor(msLeft / SECOND)
  const seconds = total % MINUTE
  return `${Math.floor(total / MINUTE)}:${String(seconds).padStart(2, '0')}`
}

/**
 * The same, re-read every second while a deadline is live.
 *
 * The interval stops at zero rather than running forever behind an expired
 * order — nothing below this changes again, and a page left open overnight
 * should not keep waking up to prove it.
 */
export function useCountdown(deadline: string | null): Remaining {
  const [remaining, setRemaining] = useState(() => remainingOf(deadline, new Date()))
  const [countingTo, setCountingTo] = useState(deadline)

  // Re-read during render rather than in an effect: a new deadline makes the
  // old clock wrong immediately, and rendering the stale one for a frame would
  // show a countdown that belongs to another order.
  if (countingTo !== deadline) {
    setCountingTo(deadline)
    setRemaining(remainingOf(deadline, new Date()))
  }

  useEffect(() => {
    if (!deadline) return
    const timer = setInterval(() => {
      const next = remainingOf(deadline, new Date())
      setRemaining(next)
      if (next.lapsed) clearInterval(timer)
    }, SECOND)
    return () => clearInterval(timer)
  }, [deadline])

  return remaining
}
