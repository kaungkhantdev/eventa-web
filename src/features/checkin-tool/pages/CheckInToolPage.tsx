import { useCallback, useRef, useState } from 'react'
import { PageFooter } from '@/components/ui'
import { CheckInHeader } from '../components/CheckInHeader'
import { CheckInScanner } from '../components/CheckInScanner'
import { CheckInStats } from '../components/CheckInStats'
import { CheckInFeed, type FeedItem } from '../components/CheckInFeed'
import { EVENTS, INITIAL_FEED, STATS, type EventStats, type FeedInput } from '../data/checkin'

/* Check-in station: a QR scanner bound to one event, a live counter and a feed.
   A valid scan (camera, Simulate scan, or a manual "Check in") bumps the
   event's counter and prepends the attendee to the feed. */
export default function CheckInToolPage() {
  const [event, setEvent] = useState<string>(EVENTS[0])
  const [statsByEvent, setStatsByEvent] = useState<Record<string, EventStats>>(() =>
    Object.fromEntries(Object.entries(STATS).map(([k, v]) => [k, { ...v }])),
  )
  const [feed, setFeed] = useState<FeedItem[]>(() => INITIAL_FEED.map((e, i) => ({ ...e, id: i })))
  const nextId = useRef(INITIAL_FEED.length)

  // read the live event inside the stable checkIn callback
  const eventRef = useRef(event)
  eventRef.current = event

  // The picker offers the full catalog, but only some events have seeded stats.
  // Mirror the static kit's `if (!s) return` — keep the last valid stats shown
  // when switching to an event that has none, so it never renders undefined.
  const lastStats = useRef<EventStats>(STATS[EVENTS[0]]!)
  if (statsByEvent[event]) lastStats.current = statsByEvent[event]!
  const stats = statsByEvent[event] ?? lastStats.current

  const checkIn = useCallback((entry: FeedInput) => {
    setFeed((prev) => [{ ...entry, time: 'just now', id: nextId.current++ }, ...prev])
    setStatsByEvent((prev) => {
      const ev = eventRef.current
      const s = prev[ev]
      if (!s || s.checked >= s.total) return prev
      return { ...prev, [ev]: { ...s, checked: s.checked + 1, onsite: s.onsite + 1 } }
    })
  }, [])

  return (
    <>
      <CheckInHeader event={event} onEventChange={setEvent} />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        {/* ===== scanner (hero) ===== */}
        <CheckInScanner event={event} onCheckIn={checkIn} />

        {/* ===== side rail: counter + live feed ===== */}
        <div className="flex flex-col gap-3 xl:col-span-2">
          <CheckInStats stats={stats} />
          <CheckInFeed feed={feed} />
        </div>
      </div>

      <PageFooter />
    </>
  )
}
