import { useEffect, useRef } from 'react'
import { Link, useFetcher, useLoaderData } from 'react-router'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import { EventChooser } from '../components/EventChooser'
import { ManualSearch } from '../components/ManualSearch'
import { ScanResult } from '../components/ScanResult'
import type { StationData } from '../door.routes'
import type { AttendanceRow, DoorCounts, ScanFeedback } from '../door.types'

/**
 * The door station (US-REG-12/13). Ported from checkin-tool.html.
 *
 * The kit simulated a camera: a canned queue of outcomes played back on a
 * timer, so the screen always "worked" and never told the truth. This reads
 * real codes and shows what the API actually said about each one.
 *
 * The code box IS the scanner. A USB or Bluetooth QR reader types what it
 * reads and presses Enter, which is exactly this — and the same box takes a
 * code keyed in by hand when a badge will not read. Camera capture needs a
 * decoder this app does not have yet, and is not faked in the meantime.
 */

type ScanAction = { scan: ScanFeedback } | { ok: false; error: string }

export default function CheckInToolPage() {
  const data = useLoaderData() as StationData
  const scan = useFetcher<ScanAction>()
  const feedback = scan.data && 'scan' in scan.data ? scan.data.scan : null
  const error = scan.data && 'ok' in scan.data && !scan.data.ok ? scan.data.error : null

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <header className="sticky top-0 z-30 border-b border-hair bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 lg:px-6">
          <Link
            to={`/admin/check-in${data.event ? `?eventId=${data.event.id}` : ''}`}
            className="flex items-center gap-2 text-[13px] font-medium text-muted transition hover:text-ink"
          >
            <Icon name="hgi-arrow-left-01" size={16} />
            <span className="hidden sm:inline">Back to check-in</span>
          </Link>
          <EventChooser
            events={data.events}
            value={data.event?.id ?? ''}
            onChange={(eventId) => {
              window.location.search = `?eventId=${encodeURIComponent(eventId)}`
            }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        <Stats counts={data.counts} />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <CodeBox eventId={data.event?.id ?? ''} fetcher={scan} />
            {feedback && <ScanResult feedback={feedback} />}
            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
              >
                {error}
              </p>
            )}
            <ManualSearch eventId={data.event?.id ?? ''} />
          </div>

          <Feed feed={data.feed} />
        </div>
      </main>
    </div>
  )
}

function Stats({ counts }: { counts: DoorCounts }) {
  const cards = [
    { label: 'Checked in', value: String(counts.checkedIn), brand: true },
    { label: 'Still expected', value: String(counts.expected), brand: false },
    { label: 'Tickets issued', value: String(counts.total), brand: false },
    { label: 'Of the room', value: `${counts.percent}%`, brand: true },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {card.label}
          </p>
          <p
            className={cn(
              'tnum mt-1 text-[26px] font-extrabold',
              card.brand ? 'text-brand' : 'text-ink',
            )}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * Where the code arrives.
 *
 * Cleared and refocused after every read, so a hardware scanner can fire one
 * code after another without anybody touching the keyboard.
 */
function CodeBox({
  eventId,
  fetcher,
}: {
  eventId: string
  fetcher: ReturnType<typeof useFetcher<ScanAction>>
}) {
  const box = useRef<HTMLInputElement>(null)
  const busy = fetcher.state !== 'idle'

  useEffect(() => {
    if (busy || !box.current) return
    box.current.value = ''
    box.current.focus()
  }, [busy, fetcher.data])

  return (
    <div className="card p-5">
      <h2 className="text-[15px] font-bold tracking-tight">Scan a ticket</h2>
      <p className="mt-0.5 text-[12.5px] text-muted">
        Point a QR reader at this page, or key the code in by hand.
      </p>
      <fetcher.Form method="post" className="mt-4 flex gap-2">
        <input type="hidden" name="eventId" value={eventId} />
        <input
          ref={box}
          name="qrToken"
          type="text"
          required
          autoFocus
          autoComplete="off"
          disabled={!eventId || busy}
          aria-label="Ticket code"
          placeholder="Ticket code"
          className="input h-12 flex-1 text-[15px]"
        />
        <button type="submit" className="btn btn-primary h-12 px-5" disabled={!eventId || busy}>
          <Icon name="hgi-qr-code-01" size={18} />
          {busy ? 'Checking…' : 'Check in'}
        </button>
      </fetcher.Form>
    </div>
  )
}

function Feed({ feed }: { feed: AttendanceRow[] }) {
  return (
    <div className="card h-fit p-5">
      <h2 className="text-[15px] font-bold tracking-tight">Just arrived</h2>
      {feed.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted">Nobody has come through yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {feed.map((row) => (
            <li key={row.ticketId} className="flex items-center gap-3 py-2.5">
              <span className="avatar h-8 w-8 text-[11px]">{row.initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{row.name}</p>
                <p className="truncate text-[11.5px] text-muted">{row.ticketType}</p>
              </div>
              <span className="tnum shrink-0 text-[12px] text-muted">{row.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
